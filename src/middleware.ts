import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas que requieren autenticación
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/messages'
];

// Rutas de autenticación (deben ser accesibles sin verificación)
const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/auth/callback',
  '/auth/auth/confirm',
  '/auth/logout'
];

// Rutas de marketing (públicas)
const publicRoutes = [
  '/',
  '/about',
  '/services', 
  '/professionals',
  '/contact'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // console.log('🔒 Middleware ejecutándose para:', pathname);
  
  // Permitir todas las rutas de autenticación sin verificación
  if (authRoutes.some(route => pathname.startsWith(route))) {
    // console.log('✅ Ruta de autenticación permitida:', pathname);
    return NextResponse.next();
  }
  
  // Permitir todas las rutas públicas sin verificación
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // console.log('🌐 Ruta pública permitida:', pathname);
    return NextResponse.next();
  }
  
  // Verificar si la ruta requiere autenticación
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // console.log('🛡️ Ruta protegida detectada:', pathname);
    
    try {
      // Crear cliente de Supabase para verificar autenticación
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll() {
              // No necesitamos establecer cookies en el middleware
            }
          }
        }
      );

      // Intentar obtener la sesión
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // console.log('❌ Error al obtener sesión en middleware:', sessionError);
      }
      
      // Verificar si hay una sesión válida
      if (!session || !session.user || !session.access_token) {
        // console.log('❌ No hay sesión válida en middleware:', { 
        //   hasSession: !!session, 
        //   hasUser: !!session?.user,
        //   hasAccessToken: !!session?.access_token,
        //   sessionError: sessionError?.message
        // });
        
        // Redirigir a login si no está autenticado
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        // console.log('🔄 Middleware redirigiendo a:', loginUrl.toString());
        return NextResponse.redirect(loginUrl);
      }
      
      // Verificar si el token no ha expirado
      if (session.expires_at && new Date(session.expires_at * 1000) <= new Date()) {
        // console.log('⏰ Token expirado en middleware, redirigiendo a login');
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
      
      // Usuario autenticado, continuar
      // console.log('✅ Usuario autenticado en middleware accediendo a:', pathname, 'User ID:', session.user.id);
      
    } catch (error) {
      console.error('💥 Error en middleware:', error);
      // En caso de error, redirigir a login por seguridad
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
