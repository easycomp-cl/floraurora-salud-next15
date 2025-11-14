import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await adminService.activateService(serviceId);
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "activate_service",
      entity: "services",
      entityId: serviceId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/admin/services/:id/activate] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al activar el servicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

