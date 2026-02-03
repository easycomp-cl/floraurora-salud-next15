import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/appointments/[id]/complete
 * Marca una cita como completada
 * Solo profesionales pueden marcar sus citas como completadas
 */
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
      appointmentId = id;
    } else {
      const numericPart = id.replace(/[^0-9]/g, '');
      if (!numericPart || numericPart.length === 0) {
        return NextResponse.json(
          { error: "ID de cita inválido" },
          { status: 400 }
        );
      }
      appointmentId = `APT-${numericPart.padStart(8, '0')}`;
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

    // Verificar que el usuario sea profesional (role = 3)
    if (profile.role !== 3) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden marcar citas como completadas" },
        { status: 403 }
      );
    }

    // Obtener la cita
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, professional_id, status, scheduled_at")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la cita pertenece al profesional
    if (appointment.professional_id !== profile.id) {
      return NextResponse.json(
        { error: "No tienes permiso para completar esta cita" },
        { status: 403 }
      );
    }

    // Verificar que la cita no esté ya completada o cancelada
    if (appointment.status === "completed") {
      return NextResponse.json(
        { error: "Esta cita ya está marcada como completada" },
        { status: 400 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "No se puede completar una cita cancelada" },
        { status: 400 }
      );
    }

    // Actualizar el estado de la cita a completed
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error actualizando cita:", updateError);
      return NextResponse.json(
        { error: "Error al marcar la cita como completada" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cita marcada como completada exitosamente",
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
