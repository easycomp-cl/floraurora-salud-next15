import { useEffect, useState } from 'react';
import supabase from '@/utils/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clientSignout } from '@/lib/client-auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener el usuario y sesión actual al montar el hook
    const getInitialAuth = async () => {
      try {
        console.log('🔍 useAuth: Obteniendo estado inicial de autenticación...');
        
        // Obtener sesión actual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('❌ Error al obtener sesión inicial:', sessionError);
        }
        
        // Obtener usuario actual
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('❌ Error al obtener usuario inicial:', userError);
        }
        
        // console.log('🔍 useAuth: Estado inicial:', { 
        //   hasSession: !!currentSession, 
        //   hasUser: !!currentUser,
        //   userEmail: currentUser?.email,
        //   sessionError: !!sessionError,
        //   userError: !!userError,
        //   sessionAccessToken: !!currentSession?.access_token,
        //   sessionRefreshToken: !!currentSession?.refresh_token,
        //   sessionExpiresAt: currentSession?.expires_at
        // });
        
        setSession(currentSession);
        setUser(currentUser);
      } catch (error) {
        console.error('💥 Error inesperado al obtener estado inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialAuth();

    // Escuchar cambios en el estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // console.log('🔄 useAuth: Cambio de estado detectado:', { 
        //   event, 
        //   hasSession: !!newSession,
        //   userEmail: newSession?.user?.email,
        //   previousUser: user?.email,
        //   accessToken: !!newSession?.access_token,
        //   refreshToken: !!newSession?.refresh_token,
        //   expiresAt: newSession?.expires_at
        // });
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        
        // Log adicional para debugging (comentado para evitar spam en consola)
        // if (event === 'SIGNED_IN') {
        //   console.log('✅ useAuth: Usuario autenticado:', newSession?.user?.email);
        //   console.log('🔑 Tokens de sesión:', {
        //     accessToken: !!newSession?.access_token,
        //     refreshToken: !!newSession?.refresh_token,
        //     expiresAt: newSession?.expires_at
        //   });
        //   
        //   // Verificar cookies en el navegador
        //   console.log('🍪 Cookies de sesión:', {
        //     authToken: document.cookie.includes('sb-') ? 'Presente' : 'Ausente',
        //     allCookies: document.cookie.split(';').filter(c => c.includes('sb-')).map(c => c.trim())
        //   });
        // } else if (event === 'SIGNED_OUT') {
        //   console.log('🚪 useAuth: Usuario desconectado');
        // } else if (event === 'TOKEN_REFRESHED') {
        //   console.log('🔄 useAuth: Token refrescado');
        // } else if (event === 'USER_UPDATED') {
        //   console.log('👤 useAuth: Usuario actualizado');
        // }
      }
    );

    // Limpiar la suscripción al desmontar el hook
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // console.log('🚪 useAuth: Iniciando proceso de desconexión...');
      // console.log('👤 Usuario actual antes de desconectar:', user?.email);
      
      const { error } = await clientSignout();
      
      if (error) {
        console.error('❌ Error durante la desconexión:', error);
        return;
      }
      
      // console.log('✅ Desconexión exitosa, limpiando estado local...');
      // Forzar la limpieza del estado local
      setUser(null);
      setSession(null);
      
      // console.log('🧹 Estado local limpiado, usuario debería ser null');
    } catch (error) {
      console.error('💥 Error durante la desconexión:', error);
    }
  };

  // Lógica mejorada para determinar si está autenticado
  const isAuthenticated = !!(user && session && session.access_token && session.expires_at && new Date(session.expires_at * 1000) > new Date());

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated,
  };
}
