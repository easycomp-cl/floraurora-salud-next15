import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  console.log('🔄 Callback OAuth ejecutándose:', { 
    code: !!code, 
    next, 
    origin,
    hasError: !!error,
    hasState: !!state,
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Si hay un error de OAuth, redirigir al login
  if (error) {
    console.error('❌ Error de OAuth recibido:', error);
    return NextResponse.redirect(`${origin}/auth/login?error=oauth_error&details=${error}`);
  }

  if (code) {
    try {
      // Crear cliente de Supabase con manejo correcto de cookies
      const cookieStore = await cookies();
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            }
          }
        }
      );

      console.log('🔐 Intercambiando código por sesión...');
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('❌ Error al intercambiar código por sesión:', exchangeError);
        return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&details=${exchangeError.message}`);
      }
      
      if (data.session) {
        console.log('✅ Sesión creada exitosamente para usuario:', data.user?.email);
        console.log('🔑 Token de acceso:', data.session.access_token ? 'Presente' : 'Ausente');
        console.log('🍪 Cookies de sesión configuradas');
        
        // 🆕 NUEVO: Verificar y crear usuario en tabla Users
        try {
          const userExists = await checkUserInUsersTable(data.user, supabase);
          
          if (!userExists) {
            console.log('🆕 Usuario no existe en tabla Users, creando...');
            await createUserInUsersTable(data.user, supabase);
          } else {
            console.log('👤 Usuario ya existe en tabla Users');
          }
        } catch (error) {
          console.error('⚠️ Error al manejar tabla Users:', error);
          // Continuar con la autenticación aunque falle la tabla Users
        }
        
        // Crear respuesta con redirección
        const response = NextResponse.redirect(`${origin}${next}`);
        
        // Configurar cookies de sesión en la respuesta
        const { access_token, refresh_token } = data.session;
        
        if (access_token) {
          response.cookies.set('sb-access-token', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 días
            path: '/'
          });
        }
        
        if (refresh_token) {
          response.cookies.set('sb-refresh-token', refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 días
            path: '/'
          });
        }
        
        console.log('🔄 Redirigiendo a:', `${origin}${next}`);
        return response;
      } else {
        console.error('❌ No se pudo crear la sesión');
        return NextResponse.redirect(`${origin}/auth/login?error=session_failed`);
      }
      
    } catch (error) {
      console.error('💥 Error inesperado en callback:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=unexpected`);
    }
  } else {
    console.error('❌ No se recibió código de autorización');
    console.log('🔍 Parámetros recibidos:', Object.fromEntries(searchParams.entries()));
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`);
  }
}

/**
 * Verifica si un usuario existe en la tabla Users
 */
async function checkUserInUsersTable(supabaseUser: any, supabase: any): Promise<boolean> {
  try {
    console.log('🔍 Verificando si usuario existe en tabla Users:', supabaseUser.id);
    
    // Intentar primero con tabla 'Users' (mayúsculas)
    let { data, error } = await supabase
      .from('Users')
      .select('id')
      .eq('id', supabaseUser.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.log('⚠️ Error con tabla "Users", intentando con "users"...');
      
      // Intentar con tabla 'users' (minúsculas)
      const result = await supabase
        .from('users')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error al verificar usuario:', error);
      return false;
    }
    
    const exists = !!data;
    console.log(`🔍 Usuario ${exists ? 'encontrado' : 'no encontrado'} en tabla Users`);
    return exists;
    
  } catch (error) {
    console.error('❌ Error inesperado al verificar usuario:', error);
    return false;
  }
}

/**
 * Crea un nuevo usuario en la tabla Users
 */
async function createUserInUsersTable(supabaseUser: any, supabase: any): Promise<void> {
  try {
    console.log('🆕 Creando usuario en tabla Users:', supabaseUser.id);
    
    // Extraer datos del usuario de Supabase
    const fullName = supabaseUser.user_metadata?.full_name || 'Usuario';
    const nameParts = fullName.split(' ');
    
    const userData = {
      id: supabaseUser.id,
      name: nameParts[0] || 'Usuario',
      last_name: nameParts.slice(1).join(' ') || '',
      email: supabaseUser.email,
      role: 1, // Paciente por defecto
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Datos a insertar:', userData);
    
    // Intentar insertar en tabla 'Users' primero
    let { data, error } = await supabase
      .from('Users')
      .insert(userData)
      .select()
      .single();
    
    if (error) {
      console.log('⚠️ Error con tabla "Users", intentando con "users"...');
      
      // Intentar con tabla 'users'
      const result = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('❌ Error al crear usuario en tabla Users:', error);
      throw error;
    }
    
    console.log('✅ Usuario creado exitosamente en tabla Users:', data);
    
  } catch (error) {
    console.error('💥 Error al crear usuario en tabla Users:', error);
    // No lanzar error aquí para no interrumpir el flujo de autenticación
  }
}
