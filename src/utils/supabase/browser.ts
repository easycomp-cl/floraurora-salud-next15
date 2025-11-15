import { createBrowserClient } from '@supabase/ssr';

// Instancia singleton para evitar múltiples instancias de GoTrueClient
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Reutilizar la misma instancia si ya existe
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClientInstance;
}

