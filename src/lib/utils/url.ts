/**
 * Función helper para obtener la URL correcta según el ambiente
 * Detecta si estamos en staging (Vercel preview) o production
 * 
 * Prioridad:
 * 1. NEXT_PUBLIC_STAGING_URL (si existe, para staging explícito)
 * 2. VERCEL_URL (si estamos en Vercel preview)
 * 3. NEXT_PUBLIC_SITE_URL (URL del sitio configurada)
 * 4. NEXT_PUBLIC_APP_URL (URL de la app)
 * 5. localhost (fallback)
 */
export function getSiteUrl(): string {
  // Si hay una variable de entorno específica para staging, usarla
  if (process.env.NEXT_PUBLIC_STAGING_URL) {
    return process.env.NEXT_PUBLIC_STAGING_URL;
  }

  // Si estamos en Vercel y es un preview deployment, usar VERCEL_URL
  // VERCEL_URL ya incluye el protocolo https://
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV !== "production") {
    const vercelUrl = process.env.VERCEL_URL.startsWith("http") 
      ? process.env.VERCEL_URL 
      : `https://${process.env.VERCEL_URL}`;
    return vercelUrl;
  }

  // Si hay una variable de entorno específica para el sitio, usarla
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback a NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback por defecto
  return "http://localhost:3000";
}

