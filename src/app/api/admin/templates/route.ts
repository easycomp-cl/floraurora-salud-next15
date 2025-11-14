import { NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function GET() {
  try {
    const templates = await configService.listNotificationTemplates();
    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error("[GET /api/admin/templates] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al listar plantillas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.channel || !body?.template_key || !body?.name || !body?.body) {
      return NextResponse.json(
        { error: "Los campos channel, template_key, name y body son obligatorios." },
        { status: 400 },
      );
    }

    const actorId = await getAdminActorId();
    const template = await configService.upsertNotificationTemplate(
      null,
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
      action: "create_template",
      entity: "notification_templates",
      entityId: template.id,
      metadata: { template_key: template.template_key },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/templates] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al guardar la plantilla.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

