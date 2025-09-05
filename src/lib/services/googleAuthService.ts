import { supabase } from "@/utils/supabase/client";

export class GoogleAuthService {
  /**
   * Inicia el proceso de autenticación con Google
   */
  static async signInWithGoogle() {
    try {
      console.log("🔐 Iniciando autenticación con Google...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`,
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
}
