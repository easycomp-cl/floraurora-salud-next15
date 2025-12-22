import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { clinicalRecordService } from "@/lib/services/clinicalRecordService";

/**
 * GET /api/clinical-records/history/[patientId]
 * Obtiene el historial clínico completo de un paciente para el profesional autenticado
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await context.params;
    const patientIdNum = parseInt(patientId, 10);

    if (isNaN(patientIdNum)) {
      return NextResponse.json(
        { error: "ID de paciente inválido" },
        { status: 400 }
      );
    }

    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-history] Fallback a createClient sin request:", error);
      supabase = await createClient();
    }

    // Primero intentar obtener la sesión (esto puede refrescar las cookies)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Luego obtener el usuario (más confiable)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    // Usar el usuario de getUser() o de la sesión como fallback
    const finalUser = user || session?.user;

    if (authError && !finalUser) {
      console.error("[clinical-history] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea profesional o admin
    const isAdmin = profile.role === 1;
    const isProfessional = profile.role === 3;

    if (!isAdmin && !isProfessional) {
      return NextResponse.json(
        { error: "Solo profesionales y administradores pueden acceder al historial clínico" },
        { status: 403 }
      );
    }

    const professionalId = profile.id;

    // Obtener historial clínico completo
    const clinicalHistory = await clinicalRecordService.getClinicalHistory(
      patientIdNum,
      professionalId
    );

    // Registrar acceso en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    await clinicalRecordService.logAccess({
      intake_record_id: clinicalHistory.intakeRecord?.id,
      professional_id: professionalId,
      action: "view",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      metadata: {
        patient_id: patientIdNum,
        view_type: "full_history",
      },
    });

    return NextResponse.json({
      clinicalHistory,
    });
  } catch (error) {
    console.error("Error en GET clinical history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

