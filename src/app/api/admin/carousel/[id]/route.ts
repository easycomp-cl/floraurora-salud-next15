import { NextRequest, NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const { id } = await context.params;
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const item = await configService.upsertCarouselItem(itemId, body ?? {}, actorId);

    await auditService.log({
      actorId,
      action: "update_carousel_item",
      entity: "home_carousel_items",
      entityId: itemId,
      metadata: { title: item.title, display_order: item.display_order },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[PUT /api/admin/carousel/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar el carrusel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const { id } = await context.params;
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await configService.deleteCarouselItem(itemId);
    await auditService.log({
      actorId,
      action: "delete_carousel_item",
      entity: "home_carousel_items",
      entityId: itemId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/carousel/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al eliminar el carrusel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

