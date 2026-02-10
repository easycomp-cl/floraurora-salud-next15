import { NextRequest, NextResponse } from "next/server";
import { tutorialService } from "@/lib/services/tutorialService";
import { validateAuth } from "@/utils/supabase/auth-validation";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * GET /api/tutorials
 * Devuelve tutoriales visibles para profesionales.
 * Solo profesionales (role=3) y admin (role=1) pueden acceder.
 * Los pacientes no tienen acceso a la página tutoriales.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await validateAuth(request);
    if (!auth.isValid || !auth.userRecordId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const adminSupabase = createAdminServer();
    const { data: userRecord, error: userError } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", auth.userRecordId)
      .maybeSingle();

    if (userError || !userRecord) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const role = userRecord.role as number;
    // Solo profesionales y admin pueden ver tutoriales (pacientes no tienen acceso)
    if (role !== 1 && role !== 3) {
      return NextResponse.json(
        { error: "No tienes acceso a los tutoriales" },
        { status: 403 },
      );
    }

    const items = await tutorialService.listForProfessionals();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[GET /api/tutorials] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener los tutoriales.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
