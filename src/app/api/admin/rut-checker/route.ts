import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

/**
 * POST /api/admin/rut-checker
 * Proxy para el RPA rut-checker que verifica si el RUT del profesional
 * está registrado en el SII para emisión de BHE.
 * Solo admins. El RUT se obtiene de la BD a partir del professional_id.
 *
 * Variables de entorno requeridas (solo servidor):
 * - RUT_CHECKER_URL: URL base del servicio (ej. https://rut-checker-xxx.run.app)
 * - RUT_CHECKER_API_KEY: API key del rut-checker (WORKER_API_KEY)
 */
export const maxDuration = 300; // 5 minutos para Vercel Pro (máx típico)

export async function POST(request: NextRequest) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const professionalId = typeof body?.professional_id === "number"
      ? body.professional_id
      : Number(body?.professional_id);

    if (!Number.isInteger(professionalId) || professionalId < 1) {
      return NextResponse.json(
        { error: "professional_id inválido o faltante", hint: "Envíe un número entero ≥ 1" },
        { status: 400 }
      );
    }

    const url = process.env.RUT_CHECKER_URL?.replace(/\/$/, "");
    const apiKey = process.env.RUT_CHECKER_API_KEY;

    if (!url || !apiKey) {
      console.error("[POST /api/admin/rut-checker] RUT_CHECKER_URL o RUT_CHECKER_API_KEY no configurados");
      return NextResponse.json(
        { error: "Servicio de verificación RUT no configurado. Contacte al administrador." },
        { status: 503 }
      );
    }

    const supabase = createAdminServer();

    // Obtener RUT del profesional (professionals.id = users.id)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rut")
      .eq("id", professionalId)
      .single();

    if (userError || !userData) {
      console.error("[POST /api/admin/rut-checker] Error obteniendo usuario:", userError);
      return NextResponse.json(
        { error: "No se encontró el profesional o no tiene RUT registrado" },
        { status: 404 }
      );
    }

    const rut = typeof userData.rut === "string" ? userData.rut.trim() : "";
    if (!rut) {
      return NextResponse.json(
        { error: "El profesional no tiene RUT registrado. Debe completar su perfil." },
        { status: 400 }
      );
    }

    const res = await fetch(`${url}/check-rut`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        rut,
        professional_id: professionalId,
      }),
      signal: AbortSignal.timeout(280_000), // 4:40 min (menor que maxDuration por margen)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = typeof data?.error === "string"
        ? data.error
        : data?.message ?? `Error del servicio (HTTP ${res.status})`;
      console.error("[POST /api/admin/rut-checker] RPA error:", res.status, message);
      return NextResponse.json(
        { error: message, ok: false },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("[POST /api/admin/rut-checker] Error:", err);
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
