import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import type { UpdateAdminUserPayload } from "@/lib/types/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const user = await adminService.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET /api/admin/users/:id] Error", error);
    return NextResponse.json(
      { error: "Error interno al obtener el usuario" },
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
    const userId = Number(id);

    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = (await request.json()) as UpdateAdminUserPayload;
    const user = await adminService.updateUser(userId, body);

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "update_user",
      entity: "users",
      entityId: userId,
      metadata: body as unknown as Record<string, unknown>,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PUT /api/admin/users/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

