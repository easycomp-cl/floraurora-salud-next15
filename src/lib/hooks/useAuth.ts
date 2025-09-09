import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const isInitialized = useRef(false);

  const updateAuthState = useCallback((user: User | null, session: Session | null) => {
    console.log("🔄 useAuth: Actualizando estado de autenticación", {
      hasUser: !!user,
      hasSession: !!session,
      userEmail: user?.email
    });

    setAuthState({
      user,
      session,
      isLoading: false,
      isAuthenticated: !!user && !!session,
    });
  }, []);

  const getInitialSession = useCallback(async () => {
    try {
      console.log("🔍 useAuth: Obteniendo estado inicial de autenticación...");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("❌ useAuth: Error al obtener sesión inicial:", error);
        updateAuthState(null, null);
        return;
      }

      if (session?.user) {
        console.log("✅ useAuth: Sesión inicial encontrada:", session.user.email);
        updateAuthState(session.user, session);
      } else {
        console.log("ℹ️ useAuth: No hay sesión inicial");
        updateAuthState(null, null);
      }
    } catch (error) {
      console.error("💥 useAuth: Error inesperado al obtener sesión inicial:", error);
      updateAuthState(null, null);
    }
  }, [updateAuthState]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Obtener sesión inicial
    getInitialSession();

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 useAuth: Cambio de estado detectado:", {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email
        });

        if (event === "SIGNED_IN" && session) {
          updateAuthState(session.user, session);
        } else if (event === "SIGNED_OUT") {
          updateAuthState(null, null);
        } else if (event === "TOKEN_REFRESHED" && session) {
          updateAuthState(session.user, session);
        }
      }
    );

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [getInitialSession, updateAuthState]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ useAuth: Error al cerrar sesión:", error);
        throw error;
      }
      console.log("✅ useAuth: Sesión cerrada exitosamente");
    } catch (error) {
      console.error("💥 useAuth: Error inesperado al cerrar sesión:", error);
      throw error;
    }
  }, []);

  return {
    ...authState,
    signOut,
    supabase,
  };
}
