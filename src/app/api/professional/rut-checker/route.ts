import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminServer } from "@/utils/supabase/server";

/** Obtiene el usuario autenticado: primero Bearer token, luego cookies */
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request?.headers?.get?.("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerToken) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    if (!error && user) return user;
  }
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * POST /api/professional/rut-checker
 * Permite al profesional verificar su propio RUT en el SII para emisión de BHE.
 * Solo el profesional autenticado puede verificarse a sí mismo.
 *
 * Variables de entorno requeridas (solo servidor):
 * - RUT_CHECKER_URL, RUT_CHECKER_API_KEY
 */
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Usar admin para consultar users (evita RLS cuando la sesión está solo en Bearer)
    const supabase = createAdminServer();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role, rut")
      .eq("user_id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    if (userData.role !== 3) {
      return NextResponse.json(
        { error: "Solo profesionales pueden verificar su RUT" },
        { status: 403 }
      );
    }

    // professionals.id = users.id
    const professionalId = userData.id;

    const rut = typeof userData.rut === "string" ? userData.rut.trim() : "";
    if (!rut) {
      return NextResponse.json(
        { error: "No tienes RUT registrado. Completa tu perfil primero." },
        { status: 400 }
      );
    }

    const url = process.env.RUT_CHECKER_URL?.replace(/\/$/, "");
    const apiKey = process.env.RUT_CHECKER_API_KEY;

    if (!url || !apiKey) {
      console.error("[POST /api/professional/rut-checker] RUT_CHECKER no configurado");
      return NextResponse.json(
        { error: "Servicio de verificación no disponible. Contacta a administración." },
        { status: 503 }
      );
    }

    const res = await fetch(`${url}/check-rut`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ rut, professional_id: professionalId }),
      signal: AbortSignal.timeout(280_000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = typeof data?.error === "string"
        ? data.error
        : data?.message ?? `Error del servicio (HTTP ${res.status})`;
      console.error("[POST /api/professional/rut-checker] RPA error:", res.status, message);
      return NextResponse.json(
        { error: message, ok: false },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("[POST /api/professional/rut-checker] Error:", err);
    return NextResponse.json(
      {
        error: isTimeout
          ? "La verificación tardó demasiado. El SII puede estar lento. Intente nuevamente."
          : "Error interno al verificar RUT en SII",
        ok: false,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
