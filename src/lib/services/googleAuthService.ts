import { supabase } from "@/utils/supabase/client";
import { config } from "@/lib/config";

export interface GoogleUserData {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  google_id: string;
  profile_picture?: string;
}

export class GoogleAuthService {
  /**
   * Inicia el proceso de autenticación con Google
   */
  static async signInWithGoogle() {
    try {
      console.log("🔐 Iniciando autenticación con Google...");
      
      // Detectar dinámicamente la URL actual del navegador
      const currentUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : config.app.url;
      
      console.log("🌐 URL detectada:", currentUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${currentUrl}/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("❌ Error al iniciar autenticación con Google:", error);
        throw error;
      }

      console.log("✅ Redirección a Google iniciada");
      return { success: true, data };
    } catch (error) {
      console.error("💥 Error inesperado en autenticación con Google:", error);
      return { success: false, error };
    }
  }

  /**
   * Maneja el callback de autenticación de Google
   */
  static async handleAuthCallback() {
    try {
      console.log("🔄 Manejando callback de autenticación...");
      
      // Obtener la sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("❌ Error al obtener sesión en callback:", sessionError);
        throw sessionError;
      }

      if (session?.user) {
        console.log("✅ Usuario autenticado en callback:", session.user.email);
        return { success: true, session, user: session.user };
      } else {
        console.log("⏳ No hay sesión en callback, esperando...");
        return { success: false, session: null, user: null };
      }
    } catch (error) {
      console.error("💥 Error en handleAuthCallback:", error);
      return { success: false, error };
    }
  }

  /**
   * Verifica si hay una sesión activa
   */
  static async checkActiveSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ Error al verificar sesión activa:", error);
        return { success: false, session: null };
      }

      return { success: true, session };
    } catch (error) {
      console.error("💥 Error inesperado al verificar sesión:", error);
      return { success: false, error };
    }
  }

  /**
   * Cierra la sesión
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("❌ Error al cerrar sesión:", error);
        throw error;
      }

      console.log("✅ Sesión cerrada exitosamente");
      return { success: true };
    } catch (error) {
      console.error("💥 Error inesperado al cerrar sesión:", error);
      return { success: false, error };
    }
  }

  /**
   * Registra un usuario de Google
   */
  static async registerGoogleUser(googleUserData: GoogleUserData) {
    try {
      console.log("🔄 Registrando usuario de Google...");
      
      // Crear usuario en la tabla de usuarios
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: googleUserData.email,
          name: googleUserData.name,
          google_id: googleUserData.id,
          profile_picture: googleUserData.picture,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Error al registrar usuario:", error);
        return { success: false, error };
      }

      console.log("✅ Usuario registrado exitosamente");
      return { success: true, data: { userRecord: data } };
    } catch (error) {
      console.error("💥 Error inesperado al registrar usuario:", error);
      return { success: false, error };
    }
  }

  /**
   * Verifica si un usuario de Google ya existe
   */
  static async checkGoogleUserExists(email: string) {
    try {
      console.log("🔍 Verificando si existe usuario...");
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("❌ Error al verificar usuario:", error);
        return { exists: false, error };
      }

      return { exists: !!data, data };
    } catch (error) {
      console.error("💥 Error inesperado al verificar usuario:", error);
      return { exists: false, error };
    }
  }

  /**
   * Actualiza un usuario de Google
   */
  static async updateGoogleUser(userId: number, updates: Partial<CreateUserData>) {
    try {
      console.log("📝 Actualizando usuario...");
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al actualizar usuario:", error);
        return { success: false, error };
      }

      console.log("✅ Usuario actualizado exitosamente");
      return { success: true, data };
    } catch (error) {
      console.error("💥 Error inesperado al actualizar usuario:", error);
      return { success: false, error };
    }
  }

  /**
   * Inicia sesión con un usuario de Google existente
   */
  static async signInGoogleUser(email: string) {
    try {
      console.log("🔐 Iniciando sesión...");
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error("❌ Error al iniciar sesión:", error);
        return { success: false, error };
      }

      console.log("✅ Inicio de sesión exitoso");
      return { success: true, data };
    } catch (error) {
      console.error("💥 Error inesperado al iniciar sesión:", error);
      return { success: false, error };
    }
  }
}

export default GoogleAuthService;
