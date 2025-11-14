import { NextResponse } from "next/server";
import { professionalRequestsService } from "@/lib/services/professionalRequestsService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";
import {
  sendProfessionalRequestRejectedEmail,
} from "@/lib/services/emailService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);

    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { rejectionReason } = body;

    if (!rejectionReason || typeof rejectionReason !== "string" || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { error: "El motivo de rechazo es obligatorio" },
        { status: 400 }
      );
    }

    const adminUserId = await getAdminActorId();
    if (!adminUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener la solicitud antes de rechazar para enviar el email
    const professionalRequest = await professionalRequestsService.getRequestById(requestId);
    if (!professionalRequest) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Rechazar la solicitud
    await professionalRequestsService.rejectRequest(
      requestId,
      adminUserId,
      rejectionReason.trim()
    );

    // Enviar correo de rechazo
    try {
      await sendProfessionalRequestRejectedEmail({
        to: professionalRequest.email,
        professionalName: professionalRequest.full_name,
        rejectionReason: rejectionReason.trim(),
      });
    } catch (emailError) {
      console.error("Error al enviar correo (no crítico):", emailError);
      // No fallar la operación por error de email
    }

    // Registrar en auditoría
    try {
      await auditService.log({
        actorId: adminUserId,
        action: "reject_professional_request",
        entity: "professional_requests",
        entityId: requestId,
        metadata: {
          rejection_reason: rejectionReason.trim(),
        },
      });
    } catch (auditError) {
      console.error("Error al registrar auditoría (no crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud rechazada exitosamente",
    });
  } catch (error) {
    console.error(
      "[POST /api/admin/professional-requests/:id/reject] Error",
      error
    );
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al rechazar la solicitud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

