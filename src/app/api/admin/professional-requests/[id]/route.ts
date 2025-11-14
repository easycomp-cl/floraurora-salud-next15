import { NextResponse } from "next/server";
import { professionalRequestsService } from "@/lib/services/professionalRequestsService";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);

    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const request = await professionalRequestsService.getRequestById(requestId);

    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("[GET /api/admin/professional-requests/:id] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al obtener la solicitud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

