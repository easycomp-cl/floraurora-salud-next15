import { NextRequest, NextResponse } from "next/server";
import { configService } from "@/lib/services/configService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function GET(request: NextRequest) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const items = await configService.listCarouselItems();
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[GET /api/admin/carousel] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener el carrusel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    
    const body = await request.json();
    const item = await configService.upsertCarouselItem(null, body ?? {}, actorId);

    await auditService.log({
      actorId,
      action: "create_carousel_item",
      entity: "home_carousel_items",
      entityId: item.id,
      metadata: { title: item.title, display_order: item.display_order },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/carousel] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al guardar el carrusel.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

