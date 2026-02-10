import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/auth/check-email-professional-pending
 * POST /api/auth/check-email-professional-pending (body: { access_token })
 * Verifica si el email del usuario autenticado tiene una solicitud de profesional
 * en proceso (pending o resubmitted).
 * Acepta: Authorization Bearer <token> o body.access_token (el cliente usa localStorage, no cookies).
 */
async function getEmailFromRequest(request: NextRequest): Promise<string | null> {
  // 1. Intentar desde cookies (por si el usuario tiene sesión en cookies)
  const supabaseFromCookies = await createClient(request);
  const { data: { session } } = await supabaseFromCookies.auth.getSession();
  if (session?.user?.email) {
    return session.user.email.toLowerCase().trim();
  }

  // 2. Intentar desde Authorization header (cliente con localStorage envía el token)
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerToken) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    if (!error && user?.email) {
      return user.email.toLowerCase().trim();
    }
  }

  // 3. Intentar desde body (POST)
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const token = body?.access_token;
      if (token) {
        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user?.email) {
          return user.email.toLowerCase().trim();
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  return handleCheck(request);
}

export async function POST(request: NextRequest) {
  return handleCheck(request);
}

async function handleCheck(request: NextRequest) {
  try {
    const email = await getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json(
        { hasPendingRequest: false, error: "No autenticado" },
        { status: 401 }
      );
    }
    const admin = createAdminServer();

    const { data: pendingRequest, error: requestError } = await admin
      .from("professional_requests")
      .select("id")
      .eq("email", email)
      .in("status", ["pending", "resubmitted"])
      .maybeSingle();

    if (requestError) {
      console.error("[check-email-professional-pending] Error:", requestError);
      return NextResponse.json(
        { hasPendingRequest: false, error: "Error al verificar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasPendingRequest: !!pendingRequest,
    });
  } catch (error) {
    console.error("[check-email-professional-pending] Error inesperado:", error);
    return NextResponse.json(
      { hasPendingRequest: false, error: "Error interno" },
      { status: 500 }
    );
  }
}
