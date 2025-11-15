import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function createClient(request?: NextRequest, response?: NextResponse) {
  // Si tenemos un request, usar sus cookies directamente (más confiable)
  // Si no, usar cookies() de Next.js
  const cookieStore = request 
    ? request.cookies 
    : await cookies();
  
  // Log de cookies para debugging (comentado porque no se usa actualmente)
  // const allCookies = cookieStore.getAll();
  // const supabaseCookies = allCookies.filter(c => 
  //   c.name.includes('supabase') || 
  //   c.name.includes('sb-') ||
  //   c.name.includes('auth-token')
  // );
  
  // Intentar extraer el UUID de las cookies para debugging (comentado porque no se usa actualmente)
  // let extractedUserId: string | null = null;
  // try {
  //   const allCookies = cookieStore.getAll();
  //   const supabaseCookies = allCookies.filter(c => 
  //     c.name.includes('supabase') || 
  //     c.name.includes('sb-') ||
  //     c.name.includes('auth-token')
  //   );
  //   const authTokenCookie = supabaseCookies.find(c => c.name.includes('auth-token'));
  //   if (authTokenCookie?.value) {
  //     const parts = authTokenCookie.value.split('.');
  //     if (parts.length >= 2) {
  //       const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  //       extractedUserId = payload?.sub || payload?.user_id || null;
  //     }
  //   }
  // } catch {
  //   // Ignorar errores al parsear
  // }
  
  // console.log("🍪 [createClient] Cookies encontradas:", {
  //   source: request ? 'request.cookies' : 'cookies()',
  //   totalCookies: allCookies.length,
  //   supabaseCookies: supabaseCookies.map(c => ({
  //     name: c.name,
  //     hasValue: !!c.value,
  //     valueLength: c.value?.length || 0,
  //   })),
  //   extractedUserIdFromCookie: extractedUserId,
  // });

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (request && response) {
            // Si tenemos request Y response, establecer cookies en la respuesta
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          } else if (!request) {
            // Solo establecer cookies si estamos usando cookies() de Next.js
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          }
          // Si tenemos request pero no response, las cookies se establecerán en el middleware
        }
      }
    }
  );
}

export function createAdminServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No hacer nada en el servidor admin
        }
      }
    }
  );
}

// Función para verificar la sesión del servidor
export async function getServerSession() {
  const supabase = await createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting server session:", error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("Unexpected error getting server session:", error);
    return null;
  }
}

// Función para verificar el usuario del servidor
export async function getServerUser() {
  const supabase = await createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting server user:", error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error("Unexpected error getting server user:", error);
    return null;
  }
}

// Función para verificar si la sesión es válida en el servidor
export function isServerSessionValid(session: { access_token?: string; expires_at?: number } | null): boolean {
  if (!session || !session.access_token || !session.expires_at) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
}