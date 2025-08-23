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
