import { NextRequest, NextResponse } from "next/server";
import { tutorialService } from "@/lib/services/tutorialService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function GET(request: NextRequest) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const items = await tutorialService.listAll(actorId);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("[GET /api/admin/tutorials] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al obtener los tutoriales.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const item = await tutorialService.upsert(null, body ?? {}, actorId);

    await auditService.log({
      actorId,
      action: "create_tutorial_video",
      entity: "tutorial_videos",
      entityId: item.id,
      metadata: { title: item.title, visibility: item.visibility },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/tutorials] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al guardar el tutorial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
