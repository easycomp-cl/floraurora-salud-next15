import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * GET /api/appointments/[id]/clinical-record
 * Obtiene la ficha clínica de una cita
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    // Obtener la cita para verificar permisos
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, professional_id, patient_id, scheduled_at, duration_minutes")
      .eq("id", id)
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
        { error: "No tienes permiso para acceder a esta ficha clínica" },
        { status: 403 }
      );
    }

    // Obtener la ficha clínica
    const { data: clinicalRecord, error: recordError } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("appointment_id", id)
      .single();

    if (recordError && recordError.code !== "PGRST116") {
      // PGRST116 es "no rows returned", que es válido si no existe ficha
      console.error("Error obteniendo ficha clínica:", recordError);
      return NextResponse.json(
        { error: "Error obteniendo ficha clínica" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clinicalRecord: clinicalRecord || null,
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduled_at,
        durationMinutes: appointment.duration_minutes,
      },
    });
  } catch (error) {
    console.error("Error en GET clinical-record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments/[id]/clinical-record
 * Crea o actualiza la ficha clínica de una cita
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { notes, evolution, observations, diagnostic_hypothesis } = body;

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

    // Verificar que sea profesional
    if (profile.role !== 3) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden crear fichas clínicas" },
        { status: 403 }
      );
    }

    // Obtener la cita
    const adminSupabase = createAdminServer();
    const { data: appointment, error: appointmentError } = await adminSupabase
      .from("appointments")
      .select("id, professional_id, patient_id, scheduled_at, duration_minutes")
      .eq("id", id)
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
        { error: "No tienes permiso para crear fichas clínicas de esta cita" },
        { status: 403 }
      );
    }

    // Validar ventana de tiempo (5 minutos antes hasta 5 minutos después)
    const now = new Date();
    const scheduledAt = new Date(appointment.scheduled_at);
    const endTime = new Date(
      scheduledAt.getTime() + (appointment.duration_minutes || 55) * 60 * 1000
    );

    const windowStart = new Date(scheduledAt.getTime() - 5 * 60 * 1000);
    const windowEnd = new Date(endTime.getTime() + 5 * 60 * 1000);

    if (now < windowStart) {
      return NextResponse.json(
        {
          error: "La ficha clínica solo está disponible 5 minutos antes de la sesión",
          availableAt: windowStart.toISOString(),
        },
        { status: 403 }
      );
    }

    if (now > windowEnd) {
      return NextResponse.json(
        {
          error: "La ventana de tiempo para editar la ficha clínica ha expirado",
          expiredAt: windowEnd.toISOString(),
        },
        { status: 403 }
      );
    }

    // Verificar si ya existe una ficha clínica
    const { data: existingRecord } = await adminSupabase
      .from("clinical_records")
      .select("id")
      .eq("appointment_id", id)
      .single();

    const recordData = {
      appointment_id: id,
      professional_id: profile.id,
      patient_id: appointment.patient_id!,
      notes: notes || null,
      evolution: evolution || null,
      observations: observations || null,
      diagnostic_hypothesis: diagnostic_hypothesis || null,
    };

    let result;
    if (existingRecord) {
      // Actualizar ficha existente
      const { data, error } = await adminSupabase
        .from("clinical_records")
        .update(recordData)
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error) {
        console.error("Error actualizando ficha clínica:", error);
        return NextResponse.json(
          { error: "Error actualizando ficha clínica" },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Crear nueva ficha
      const { data, error } = await adminSupabase
        .from("clinical_records")
        .insert(recordData)
        .select()
        .single();

      if (error) {
        console.error("Error creando ficha clínica:", error);
        return NextResponse.json(
          { error: "Error creando ficha clínica" },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      clinicalRecord: result,
    });
  } catch (error) {
    console.error("Error en POST clinical-record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

