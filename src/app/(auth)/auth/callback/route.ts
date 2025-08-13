import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirigir al usuario a la página principal después de la autenticación exitosa
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hay un error o no hay código, redirigir a la página de login
  return NextResponse.redirect(`${origin}/login`);
}
