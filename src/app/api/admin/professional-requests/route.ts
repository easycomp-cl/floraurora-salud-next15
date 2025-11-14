import { NextResponse } from "next/server";
import { professionalRequestsService } from "@/lib/services/professionalRequestsService";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as
      | "pending"
      | "approved"
      | "rejected"
      | "resubmitted"
      | "all"
      | null;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || undefined;

    const result = await professionalRequestsService.listRequests({
      status: status || "all",
      page,
      pageSize,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/professional-requests] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al obtener solicitudes profesionales";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

