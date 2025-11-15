"use client";

import { supabase } from "@/utils/supabase/client";
import { clearSessionCookies } from "@/utils/supabase/cookie-utils";
import { config } from "@/lib/config";

// Función para iniciar sesión con email y password
export async function clientLogin(email: string, password: string) {
  try {
    //console.log('🔐 clientLogin: Iniciando autenticación para:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      //console.error('❌ clientLogin: Error de autenticación:', error);
      throw error;
    }

    if (!data.session) {
      console.error('❌ clientLogin: No se creó sesión después de la autenticación');
      throw new Error('No se pudo crear la sesión de usuario');
    }

    // Verificar si el usuario está bloqueado en app_metadata
    const isBlocked = data.user?.app_metadata?.blocked === true;
    if (isBlocked) {
      console.warn('🚫 clientLogin: Usuario bloqueado detectado, cerrando sesión...');
      // Cerrar la sesión inmediatamente
      await supabase.auth.signOut();
      // Limpiar estado local
      clearClientAuthState();
      throw new Error('Tu cuenta ha sido bloqueada. Por favor, contacta con el administrador.');
    }

    console.log('✅ clientLogin: Autenticación exitosa, sesión creada:', {
      userId: data.user?.id,
      userEmail: data.user?.email,
      hasSession: !!data.session,
      hasAccessToken: !!data.session.access_token
    });

    return { data, error: null };
  } catch (error) {
    //console.error("❌ clientLogin: Error durante el login:", error);
    return { data: null, error };
  }
}

// Función para registrarse con email y password
export async function clientSignup(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          email: email,
        },
      },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error during signup:", error);
    return { data: null, error };
  }
}

export async function clientSignout() {
  try {
    console.log("🚪 Iniciando proceso de desconexión del cliente...");
    
    // Limpiar cookies del lado del cliente
    if (typeof window !== 'undefined') {
      clearSessionCookies();
    }
    
    // Limpiar localStorage primero
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('supabase.auth.token');
    }
    
    // Intentar desconectar de Supabase de manera silenciosa
    // Solo si hay una sesión activa para evitar errores innecesarios
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Solo intentar cerrar sesión si hay una sesión válida
        await supabase.auth.signOut();
      }
    } catch {
      // Ignorar errores silenciosamente - ya limpiamos todo localmente
    }
    
    console.log("✅ Desconexión exitosa del cliente");
    return { error: null };
  } catch (error) {
    console.error("💥 Error inesperado durante la desconexión:", error);
    return { error };
  }
}

export async function clientGetSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting client session:", error);
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error("Unexpected error getting client session:", error);
    return { session: null, error };
  }
}

export async function clientGetUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting client user:", error);
      return { user: null, error };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error("Unexpected error getting client user:", error);
    return { user: null, error };
  }
}

// Función para verificar si la sesión está activa en el cliente
export function isClientSessionActive(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Verificar si hay token en localStorage
  const authToken = localStorage.getItem('sb-auth-token');
  if (!authToken) {
    return false;
  }
  
  // Verificar si hay cookies de sesión
  const hasAuthCookies = document.cookie.includes('sb-');
  
  return !!(authToken && hasAuthCookies);
}

// Función para limpiar el estado de autenticación del cliente
export function clearClientAuthState() {
  if (typeof window === 'undefined') {
    return;
  }
  
  // Limpiar localStorage
  localStorage.removeItem('sb-auth-token');
  localStorage.removeItem('supabase.auth.token');
  
  // Limpiar cookies del lado del cliente
  clearSessionCookies();
}

// Función para iniciar sesión con Google
export async function clientSignInWithGoogle() {
  try {
    console.log('🚀 Iniciando OAuth con Google...');
    console.log('📍 Usando callback por defecto de Supabase (maneja PKCE correctamente)');
    console.log('🌐 Origen actual:', window.location.origin);
    console.log('🔑 Variables de entorno:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
    });
    
    // Verificar si las variables de entorno están configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('❌ Variables de entorno de Supabase no configuradas. Verifica tu archivo .env.local');
    }
    
    console.log('✅ Variables de entorno configuradas correctamente');
    
    // Detectar dinámicamente la URL actual del navegador
    const currentUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : config.app.url;
    
    console.log('🌐 URL de callback:', `${currentUrl}/callback`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${currentUrl}/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error('❌ Error en OAuth:', error);
      
      // Verificar si es un error de configuración
      if (error.message.includes('provider') || error.message.includes('not enabled')) {
        throw new Error('❌ Google OAuth no está configurado en Supabase. Ve a Authentication > Providers > Google y habilítalo.');
      }
      
      throw error;
    }

    console.log('📋 Respuesta completa de Supabase:', data);
    console.log('🔗 URL generada:', data.url);
    console.log('📝 Tipo de respuesta:', typeof data);

    if (data.url) {
      console.log('✅ URL de OAuth generada:', data.url);
      console.log('🔄 Redirigiendo a Google en 2 segundos...');
      
      // Pequeña pausa para ver los logs
      setTimeout(() => {
        console.log('🚀 Ejecutando redirección...');
        window.location.href = data.url;
      }, 2000);
      
    } else {
      console.error('❌ No se generó URL de OAuth');
      console.error('📋 Datos recibidos:', data);
      throw new Error('No se pudo generar la URL de autenticación');
    }

    return { data, error: null };
  } catch (error) {
    console.error("💥 Error during Google sign in:", error);
    return { data: null, error };
  }
}
