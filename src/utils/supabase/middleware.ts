import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        }
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                }
            }
        }
    );

    try {
        // Primero intentar obtener la sesión (esto puede actualizar las cookies automáticamente
        // si hay un refresh token válido)
        const { data: { session } } = await supabase.auth.getSession();
        
        // Luego obtener el usuario (más confiable que getSession)
        // getUser() también intentará refrescar automáticamente si es necesario
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Determinar el usuario final: preferir getUser() pero usar session si está disponible
        const finalUser = user || session?.user;
        
        // Si no hay usuario ni sesión, verificar si es una ruta protegida
        if (!finalUser) {
            // Solo loggear errores que no sean de sesión faltante
            if (error && error.message !== 'Auth session missing!') {
                console.log("Middleware auth error:", error);
            }
            
            // Si es una ruta protegida y no hay sesión válida, verificar qué hacer
            const pathname = request.nextUrl.pathname;
            
            // Para APIs, no redirigir (retornan error 401)
            const isApiRoute = pathname.startsWith('/api/');
            
            // IMPORTANTE: Para todas las rutas protegidas (dashboard, admin, profile), 
            // NO redirigir inmediatamente desde el middleware
            // El cliente (ProtectedRoute o componentes de página) manejará la autenticación
            // Esto evita redirecciones prematuras cuando las cookies aún no se han sincronizado
            // o cuando la sesión se está refrescando
            
            // Para APIs, retornar respuesta sin redirigir (retornarán 401 si es necesario)
            if (isApiRoute) {
                return response;
            }
            
            // Para todas las rutas protegidas (dashboard, admin, profile), permitir que continúe
            // El cliente manejará la redirección si realmente no hay sesión válida
            // Esto es crítico para evitar redirecciones prematuras durante la navegación
            // y problemas de sincronización de cookies
            return response;
        }
        
        // Continuar con las validaciones usando finalUser
        if (finalUser) {
            // Verificar si el usuario está bloqueado en app_metadata
            const isBlocked = finalUser.app_metadata?.blocked === true;
            
            if (isBlocked) {
                // Usuario bloqueado - cerrar sesión y redirigir
                console.log("Middleware: Usuario bloqueado detectado:", finalUser.id);
                
                // Cerrar la sesión
                await supabase.auth.signOut();
                
                // Redirigir a login con mensaje
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("error", "account_blocked");
                return NextResponse.redirect(loginUrl);
            }
            
            // NUEVO: Detectar desajuste entre cookies y header (solo en rutas que tienen header)
            // Esto es crítico para la seguridad en una plataforma multiusuario
            const headerUserId = request.headers.get("X-User-ID");
            if (headerUserId && finalUser.id !== headerUserId) {
                console.error("🚨 Middleware: DESAJUSTE CRÍTICO detectado - cerrando sesión automáticamente");
                console.error("🚨 Cookie UUID:", finalUser.id, "Header UUID:", headerUserId);
                
                // Cerrar sesión automáticamente
                await supabase.auth.signOut();
                
                // Limpiar cookies en la respuesta
                const allCookies = request.cookies.getAll();
                allCookies.forEach(cookie => {
                    if (cookie.name.includes('supabase') || cookie.name.includes('sb-') || cookie.name.includes('auth-token')) {
                        response.cookies.delete(cookie.name);
                        response.cookies.set(cookie.name, '', {
                            expires: new Date(0),
                            path: '/',
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                        });
                    }
                });
                
                // Redirigir a login con mensaje
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("error", "session_mismatch");
                return NextResponse.redirect(loginUrl);
            }
            
            // Solo loggear en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log("Middleware: User authenticated:", finalUser.id);
            }
        }
    } catch (error) {
        // Solo loggear errores inesperados
        if (error instanceof Error && error.message !== 'Auth session missing!') {
            console.log("Middleware unexpected error:", error);
        }
    }

    return response;
}