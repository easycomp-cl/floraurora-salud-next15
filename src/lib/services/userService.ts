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
      console.log("🔍 Verificando si usuario existe en BD:", userId);
      console.log("📍 UserService.userExists ejecutándose...");
      
      const { data, error } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      console.log("📊 Respuesta de Supabase:", { data, error });

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error al verificar usuario:", error);
        return false;
      }

      if (data) {
        console.log("✅ Usuario EXISTE en la tabla users");
        return true;
      } else {
        console.log("❌ Usuario NO EXISTE en la tabla users");
        return false;
      }
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
      console.log("📝 Creando usuario en BD:", userData);
      
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
        .single();

      if (error) {
        console.error("❌ Error al crear usuario:", error);
        throw error;
      }

      console.log("✅ Usuario creado exitosamente:", data);
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
        .single();

      if (error) {
        console.error("Error al obtener usuario:", error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error("Error inesperado al obtener usuario:", error);
      return { success: false, error };
    }
  }
}
