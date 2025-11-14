import { NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function GET() {
  try {
    const settings = await configService.getSystemSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/admin/system-settings] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener la configuración.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const actorId = await getAdminActorId();
    const updated = await configService.updateSystemSettings(body ?? {}, actorId);

    await auditService.log({
      actorId,
      action: "update_system_settings",
      entity: "system_settings",
      entityId: "global",
      metadata: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT /api/admin/system-settings] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar la configuración.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

