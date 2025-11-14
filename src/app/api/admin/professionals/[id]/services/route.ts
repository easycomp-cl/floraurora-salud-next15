import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const professionalId = Number(id);
    if (Number.isNaN(professionalId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const serviceIds: number[] = Array.isArray(body?.serviceIds)
      ? body.serviceIds.map((value: unknown) => Number(value)).filter((value: number) => !Number.isNaN(value))
      : [];

    await adminService.assignServicesToProfessional({
      professionalId,
      serviceIds,
    });

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "assign_services_professional",
      entity: "professionals",
      entityId: professionalId,
      metadata: { serviceIds },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUT /api/admin/professionals/:id/services] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al asignar servicios al profesional";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

