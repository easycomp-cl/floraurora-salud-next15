export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { reportService } from "@/lib/services/reportService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;

    const metrics = await reportService.getDashboardMetrics({ from, to });
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[GET /api/admin/reports/metrics] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al calcular las métricas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

