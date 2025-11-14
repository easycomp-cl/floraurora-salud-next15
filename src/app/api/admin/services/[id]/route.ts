import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { data } = await adminService.listServices();
    const service = data.find((item) => item.id === serviceId);

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("[GET /api/admin/services/:id] Error", error);
    return NextResponse.json(
      { error: "Error interno al obtener el servicio" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const updated = await adminService.updateService(serviceId, body);
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "update_service",
      entity: "services",
      entityId: serviceId,
      metadata: body,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/admin/services/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar el servicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const serviceId = Number(id);
    if (Number.isNaN(serviceId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await adminService.deactivateService(serviceId);
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "deactivate_service",
      entity: "services",
      entityId: serviceId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/services/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al desactivar el servicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

