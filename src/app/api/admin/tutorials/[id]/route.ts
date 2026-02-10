import { NextRequest, NextResponse } from "next/server";
import { tutorialService } from "@/lib/services/tutorialService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const videoId = Number(id);
    if (Number.isNaN(videoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const item = await tutorialService.upsert(videoId, body ?? {}, actorId);

    await auditService.log({
      actorId,
      action: "update_tutorial_video",
      entity: "tutorial_videos",
      entityId: videoId,
      metadata: { title: item.title, visibility: item.visibility },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[PUT /api/admin/tutorials/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al actualizar el tutorial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const videoId = Number(id);
    if (Number.isNaN(videoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await tutorialService.delete(videoId);
    await auditService.log({
      actorId,
      action: "delete_tutorial_video",
      entity: "tutorial_videos",
      entityId: videoId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/tutorials/:id] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al eliminar el tutorial.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
