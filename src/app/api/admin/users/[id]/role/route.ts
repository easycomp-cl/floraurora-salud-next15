import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import type { AdminRole } from "@/lib/types/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const role = String(body?.role ?? "");

    if (!["admin", "patient", "professional"].includes(role)) {
      return NextResponse.json({ error: "Rol no soportado" }, { status: 400 });
    }

    const user = await adminService.assignRole(userId, role as AdminRole);

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "assign_role",
      entity: "users",
      entityId: userId,
      metadata: { role },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[PATCH /api/admin/users/:id/role] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al asignar el rol";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

