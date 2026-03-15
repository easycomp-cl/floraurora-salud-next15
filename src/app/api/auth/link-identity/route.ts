import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Obtiene el usuario autenticado desde cookies o access_token en el body.
 */
async function getUserFromRequest(request: NextRequest): Promise<{ id: string; email: string } | null> {
  const supabaseFromCookies = await createClient(request);
  const { data: { session } } = await supabaseFromCookies.auth.getSession();
  if (session?.user?.id && session?.user?.email) {
    return { id: session.user.id, email: session.user.email.toLowerCase().trim() };
  }

  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.access_token;
    if (token) {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user?.id && user?.email) {
        return { id: user.id, email: user.email.toLowerCase().trim() };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * POST /api/auth/link-identity
 * Vincula la identidad actual de Auth (ej: Google OAuth) a un usuario existente en users
 * identificado por email. Usado cuando alguien se registró con magic link y luego
 * inicia sesión con Google: el user_id en BD difiere del auth.uid().
 */
export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const { id: authUserId, email } = userData;
    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, error: "Email no disponible" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    const { data: existingUser, error: fetchError } = await admin
      .from("users")
      .select("id, user_id")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (existingUser.user_id === authUserId) {
      return NextResponse.json({ success: true, linked: false });
    }

    const { error: updateError } = await admin
      .from("users")
      .update({ user_id: authUserId })
      .eq("email", email);

    if (updateError) {
      console.error("[link-identity] Error al vincular:", updateError);
      return NextResponse.json(
        { success: false, error: "Error al vincular cuenta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, linked: true });
  } catch (error) {
    console.error("[link-identity] Error inesperado:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
