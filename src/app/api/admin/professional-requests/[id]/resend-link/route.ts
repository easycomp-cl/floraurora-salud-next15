import { NextRequest, NextResponse } from "next/server";
import { professionalRequestsService } from "@/lib/services/professionalRequestsService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { auditService } from "@/lib/services/auditService";
import {
  sendProfessionalRequestApprovedEmail,
} from "@/lib/services/emailService";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const requestId = Number(id);

    if (Number.isNaN(requestId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const adminUserId = await getAdminActorId(req);
    if (!adminUserId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener la solicitud antes de reenviar el enlace
    const request = await professionalRequestsService.getRequestById(requestId);
    if (!request) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (request.status !== "approved") {
      return NextResponse.json(
        { error: "Solo se pueden reenviar enlaces para solicitudes aprobadas" },
        { status: 400 }
      );
    }

    // Generar nuevo enlace de verificación
    const { verificationLink } = await professionalRequestsService.resendVerificationLink(requestId);

    // Enviar correo con el nuevo enlace
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
        action: "resend_verification_link",
        entity: "professional_requests",
        entityId: requestId,
      });
    } catch (auditError) {
      console.error("Error al registrar auditoría (no crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Enlace de verificación reenviado exitosamente",
      verificationLink,
    });
  } catch (error) {
    console.error("[POST /api/admin/professional-requests/:id/resend-link] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al reenviar el enlace";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

