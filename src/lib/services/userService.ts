import { supabase } from "@/utils/supabase/client";

export interface UserData {
  user_id: string;
  email: string;
  name: string;
  last_name: string;
  role: number;
  is_active: boolean;
  rut?: string;
  phone_number?: string;
  birth_date?: string;
  address?: string;
}

export class UserService {
  /**
   * Verifica si un usuario existe en la tabla users
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // Solo loguear errores que no sean "no encontrado"
        if (error.code !== "PGRST116") {
          console.error("❌ Error al verificar usuario:", error);
        }
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("💥 Error inesperado al verificar usuario:", error);
      return false;
    }
  }

  /**
   * Crea un nuevo usuario en la tabla users
   */
  static async createUser(userData: UserData) {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert({
          user_id: userData.user_id,
          email: userData.email,
          name: userData.name,
          last_name: userData.last_name,
          role: userData.role,
          is_active: userData.is_active,
          rut: userData.rut,
          phone_number: userData.phone_number,
          birth_date: userData.birth_date,
          address: userData.address,
          created_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (error) {
        // Si es un error de duplicación, considerarlo como éxito
        if (error.code === '23505' && error.message.includes('duplicate key')) {
          // Intentar obtener el usuario existente
          const existingUser = await this.getUserById(userData.user_id);
          if (existingUser.success && existingUser.data) {
            return { success: true, data: existingUser.data, isExisting: true };
          }
        }
        
        console.error("❌ Error al crear usuario:", error);
        return { success: false, error };
      }

      if (!data) {
        // Si no hay datos pero tampoco hay error, intentar obtener el usuario
        const existingUser = await this.getUserById(userData.user_id);
        if (existingUser.success && existingUser.data) {
          return { success: true, data: existingUser.data, isExisting: true };
        }
        return { success: false, error: { message: "No se pudo crear el usuario" } };
      }

      return { success: true, data };
    } catch (error) {
      console.error("💥 Error inesperado al crear usuario:", error);
      return { success: false, error };
    }
  }

  /**
   * Obtiene información de un usuario por su user_id
   */
  static async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        // Solo loguear errores que no sean "no encontrado"
        if (error.code !== "PGRST116") {
          console.error("Error al obtener usuario:", error);
        }
        return { success: false, error, data: null };
      }

      if (!data) {
        return { success: false, error: { code: "PGRST116", message: "Usuario no encontrado" }, data: null };
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error inesperado al obtener usuario:", error);
      return { success: false, error };
    }
  }
}
