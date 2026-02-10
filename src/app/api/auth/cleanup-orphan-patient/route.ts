import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/cleanup-orphan-patient
 * Elimina el usuario actual de auth.users cuando su email tiene una solicitud
 * de profesional en proceso (pending/resubmitted). Se usa cuando un usuario
 * intenta registrarse como paciente vía Google OAuth pero ya tiene una solicitud
 * de profesional pendiente.
 * Acepta: cookies o body { access_token } (el cliente usa localStorage).
 */
async function getUserFromRequest(request: NextRequest): Promise<{ id: string; email: string } | null> {
  // 1. Intentar desde cookies
  const supabaseFromCookies = await createClient(request);
  const { data: { session } } = await supabaseFromCookies.auth.getSession();
  if (session?.user?.id && session?.user?.email) {
    return { id: session.user.id, email: session.user.email.toLowerCase().trim() };
  }

  // 2. Intentar desde body (access_token)
  try {
    const body = await request.json();
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

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const userId = userData.id;
    const email = userData.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email no disponible" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Verificar que el email tiene solicitud de profesional en proceso
    const { data: pendingRequest, error: requestError } = await admin
      .from("professional_requests")
      .select("id")
      .eq("email", email)
      .in("status", ["pending", "resubmitted"])
      .maybeSingle();

    if (requestError || !pendingRequest) {
      return NextResponse.json(
        { success: false, error: "No se encontró solicitud de profesional en proceso para este email" },
        { status: 400 }
      );
    }

    // Eliminar usuario de auth.users
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      // Si el usuario ya no existe (user_not_found), considerarlo éxito: el objetivo
      // (evitar registro como paciente) ya está cumplido
      if (deleteError.code === "user_not_found" || deleteError.status === 404) {
        return NextResponse.json({ success: true });
      }
      console.error("[cleanup-orphan-patient] Error al eliminar usuario:", deleteError);
      return NextResponse.json(
        { success: false, error: "Error al eliminar usuario" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cleanup-orphan-patient] Error inesperado:", error);
    return NextResponse.json(
      { success: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
