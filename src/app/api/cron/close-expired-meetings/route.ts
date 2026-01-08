import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { deleteMeetEvent } from "@/lib/services/googleMeetService";

/**
 * Cron job para cerrar sesiones de Google Meet que han excedido su duración
 * y marcar como completadas las citas que ya pasaron su tiempo
 * 
 * ⚠️ COMENTADO TEMPORALMENTE - Descomentar cuando tengas configurado el cron job en Vercel
 * 
 * Este endpoint debe ser llamado periódicamente (ej: cada 5 minutos) por un servicio de cron
 * 
 * Funcionalidades:
 * 1. Cierra sesiones de Meet que han excedido su duración
 * 2. Marca como completadas las citas (con o sin Meet) que ya pasaron su tiempo
 * 
 * Para activar:
 * 1. Descomentar el código de abajo
 * 2. Configurar cron job en Vercel (vercel.json) con schedule cada 5 minutos
 */
export async function GET(request: NextRequest) {
  // ⚠️ COMENTADO - Descomentar cuando tengas cron jobs configurados en Vercel
  return NextResponse.json({
    message: "Cron job deshabilitado temporalmente. Descomentar el código cuando tengas cron jobs configurados.",
    note: "Este endpoint marcará automáticamente las citas como completadas cuando pasen su tiempo."
  });

  /* DESCOMENTAR CUANDO TENGAS CRON JOBS CONFIGURADOS EN VERCEL
  try {
    // Verificar que la solicitud viene de un servicio autorizado
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const supabase = createAdminServer();
    const now = new Date();

    // Obtener todas las citas que están confirmadas o pendientes de confirmación
    // y que aún no están completadas o canceladas
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, meet_event_id, status")
      .in("status", ["confirmed", "pending_confirmation"]);

    if (error) {
      console.error("[Cron] Error obteniendo citas:", error);
      return NextResponse.json(
        { error: "Error obteniendo citas", details: error.message },
        { status: 500 }
      );
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        message: "No hay citas para verificar",
        checked: 0,
        closed: 0,
        completed: 0,
      });
    }

    let closedMeetCount = 0;
    let completedCount = 0;
    const errors: string[] = [];

    for (const appointment of appointments) {
      if (!appointment.scheduled_at || !appointment.duration_minutes) {
        continue;
      }

      const startTime = new Date(appointment.scheduled_at);
      const endTime = new Date(
        startTime.getTime() + appointment.duration_minutes * 60 * 1000
      );
      // Agregar 5 minutos de gracia después del fin
      const gracePeriodEnd = new Date(endTime.getTime() + 5 * 60 * 1000);

      // Solo procesar si ya pasó el período de gracia
      if (now > gracePeriodEnd) {
        try {
          // Si tiene meet_event_id, cerrar la sesión de Meet primero
          if (appointment.meet_event_id) {
            console.log(
              `[Cron] Cerrando sesión de Meet para cita ${appointment.id} (evento ${appointment.meet_event_id})`
            );

            try {
              await deleteMeetEvent(appointment.meet_event_id);
              closedMeetCount++;
            } catch (meetError) {
              console.error(
                `[Cron] Error cerrando Meet para cita ${appointment.id}:`,
                meetError
              );
              // Continuar aunque falle el cierre de Meet, igual marcamos como completada
            }
          }

          // Marcar la cita como completada (tanto si tiene Meet como si no)
          const { error: updateError } = await supabase
            .from("appointments")
            .update({ status: "completed" })
            .eq("id", appointment.id);

          if (updateError) {
            throw updateError;
          }

          console.log(
            `[Cron] Cita ${appointment.id} marcada como completada${appointment.meet_event_id ? " (Meet cerrado)" : " (sin Meet)"}`
          );
          completedCount++;
        } catch (error) {
          const errorMessage = `Error procesando cita ${appointment.id}: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`;
          console.error(`[Cron] ${errorMessage}`, error);
          errors.push(errorMessage);
        }
      }
    }

    return NextResponse.json({
      message: "Proceso completado",
      checked: appointments.length,
      meetSessionsClosed: closedMeetCount,
      appointmentsCompleted: completedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("[Cron] Error inesperado:", error);
    return NextResponse.json(
      {
        error: "Error inesperado",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
  */
}

