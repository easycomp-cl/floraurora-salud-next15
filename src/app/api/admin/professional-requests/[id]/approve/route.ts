import { NextResponse } from "next/server";
import { professionalRequestsService } from "@/lib/services/professionalRequestsService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";
import {
  sendProfessionalRequestApprovedEmail,
} from "@/lib/services/emailService";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);

    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const adminUserId = await getAdminActorId();
    if (!adminUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener la solicitud antes de aprobar para enviar el email
    const request = await professionalRequestsService.getRequestById(requestId);
    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    // Aprobar la solicitud
    const { verificationLink } = await professionalRequestsService.approveRequest(
      requestId,
      adminUserId
    );

    // Enviar correo de aprobación
    try {
      await sendProfessionalRequestApprovedEmail({
        to: request.email,
        professionalName: request.full_name,
        verificationLink,
      });
    } catch (emailError) {
      console.error("Error al enviar correo (no crítico):", emailError);
      // No fallar la operación por error de email
    }

    // Registrar en auditoría
    try {
      await auditService.log({
        actorId: adminUserId,
        action: "approve_professional_request",
        entity: "professional_requests",
        entityId: requestId,
      });
    } catch (auditError) {
      console.error("Error al registrar auditoría (no crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud aprobada exitosamente",
    });
  } catch (error) {
    console.error(
      "[POST /api/admin/professional-requests/:id/approve] Error",
      error
    );
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al aprobar la solicitud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

