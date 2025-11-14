import { NextResponse } from "next/server";
import { auditService } from "@/lib/services/auditService";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actorParam = url.searchParams.get("actorId");
    const entity = url.searchParams.get("entity") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "25");

    const { data, total } = await auditService.list({
      actorId: actorParam ? Number(actorParam) : undefined,
      entity,
      from,
      to,
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) ? 25 : pageSize,
    });

    return NextResponse.json({ data, total });
  } catch (error) {
    console.error("[GET /api/admin/logs] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener los registros.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

