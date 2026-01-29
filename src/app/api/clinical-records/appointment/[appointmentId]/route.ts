import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/clinical-records/appointment/[appointmentId]
 * Obtiene los datos clínicos de una cita específica
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId: rawAppointmentId } = await context.params;
    // Normalizar el appointmentId: asegurar que tenga el formato "APT-00000060"
    let appointmentId: string;
    if (rawAppointmentId.startsWith('APT-')) {
      appointmentId = rawAppointmentId;
    } else {
      // Si viene solo el número, formatearlo como APT-00000060
      const numericPart = rawAppointmentId.replace(/[^0-9]/g, '');
      appointmentId = `APT-${numericPart.padStart(8, '0')}`;
    }
    
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      console.warn("[clinical-appointment GET] Fallback a createClient sin request:", error);
      supabase = await createClient();
    }

    const { data: { session } } = await supabase.auth.getSession();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    const finalUser = user || session?.user;

    if (authError && !finalUser) {
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
    if (profile.role !== 3 && profile.role !== 1) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden acceder a los datos clínicos" },
        { status: 403 }
      );
    }

    // Obtener la cita para verificar permisos
    // El ID es de tipo text con formato "APT-00000060"
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

    // Verificar que el profesional sea el asignado o admin
    const isAdmin = profile.role === 1;
    const isProfessional = profile.role === 3;

    if (!isAdmin && (!isProfessional || appointment.professional_id !== profile.id)) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta información" },
        { status: 403 }
      );
    }

    // Obtener los datos clínicos de la cita
    // El appointment_id es de tipo text con formato "APT-00000060"
    const { data: clinicalRecord, error: recordError } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (recordError && recordError.code !== "PGRST116") {
      console.error("Error obteniendo datos clínicos:", recordError);
      return NextResponse.json(
        { error: "Error obteniendo datos clínicos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clinicalRecord: clinicalRecord || null,
      appointment: {
        id: appointment.id,
        professional_id: appointment.professional_id,
        patient_id: appointment.patient_id,
      },
    });
  } catch (error) {
    console.error("Error en GET clinical appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinical-records/appointment/[appointmentId]
 * Crea o actualiza los datos clínicos de una cita
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId: rawAppointmentId } = await context.params;
    // Normalizar el appointmentId: asegurar que tenga el formato "APT-00000060"
    let appointmentId: string;
    if (rawAppointmentId.startsWith('APT-')) {
      appointmentId = rawAppointmentId;
    } else {
      // Si viene solo el número, formatearlo como APT-00000060
      const numericPart = rawAppointmentId.replace(/[^0-9]/g, '');
      appointmentId = `APT-${numericPart.padStart(8, '0')}`;
    }
    const body = await request.json();
    
    // Debug: Verificar cookies disponibles
    const requestCookies = request.cookies.getAll();
    const hasSupabaseCookies = requestCookies.some(c => 
      c.name.includes('supabase') || c.name.includes('sb-') || c.name.includes('auth-token')
    );
    console.log("[clinical-appointment POST] Cookies disponibles:", {
      totalCookies: requestCookies.length,
      hasSupabaseCookies,
      appointmentId,
    });
    
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      console.warn("[clinical-appointment POST] Fallback a createClient sin request:", error);
      supabase = await createClient();
    }

    const { data: { session } } = await supabase.auth.getSession();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    const finalUser = user || session?.user;

    if (authError && !finalUser) {
      console.error("[clinical-appointment POST] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      console.error("[clinical-appointment POST] No hay usuario autenticado:", {
        hasUser: !!user,
        hasSession: !!session,
        authError: authError?.message,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      console.error("[clinical-appointment POST] Error obteniendo perfil:", {
        profileError: profileError?.message,
        userId: finalUser.id,
        hasProfile: !!profile,
      });
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea profesional
    if (profile.role !== 3) {
      console.warn("[clinical-appointment POST] Usuario no es profesional:", {
        userId: finalUser.id,
        profileId: profile.id,
        role: profile.role,
      });
      return NextResponse.json(
        { error: "Solo los profesionales pueden crear datos clínicos" },
        { status: 403 }
      );
    }

    // Obtener la cita
    // El ID es de tipo text con formato "APT-00000060"
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

    // Verificar que el profesional sea el asignado a la cita
    if (appointment.professional_id !== profile.id) {
      return NextResponse.json(
        { error: "No tienes permiso para crear datos clínicos de esta cita" },
        { status: 403 }
      );
    }

    // Verificar que los IDs coincidan
    if (body.patient_id !== appointment.patient_id || body.professional_id !== appointment.professional_id) {
      return NextResponse.json(
        { error: "Los IDs del paciente y profesional no coinciden con la cita" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un registro clínico
    const { data: existingRecord, error: checkError } = await supabase
      .from("clinical_records")
      .select("id")
      .eq("appointment_id", appointmentId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error verificando registro existente:", checkError);
      return NextResponse.json(
        { error: "Error verificando registro existente" },
        { status: 500 }
      );
    }

    const exists = !!existingRecord;

    if (exists) {
      // Actualizar registro existente
      const { data: updatedRecord, error: updateError } = await supabase
        .from("clinical_records")
        .update({
          medical_history: body.medical_history || null,
          family_history: body.family_history || null,
          consultation_reason: body.consultation_reason || null,
        })
        .eq("appointment_id", appointmentId)
        .select()
        .single();

      if (updateError) {
        console.error("Error actualizando registro clínico:", updateError);
        return NextResponse.json(
          { error: "Error actualizando registro clínico" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        clinicalRecord: updatedRecord,
      });
    } else {
      // Crear nuevo registro
      const { data: newRecord, error: insertError } = await supabase
        .from("clinical_records")
        .insert({
          appointment_id: appointmentId,
          professional_id: appointment.professional_id,
          patient_id: appointment.patient_id,
          medical_history: body.medical_history || null,
          family_history: body.family_history || null,
          consultation_reason: body.consultation_reason || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creando registro clínico:", insertError);
        return NextResponse.json(
          { error: "Error creando registro clínico" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        clinicalRecord: newRecord,
      });
    }
  } catch (error) {
    console.error("Error en POST clinical appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
