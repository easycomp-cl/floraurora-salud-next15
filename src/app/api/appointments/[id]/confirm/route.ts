import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // El ID de appointments es de tipo text con formato "APT-00000060"
    // Aceptamos tanto el formato completo como solo el número
    let appointmentId: string;
    if (typeof id === 'string' && id.startsWith('APT-')) {
      // Ya viene en formato correcto
      appointmentId = id;
    } else {
      // Si viene solo el número, formatearlo como APT-00000060
      const numericPart = id.replace(/[^0-9]/g, '');
      if (!numericPart || numericPart.length === 0) {
        return NextResponse.json(
          { error: "ID de cita inválido" },
          { status: 400 }
        );
      }
      // Formatear con padding de 8 dígitos
      appointmentId = `APT-${numericPart.padStart(8, '0')}`;
    }

    if (!appointmentId || appointmentId.length === 0) {
      return NextResponse.json(
        { error: "ID de cita inválido" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario sea paciente (role = 2)
    if (profile.role !== 2) {
      return NextResponse.json(
        { error: "Solo los pacientes pueden confirmar asistencia" },
        { status: 403 }
      );
    }

    // Obtener la cita (el ID es de tipo text)
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, patient_id, scheduled_at, status")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la cita pertenezca al paciente
    if (appointment.patient_id !== profile.id) {
      return NextResponse.json(
        { error: "No tienes permiso para confirmar esta cita" },
        { status: 403 }
      );
    }

    // Verificar que el estado sea pending_confirmation
    if (appointment.status !== "pending_confirmation") {
      return NextResponse.json(
        { error: "Esta cita no requiere confirmación" },
        { status: 400 }
      );
    }

    // Obtener la configuración de horas antes de la cita para confirmar
    const { data: config } = await supabase
      .from("system_configurations")
      .select("config_value")
      .eq("config_key", "appointment_confirmation_hours_before")
      .eq("is_active", true)
      .single();

    const hoursBefore = config
      ? parseInt(config.config_value, 10)
      : 24; // Valor por defecto: 24 horas

    // Verificar que la cita esté dentro del rango permitido (24 horas antes)
    const scheduledDate = new Date(appointment.scheduled_at);
    const now = new Date();
    const hoursUntilAppointment =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 0) {
      return NextResponse.json(
        { error: "Esta cita ya pasó" },
        { status: 400 }
      );
    }

    if (hoursUntilAppointment > hoursBefore) {
      return NextResponse.json(
        {
          error: `Solo puedes confirmar asistencia ${hoursBefore} horas antes de la cita`,
        },
        { status: 400 }
      );
    }

    // Actualizar el estado de la cita a confirmed (el ID es de tipo text)
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error actualizando cita:", updateError);
      return NextResponse.json(
        { error: "Error al confirmar la cita" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Asistencia confirmada exitosamente",
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

