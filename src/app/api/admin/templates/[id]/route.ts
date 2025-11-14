import { NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);
    if (Number.isNaN(templateId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const actorId = await getAdminActorId();
    const template = await configService.upsertNotificationTemplate(
      templateId,
      {
        channel: String(body.channel) as "email" | "whatsapp",
        template_key: String(body.template_key),
        name: String(body.name),
        subject: body.subject ? String(body.subject) : undefined,
        body: String(body.body),
        variables: Array.isArray(body.variables) ? body.variables : undefined,
        is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      },
      actorId,
    );

    await auditService.log({
      actorId,
      action: "update_template",
      entity: "notification_templates",
      entityId: templateId,
      metadata: { template_key: template.template_key },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PUT /api/admin/templates/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar la plantilla.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const templateId = Number(id);
    if (Number.isNaN(templateId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await configService.deleteNotificationTemplate(templateId);
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "delete_template",
      entity: "notification_templates",
      entityId: templateId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/templates/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al eliminar la plantilla.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

