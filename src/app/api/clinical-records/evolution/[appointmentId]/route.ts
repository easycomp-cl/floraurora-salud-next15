import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { clinicalRecordService } from "@/lib/services/clinicalRecordService";
import type { CreateEvolutionRecordData, UpdateEvolutionRecordData } from "@/lib/services/clinicalRecordService";

/**
 * GET /api/clinical-records/evolution/[appointmentId]
 * Obtiene la ficha de evolución de una sesión específica
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await context.params;
    
    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-evolution] Fallback a createClient sin request:", error);
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
      console.error("[clinical-evolution] Error de autenticación:", {
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

    // Obtener la cita para verificar permisos
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, professional_id, patient_id")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el profesional asignado o admin
    const isAdmin = profile.role === 1;
    const isProfessional = profile.role === 3;

    if (!isAdmin && (!isProfessional || appointment.professional_id !== profile.id)) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta ficha de evolución" },
        { status: 403 }
      );
    }

    // Obtener la ficha de evolución
    const evolutionRecord = await clinicalRecordService.getEvolutionRecord(appointmentId);

    // Registrar acceso en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    if (evolutionRecord) {
      await clinicalRecordService.logAccess({
        clinical_record_id: evolutionRecord.id,
        professional_id: appointment.professional_id!,
        action: "view",
        ip_address: ipAddress || undefined,
        user_agent: userAgent || undefined,
      });
    }

    return NextResponse.json({
      evolutionRecord: evolutionRecord || null,
      appointment: {
        id: appointment.id,
        professional_id: appointment.professional_id,
        patient_id: appointment.patient_id,
      },
    });
  } catch (error) {
    console.error("Error en GET evolution record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinical-records/evolution/[appointmentId]
 * Crea o actualiza una ficha de evolución
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await context.params;
    const body = await request.json();
    
    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-evolution POST] Fallback a createClient sin request:", error);
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
      console.error("[clinical-evolution POST] Error de autenticación:", {
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

    // Verificar que sea profesional
    if (profile.role !== 3) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden crear fichas de evolución" },
        { status: 403 }
      );
    }

    // Obtener la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, professional_id, patient_id, scheduled_at, duration_minutes")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el profesional sea el asignado a la cita
    if (appointment.professional_id !== profile.id) {
      return NextResponse.json(
        { error: "No tienes permiso para crear fichas de evolución de esta cita" },
        { status: 403 }
      );
    }

    // Verificar si ya existe una ficha de evolución
    const existingRecord = await clinicalRecordService.getEvolutionRecord(appointmentId);
    const isUpdate = !!existingRecord;

    // Crear o actualizar la ficha de evolución
    let evolutionRecord;
    if (isUpdate) {
      const updateData: UpdateEvolutionRecordData = {
        notes: body.notes,
        evolution: body.evolution,
        observations: body.observations,
        diagnosis: body.diagnosis,
        session_development: body.session_development,
        treatment_applied: body.treatment_applied,
        next_session_indications: body.next_session_indications,
      };

      evolutionRecord = await clinicalRecordService.createOrUpdateEvolutionRecord(
        appointmentId,
        updateData,
        true
      );
    } else {
      const createData: CreateEvolutionRecordData = {
        appointment_id: appointmentId,
        professional_id: appointment.professional_id!,
        patient_id: appointment.patient_id!,
        notes: body.notes,
        evolution: body.evolution,
        observations: body.observations,
        diagnosis: body.diagnosis,
        session_development: body.session_development,
        treatment_applied: body.treatment_applied,
        next_session_indications: body.next_session_indications,
      };

      evolutionRecord = await clinicalRecordService.createOrUpdateEvolutionRecord(
        appointmentId,
        createData,
        false
      );
    }

    // Registrar creación/actualización en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    await clinicalRecordService.logAccess({
      clinical_record_id: evolutionRecord.id,
      professional_id: appointment.professional_id!,
      action: isUpdate ? "update" : "create",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      metadata: {
        appointment_id: appointmentId,
        previous_values: existingRecord || null,
        updated_fields: isUpdate ? Object.keys(body) : null,
      },
    });

    return NextResponse.json({
      success: true,
      evolutionRecord,
    });
  } catch (error) {
    console.error("Error en POST evolution record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

