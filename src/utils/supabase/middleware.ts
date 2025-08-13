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
            console.log("Middleware auth error:", error);
        } else if (user) {
            console.log("Middleware: User authenticated:", user.id);
        } else {
            console.log("Middleware: No user found");
        }
    } catch (error) {
        console.log("Middleware unexpected error:", error);
    }

    return response;
}