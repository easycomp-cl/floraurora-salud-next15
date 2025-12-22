import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * GET /api/clinical-records/audit/[recordId]
 * Obtiene los logs de auditoría de una ficha clínica (solo administradores)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ recordId: string }> }
) {
  try {
    const { recordId } = await context.params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea administrador
    if (profile.role !== 1) {
      return NextResponse.json(
        { error: "Solo los administradores pueden acceder a los logs de auditoría" },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("type"); // 'intake' o 'evolution'

    const adminSupabase = createAdminServer();

    let query = adminSupabase
      .from("clinical_record_access_logs")
      .select("*")
      .order("created_at", { ascending: false });

    // Filtrar por tipo de registro
    if (recordType === "intake") {
      query = query.eq("intake_record_id", recordId);
    } else if (recordType === "evolution") {
      query = query.eq("clinical_record_id", recordId);
    } else {
      // Buscar en ambos tipos
      query = query.or(`intake_record_id.eq.${recordId},clinical_record_id.eq.${recordId}`);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error("Error obteniendo logs de auditoría:", logsError);
      return NextResponse.json(
        { error: "Error obteniendo logs de auditoría" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
    });
  } catch (error) {
    console.error("Error en GET audit logs:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

