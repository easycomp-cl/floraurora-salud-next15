// Utilidades de cookies que pueden usarse en el cliente
// Las funciones del servidor están en cookie-utils-server.ts

// Función para limpiar cookies de sesión del lado del cliente
export function clearSessionCookies() {
  if (typeof window !== 'undefined') {
    // Limpiar localStorage
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('supabase.auth.token');
    
    // Limpiar cookies relacionadas con Supabase del lado del cliente
    const cookieNames = [
      'sb-auth-token',
      'sb-access-token', 
      'sb-refresh-token',
      'supabase-auth-token'
    ];
    
    cookieNames.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}

// Función para verificar si las cookies de sesión están presentes en el cliente
export function hasSessionCookies(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Verificar si hay cookies de sesión
  const hasAuthCookies = document.cookie.includes('sb-');
  
  return hasAuthCookies;
}
