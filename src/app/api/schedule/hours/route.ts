import { NextResponse } from "next/server";
import { getScheduleHoursConfig, generateTimeSlots } from "@/lib/services/scheduleConfigService";

/**
 * API Route para obtener las horas permitidas para crear horarios
 * GET /api/schedule/hours
 */
export async function GET() {
  try {
    const config = await getScheduleHoursConfig();
    const timeSlots = generateTimeSlots(config.startHour, config.endHour);

    return NextResponse.json({
      success: true,
      config: {
        startHour: config.startHour,
        endHour: config.endHour,
      },
      timeSlots,
    });
  } catch (error) {
    console.error("Error obteniendo horas de horarios:", error);
    return NextResponse.json(
      {
        error: "Error al obtener las horas de horarios",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
