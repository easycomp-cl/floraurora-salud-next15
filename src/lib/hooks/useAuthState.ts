import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const isInitialized = useRef(false);
  const mountedRef = useRef(true);
  const router = useRouter();

  const updateAuthState = useCallback(async (user: User | null, session: Session | null) => {
    if (!mountedRef.current) return;
    
    // Verificar si el usuario está bloqueado antes de actualizar el estado
    if (user && user.app_metadata?.blocked === true) {
      console.warn("🚫 useAuthState: Usuario bloqueado detectado, cerrando sesión...");
      
      // Cerrar sesión inmediatamente
      try {
        await supabase.auth.signOut();
        // Limpiar estado local
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sb-auth-token');
          localStorage.removeItem('supabase.auth.token');
        }
        // Redirigir a login con mensaje de error
        router.push("/login?error=account_blocked");
      } catch (error) {
        console.error("Error al cerrar sesión de usuario bloqueado:", error);
      }
      
      // Actualizar estado como no autenticado
      setAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }
    
    // console.log("🔄 useAuthState: Actualizando estado", {
    //   hasUser: !!user,
    //   hasSession: !!session,
    //   userEmail: user?.email
    // });

    const newState = {
      user,
      session,
      isLoading: false,
      isAuthenticated: !!user && !!session,
    };

    setAuthState(newState);

    // NOTA: La redirección ahora se maneja en useAuthRedirect
    // No redirigir automáticamente aquí para evitar conflictos
  }, [router]);

  const getInitialSession = useCallback(async () => {
    try {
      //console.log("🔍 useAuthState: Obteniendo sesión inicial...");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        //console.error("❌ useAuthState: Error al obtener sesión inicial:", error);
        updateAuthState(null, null);
        return;
      }

      if (session?.user) {
        //console.log("✅ useAuthState: Sesión inicial encontrada:", session.user.email);
        updateAuthState(session.user, session);
      } else {
        //console.log("ℹ️ useAuthState: No hay sesión inicial");
        updateAuthState(null, null);
      }
    } catch {
      //console.error("💥 useAuthState: Error inesperado:", error);
      updateAuthState(null, null);
    }
  }, [updateAuthState]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Obtener sesión inicial
    getInitialSession();

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;
        
        // console.log("🔄 useAuthState: Cambio de estado detectado:", {
        //   event,
        //   hasSession: !!session,
        //   userEmail: session?.user?.email
        // });

        if (event === "SIGNED_IN" && session) {
          updateAuthState(session.user, session);
        } else if (event === "SIGNED_OUT") {
          //console.log("🚪 useAuthState: Usuario cerró sesión");
          updateAuthState(null, null);
        } else if (event === "TOKEN_REFRESHED" && session) {
          updateAuthState(session.user, session);
        } else if (event === "USER_UPDATED" && session) {
          updateAuthState(session.user, session);
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [getInitialSession, updateAuthState]);

  const signOut = useCallback(async () => {
    try {
      //console.log("🚪 useAuthState: Iniciando cierre de sesión...");
      
      // Limpiar estado inmediatamente para evitar retrasos
      setAuthState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false
      }));

      // Limpiar localStorage primero
      if (typeof window !== 'undefined') {
        // Limpiar todas las claves relacionadas con Supabase
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Cerrar sesión en Supabase (esto limpia las cookies del cliente)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }
      } catch {
        // Ignorar errores silenciosamente
      }
      
      // Forzar limpieza de cookies HTTP haciendo una llamada al servidor
      // Esto es crítico para evitar cookies desactualizadas en futuras sesiones
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include', // Importante: incluir cookies
        }).catch(() => {
          // Ignorar errores si la ruta no existe o hay problemas de red
        });
      } catch {
        // Ignorar errores silenciosamente
      }
      
      // Redirigir inmediatamente después del cierre de sesión
      router.push("/");
    } catch (error) {
      console.error("💥 useAuthState: Error inesperado al cerrar sesión:", error);
      throw error;
    }
  }, [router]);

  return {
    ...authState,
    signOut,
    supabase,
  };
}
