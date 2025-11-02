import { createClient } from "@supabase/supabase-js";

// Función para crear un cliente de Supabase con configuración optimizada
export function createAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: false,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token'
    }
  });
}

// Función para verificar si la sesión es válida
export function isSessionValid(session: { access_token?: string; expires_at?: number } | null): boolean {
  if (!session || !session.access_token || !session.expires_at) {
    return false;
  }
  
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at > now;
}

// Función para esperar a que la sesión se establezca
export function waitForSession(client: { auth: { getSession: () => Promise<{ data: { session: { access_token: string; expires_at: number; user: { id: string; email?: string } } | null } }> } }, maxWaitTime: number = 5000): Promise<{ access_token: string; expires_at: number; user: { id: string; email?: string } } | null> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        
        if (session && isSessionValid(session)) {
          resolve(session);
          return;
        }
        
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('Timeout waiting for session'));
          return;
        }
        
        // Reintentar en 100ms
        setTimeout(checkSession, 100);
      } catch (error) {
        reject(error);
      }
    };
    
    checkSession();
  });
}

// Función para limpiar cookies de sesión
export function clearSessionCookies() {
  if (typeof window !== 'undefined') {
    // Limpiar localStorage
    localStorage.removeItem('sb-auth-token');
    
    // Limpiar cookies relacionadas con Supabase
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }
}
