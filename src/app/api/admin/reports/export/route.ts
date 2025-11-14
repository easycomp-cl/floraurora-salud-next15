export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { reportService } from "@/lib/services/reportService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = (url.searchParams.get("format") ?? "excel").toLowerCase();
    if (!["excel", "pdf"].includes(format)) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa excel o pdf." },
        { status: 400 },
      );
    }

    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const professionalIdParam = url.searchParams.get("professionalId");
    const service = url.searchParams.get("service") ?? undefined;
    const professionalId =
      professionalIdParam && professionalIdParam !== "all"
        ? Number(professionalIdParam)
        : undefined;

    const { filename, contentType, buffer } = await reportService.exportAppointmentsReport(
      { from, to, professionalId, service },
      format as "excel" | "pdf",
    );

    // Convertir Buffer a Uint8Array para compatibilidad con NextResponse
    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/reports/export] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al exportar el reporte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

