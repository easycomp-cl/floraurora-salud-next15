import { NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import { calculateNewExpirationDate } from "@/lib/utils/plan-renewal";

/**
 * POST /api/admin/professionals/[id]/grant-renewal
 * Concede 1 mes adicional de plan premium al profesional (renovación por admin, sin pago)
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const professionalId = Number(id);
    if (Number.isNaN(professionalId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = createAdminServer();

    const { data: professional, error: profError } = await supabase
      .from("professionals")
      .select("id, plan_type, monthly_plan_expires_at")
      .eq("id", professionalId)
      .single();

    if (profError || !professional) {
      return NextResponse.json(
        { error: "No se encontró el profesional" },
        { status: 404 }
      );
    }

    // Validación: si ya tiene plan mensual activo (no vencido), no se puede regalar
    const expiresAt = professional.monthly_plan_expires_at
      ? new Date(professional.monthly_plan_expires_at)
      : null;
    if (
      professional.plan_type === "monthly" &&
      expiresAt &&
      expiresAt > new Date()
    ) {
      return NextResponse.json(
        {
          error:
            "El profesional ya tiene plan mensual activo. No se puede conceder un mes gratis mientras el plan no haya vencido.",
        },
        { status: 400 }
      );
    }

    // Si tiene plan mensual con fecha de expiración (vencida), extender desde esa fecha
    // Si es nuevo o tiene plan comisión, dar 1 mes desde hoy
    const currentExpiration =
      professional.plan_type === "monthly" && professional.monthly_plan_expires_at
        ? new Date(professional.monthly_plan_expires_at)
        : null;
    const newExpirationDate = calculateNewExpirationDate(currentExpiration);

    const { error: updateError } = await supabase
      .from("professionals")
      .update({
        plan_type: "monthly",
        last_monthly_payment_date: new Date().toISOString(),
        monthly_plan_expires_at: newExpirationDate.toISOString(),
        admin_granted_plan: true,
        is_active: true,
      })
      .eq("id", professionalId);

    if (updateError) {
      console.error("[grant-renewal] Error actualizando:", updateError);
      return NextResponse.json(
        { error: "Error al conceder la renovación" },
        { status: 500 }
      );
    }

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "admin_grant_renewal",
      entity: "professionals",
      entityId: professionalId,
      metadata: {
        previous_expiration: professional.monthly_plan_expires_at ?? null,
        new_expiration: newExpirationDate.toISOString(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Se concedió el mes gratis correctamente. El profesional puede revocarse y pasar a Plan Light si lo deseas.",
      expires_at: newExpirationDate.toISOString(),
    });
  } catch (error) {
    console.error("[POST /api/admin/professionals/:id/grant-renewal] Error", error);
    return NextResponse.json(
      { error: "Error al conceder la renovación" },
      { status: 500 }
    );
  }
}
