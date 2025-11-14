import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function PATCH(
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
    if (typeof body?.is_active !== "boolean") {
      return NextResponse.json(
        { error: "El campo is_active es obligatorio" },
        { status: 400 },
      );
    }

    await adminService.setProfessionalStatus(professionalId, body.is_active);
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: body.is_active ? "activate_professional" : "deactivate_professional",
      entity: "professionals",
      entityId: professionalId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/admin/professionals/:id/status] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al actualizar el estado del profesional";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

