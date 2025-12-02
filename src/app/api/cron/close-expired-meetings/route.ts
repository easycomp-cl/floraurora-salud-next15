import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { deleteMeetEvent } from "@/lib/services/googleMeetService";

/**
 * Cron job para cerrar sesiones de Google Meet que han excedido su duración
 * Este endpoint debe ser llamado periódicamente (ej: cada 5 minutos) por un servicio de cron
 * 
 * Verifica todas las citas con meet_event_id y cierra las que han excedido su tiempo
 */
export async function GET(request: NextRequest) {
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

    // Obtener todas las citas con meet_event_id que están en curso o recientemente finalizadas
    // Buscamos citas que:
    // 1. Tienen meet_event_id (tienen una reunión de Meet creada)
    // 2. Están confirmadas o en curso
    // 3. Su hora de fin + 5 minutos de gracia ha pasado
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("id, scheduled_at, duration_minutes, meet_event_id, status")
      .not("meet_event_id", "is", null)
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
      });
    }

    let closedCount = 0;
    const errors: string[] = [];

    for (const appointment of appointments) {
      if (!appointment.scheduled_at || !appointment.duration_minutes || !appointment.meet_event_id) {
        continue;
      }

      const startTime = new Date(appointment.scheduled_at);
      const endTime = new Date(
        startTime.getTime() + appointment.duration_minutes * 60 * 1000
      );
      // Agregar 5 minutos de gracia después del fin
      const gracePeriodEnd = new Date(endTime.getTime() + 5 * 60 * 1000);

      // Solo cerrar si ya pasó el período de gracia
      if (now > gracePeriodEnd) {
        try {
          console.log(
            `[Cron] Cerrando sesión de Meet para cita ${appointment.id} (evento ${appointment.meet_event_id})`
          );

          await deleteMeetEvent(appointment.meet_event_id);

          // Actualizar el estado de la cita a completada
          await supabase
            .from("appointments")
            .update({ status: "completed" })
            .eq("id", appointment.id);

          closedCount++;
        } catch (error) {
          const errorMessage = `Error cerrando sesión para cita ${appointment.id}: ${
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
      closed: closedCount,
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
}

