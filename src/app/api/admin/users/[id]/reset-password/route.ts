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
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const result = await adminService.sendPasswordReset(userId);

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "reset_password",
      entity: "users",
      entityId: userId,
      metadata: { link: result.recoveryLink },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/admin/users/:id/reset-password] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al generar el enlace de recuperación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

