import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function POST(
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
    const blocked = Boolean(body?.blocked);
    const reason = body?.reason ? String(body.reason) : undefined;
    const until = body?.until ? String(body.until) : null;

    const user = await adminService.setUserBlock(userId, { blocked, reason, until });

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: blocked ? "block_user" : "unblock_user",
      entity: "users",
      entityId: userId,
      metadata: { reason, until },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("[POST /api/admin/users/:id/block] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al actualizar el estado de bloqueo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

