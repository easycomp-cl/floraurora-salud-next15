/**
 * Función helper para obtener la URL correcta según el ambiente
 * Detecta si estamos en staging (Vercel preview) o production
 *
 * Prioridad:
 * 1. NEXT_PUBLIC_STAGING_URL (si existe, para staging explícito)
 * 2. NEXT_PUBLIC_SITE_URL (URL del sitio configurada)
 * 3. NEXT_PUBLIC_APP_URL (URL de la app)
 * 4. VERCEL_URL (automático en Vercel - preview y production)
 * 5. Dominio producción floraurorasalud.cl (fallback para emails)
 * 6. localhost (solo desarrollo local)
 */
export function getSiteUrl(): string {
  // Si hay una variable de entorno específica para staging, usarla
  if (process.env.NEXT_PUBLIC_STAGING_URL) {
    return process.env.NEXT_PUBLIC_STAGING_URL;
  }

  // Si hay una variable de entorno específica para el sitio, usarla
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback a NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // VERCEL_URL está disponible en todos los deployments de Vercel (preview y production)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
    return vercelUrl;
  }

  // Fallback producción: evitar localhost en emails enviados desde servidor
  if (process.env.NODE_ENV === "production") {
    return "https://www.floraurorasalud.cl";
  }

  return "http://localhost:3000";
}

/**
 * Extrae el ID del video de una URL de YouTube.
 * Soporta: watch?v=, youtu.be/, embed/
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  // youtu.be/VIDEO_ID
  const youtuBeMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch) return youtuBeMatch[1];
  // youtube.com/watch?v=VIDEO_ID o embed/VIDEO_ID
  const youtubeMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) return youtubeMatch[1];
  return null;
}

