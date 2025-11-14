export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { reportService } from "@/lib/services/reportService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const professionalIdParam = url.searchParams.get("professionalId");
    const patientIdParam = url.searchParams.get("patientId");
    const areaIdParam = url.searchParams.get("areaId");
    const service = url.searchParams.get("service") ?? undefined;

    const professionalId =
      professionalIdParam && professionalIdParam !== "all"
        ? Number(professionalIdParam)
        : undefined;

    const patientId =
      patientIdParam && patientIdParam !== "all"
        ? Number(patientIdParam)
        : undefined;

    const areaId =
      areaIdParam && areaIdParam !== "all"
        ? Number(areaIdParam)
        : undefined;

    const rows = await reportService.getAppointmentsReport({
      from,
      to,
      professionalId,
      patientId,
      areaId,
      service,
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("[GET /api/admin/reports/appointments] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener el reporte de citas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

