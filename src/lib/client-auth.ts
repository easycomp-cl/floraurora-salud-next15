"use client";

import supabase from "@/utils/supabase/client";

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

// Función para cerrar sesión
export async function clientSignout() {
  try {
    console.log('clientSignout: Starting sign out process...');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('clientSignout: Error during sign out:', error);
      throw error;
    }
    
    console.log('clientSignout: Sign out successful');
    return { error: null };
  } catch (error) {
    console.error('clientSignout: Unexpected error during sign out:', error);
    return { error };
  }
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
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
