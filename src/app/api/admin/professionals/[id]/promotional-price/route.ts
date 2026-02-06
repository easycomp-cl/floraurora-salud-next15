import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

/**
 * PATCH /api/admin/professionals/[id]/promotional-price
 * Activa o desactiva el precio promocional para un profesional específico
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const professionalId = Number(id);
    if (Number.isNaN(professionalId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    if (typeof body?.use_promotional_price !== "boolean") {
      return NextResponse.json(
        { error: "El campo use_promotional_price es obligatorio y debe ser un booleano" },
        { status: 400 },
      );
    }

    await adminService.setProfessionalPromotionalPrice(
      professionalId,
      body.use_promotional_price
    );
    
    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: body.use_promotional_price 
        ? "enable_promotional_price" 
        : "disable_promotional_price",
      entity: "professionals",
      entityId: professionalId,
      metadata: {
        use_promotional_price: body.use_promotional_price,
      },
    });
    
    return NextResponse.json({ 
      ok: true,
      message: body.use_promotional_price
        ? "Precio promocional activado correctamente"
        : "Precio promocional desactivado correctamente"
    });
  } catch (error) {
    console.error("[PATCH /api/admin/professionals/:id/promotional-price] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al actualizar el precio promocional del profesional";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
