import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
}

export function createAdminServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
export function isServerSessionValid(session: any): boolean {
  if (!session || !session.access_token || !session.expires_at) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
}