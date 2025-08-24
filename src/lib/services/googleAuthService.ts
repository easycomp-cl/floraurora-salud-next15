import { supabase } from '../../utils/supabase/client';

// Interfaz para los datos del usuario de Google
export interface GoogleUserData {
  sub: string;           // Google ID único
  name: string;          // Nombre completo
  given_name: string;    // Nombre
  family_name: string;   // Apellido
  email: string;         // Email
  email_verified: boolean; // Si el email está verificado
}

// Interfaz para crear usuario en la tabla Users
export interface CreateUserData {
  id: number;            // ID numérico (timestamp)
  user_id: string;       // UUID del usuario autenticado (auth.uid())
  name: string;          // Nombre (given_name)
  last_name: string;     // Apellido (family_name)
  email: string;         // Email
  role: number;          // Rol por defecto (1 = paciente)
  is_active: boolean;    // Activo por defecto
  created_at: string;    // Timestamp actual
}

/**
 * Servicio para manejar la autenticación y registro de usuarios de Google
 */
export class GoogleAuthService {
  
  /**
   * Determina el nombre correcto de la tabla de usuarios
   */
  private static async getTableName(): Promise<string> {
    try {
      // Intentar primero con minúsculas
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (!usersError) {
        console.log('✅ Tabla "users" encontrada');
        return 'users';
      }

      // Intentar con mayúsculas
      const { data: UsersData, error: UsersError } = await supabase
        .from('Users')
        .select('id')
        .limit(1);

      if (!UsersError) {
        console.log('✅ Tabla "Users" encontrada');
        return 'Users';
      }

      throw new Error('No se puede acceder a ninguna tabla de usuarios');
    } catch (error) {
      console.error('❌ Error al determinar nombre de tabla:', error);
      throw error;
    }
  }

  /**
   * Obtiene la estructura de la tabla de usuarios
   */
  private static async getTableStructure(tableName: string) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        return Object.keys(data[0]);
      }

      return [];
    } catch (error) {
      console.error('❌ Error al obtener estructura de tabla:', error);
      throw error;
    }
  }

  /**
   * Registra un usuario de Google en Supabase Auth y en la tabla Users
   * @param googleUserData - Datos del usuario proporcionados por Google
   * @returns Promise con el resultado de la operación
   */
  static async registerGoogleUser(googleUserData: GoogleUserData) {
    try {
      console.log('🚀 Iniciando registro de usuario de Google:', googleUserData);
      
      // 1. Determinar el nombre correcto de la tabla
      const tableName = await this.getTableName();
      console.log(`📋 Usando tabla: ${tableName}`);
      
      // 2. Obtener la estructura de la tabla
      const tableColumns = await this.getTableStructure(tableName);
      console.log(`📊 Columnas disponibles: ${tableColumns.join(', ')}`);
      
      // 3. Crear el usuario en Supabase Auth
      console.log('📝 Creando usuario en Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: googleUserData.email,
        password: this.generateSecurePassword(),
        options: {
          data: {
            google_id: googleUserData.sub,
            full_name: googleUserData.name,
            email_verified: googleUserData.email_verified
          }
        }
      });

      if (authError) {
        console.error('❌ Error al crear usuario en Auth:', authError);
        return { success: false, error: authError, data: null };
      }

      if (!authData.user) {
        console.error('❌ No se pudo crear el usuario en Auth');
        return { success: false, error: 'No se pudo crear el usuario en Auth', data: null };
      }

      console.log('✅ Usuario creado en Auth exitosamente:', authData.user.id);

      // 4. Crear el usuario en la tabla Users
      console.log('📝 Creando usuario en tabla Users...');
      
      // Preparar datos según la estructura de la tabla
      const userData: any = {
        id: Date.now(), // Usar timestamp como ID numérico
        user_id: authData.user.id, // UUID del usuario autenticado
        email: googleUserData.email,
        created_at: new Date().toISOString()
      };

      // Agregar campos según la estructura disponible
      if (tableColumns.includes('name')) {
        userData.name = googleUserData.given_name;
      }
      if (tableColumns.includes('last_name')) {
        userData.last_name = googleUserData.family_name;
      }
      if (tableColumns.includes('full_name')) {
        userData.full_name = googleUserData.name;
      }
      if (tableColumns.includes('role')) {
        userData.role = 1; // 1 = paciente por defecto
      }
      if (tableColumns.includes('is_active')) {
        userData.is_active = true;
      }
      if (tableColumns.includes('google_id')) {
        userData.google_id = googleUserData.sub;
      }

      console.log('📊 Datos a insertar en Users:', userData);

      // Insertar en la tabla
      const { data: userRecord, error: userError } = await supabase
        .from(tableName)
        .insert(userData)
        .select()
        .single();

      if (userError) {
        console.error('❌ Error al crear usuario en tabla Users:', userError);
        
        // Si falla la creación en Users, intentar eliminar el usuario de Auth
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🧹 Usuario eliminado de Auth por fallo en Users');
        } catch (deleteError) {
          console.error('⚠️ Error al eliminar usuario de Auth:', deleteError);
        }
        
        return { 
          success: false, 
          error: userError, 
          data: null 
        };
      }

      console.log('🎉 Usuario registrado exitosamente en ambos sistemas');
      return { 
        success: true, 
        error: null, 
        data: { 
          authUser: authData.user, 
          userRecord 
        } 
      };

    } catch (error) {
      console.error('💥 Error inesperado en registerGoogleUser:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error desconocido'), 
        data: null 
      };
    }
  }

  /**
   * Verifica si un usuario de Google ya existe en la base de datos
   * @param email - Email del usuario de Google
   * @returns Promise con el resultado de la verificación
   */
  static async checkGoogleUserExists(email: string) {
    try {
      console.log('🔍 Verificando si existe usuario con email:', email);
      
      const tableName = await this.getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .select('id, email, name, last_name')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error al verificar usuario:', error);
        return { exists: false, error, data: null };
      }

      const exists = !!data;
      console.log(`🔍 Usuario ${exists ? 'encontrado' : 'no encontrado'}:`, data);
      
      return { 
        exists, 
        error: null, 
        data 
      };
    } catch (error) {
      console.error('❌ Error inesperado al verificar usuario:', error);
      return { 
        exists: false, 
        error: error instanceof Error ? error : new Error('Error desconocido'), 
        data: null 
      };
    }
  }

  /**
   * Actualiza los datos de un usuario existente de Google
   * @param userId - ID numérico del usuario
   * @param updates - Datos a actualizar
   * @returns Promise con el resultado de la actualización
   */
  static async updateGoogleUser(userId: number, updates: Partial<CreateUserData>) {
    try {
      console.log('📝 Actualizando usuario:', userId, 'con datos:', updates);
      
      const tableName = await this.getTableName();
      
      const { data, error } = await supabase
        .from(tableName)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al actualizar usuario:', error);
        return { success: false, error, data: null };
      }

      console.log('✅ Usuario actualizado exitosamente');
      return { success: true, error: null, data };
    } catch (error) {
      console.error('❌ Error inesperado al actualizar usuario:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error desconocido'), 
        data: null 
      };
    }
  }

  /**
   * Genera una contraseña segura temporal para usuarios de Google
   * @returns Contraseña segura
   */
  private static generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Inicia sesión con un usuario de Google existente
   * @param email - Email del usuario
   * @returns Promise con el resultado del inicio de sesión
   */
  static async signInGoogleUser(email: string) {
    try {
      console.log('🔐 Iniciando sesión con usuario de Google:', email);
      
      const tableName = await this.getTableName();
      
      const { data: userRecord, error: userError } = await supabase
        .from(tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        console.error('❌ Error al buscar usuario:', userError);
        return { success: false, error: userError, data: null };
      }

      if (!userRecord) {
        console.error('❌ Usuario no encontrado');
        return { success: false, error: 'Usuario no encontrado', data: null };
      }

      console.log('✅ Usuario encontrado para inicio de sesión');
      return { success: true, error: null, data: userRecord };

    } catch (error) {
      console.error('❌ Error inesperado en signInGoogleUser:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Error desconocido'), 
        data: null 
      };
    }
  }
}

export default GoogleAuthService;
