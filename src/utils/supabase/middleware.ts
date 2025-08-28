import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
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
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            // Solo loggear errores que no sean de sesión faltante
            if (error.message !== 'Auth session missing!') {
                console.log("Middleware auth error:", error);
            }
        } else if (user) {
            // Solo loggear en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log("Middleware: User authenticated:", user.id);
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