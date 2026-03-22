import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";

/**
 * PATCH /api/admin/professionals/[id]/sii-verified
 * Actualiza si el profesional está verificado en SII para emisión de BHE.
 * Solo admins.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const professionalId = Number(id);
    if (Number.isNaN(professionalId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body?.sii_bhe_verified !== "boolean") {
      return NextResponse.json(
        { error: "El campo sii_bhe_verified es obligatorio (boolean)" },
        { status: 400 }
      );
    }

    const supabase = createAdminServer();

    const { error } = await supabase
      .from("professionals")
      .update({ sii_bhe_verified: body.sii_bhe_verified })
      .eq("id", professionalId);

    if (error) {
      console.error("[PATCH /api/admin/professionals/:id/sii-verified] Error:", error);
      return NextResponse.json(
        { error: error.message || "Error al actualizar verificación SII" },
        { status: 500 }
      );
    }

    await auditService.log({
      actorId,
      action: body.sii_bhe_verified ? "enable_sii_bhe_verified" : "disable_sii_bhe_verified",
      entity: "professionals",
      entityId: professionalId,
      metadata: { sii_bhe_verified: body.sii_bhe_verified },
    });

    return NextResponse.json({ ok: true, sii_bhe_verified: body.sii_bhe_verified });
  } catch (error) {
    console.error("[PATCH /api/admin/professionals/:id/sii-verified] Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar verificación SII" },
      { status: 500 }
    );
  }
}
