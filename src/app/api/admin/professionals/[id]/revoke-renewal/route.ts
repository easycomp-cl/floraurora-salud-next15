import { NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

/**
 * POST /api/admin/professionals/[id]/revoke-renewal
 * Revoca el mes gratis concedido y pasa al profesional a Plan Light
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

    let grantedByAdmin = false;
    let planType: string | null = null;

    const { data: profWithGrant, error: profError } = await supabase
      .from("professionals")
      .select("id, plan_type, admin_granted_plan")
      .eq("id", professionalId)
      .single();

    if (profError) {
      const { data: profBasic } = await supabase
        .from("professionals")
        .select("id, plan_type")
        .eq("id", professionalId)
        .single();
      if (!profBasic) {
        return NextResponse.json(
          { error: "No se encontró el profesional" },
          { status: 404 }
        );
      }
      planType = (profBasic as { plan_type?: string }).plan_type ?? null;
      grantedByAdmin = false;
    } else if (profWithGrant) {
      planType = (profWithGrant as { plan_type?: string }).plan_type ?? null;
      grantedByAdmin = (profWithGrant as { admin_granted_plan?: boolean }).admin_granted_plan === true;
    }

    if (planType !== "monthly") {
      return NextResponse.json(
        { error: "El profesional no tiene plan mensual. No hay nada que revocar." },
        { status: 400 }
      );
    }

    if (!grantedByAdmin) {
      const { data: payments } = await supabase
        .from("monthly_subscription_payments")
        .select("id")
        .eq("professional_id", professionalId)
        .eq("provider_payment_status", "succeeded")
        .limit(1);

      const hasPaidPlan = payments && payments.length > 0;
      if (hasPaidPlan) {
        return NextResponse.json(
          {
            error:
              "Este profesional tiene pagos registrados. Solo se puede revocar planes otorgados sin pago por admin.",
          },
          { status: 400 }
        );
      }
    }

    let updateError = (await supabase
      .from("professionals")
      .update({
        plan_type: "commission",
        last_monthly_payment_date: null,
        monthly_plan_expires_at: null,
        admin_granted_plan: false,
      })
      .eq("id", professionalId)).error;

    if (updateError) {
      updateError = (await supabase
        .from("professionals")
        .update({
          plan_type: "commission",
          last_monthly_payment_date: null,
          monthly_plan_expires_at: null,
        })
        .eq("id", professionalId)).error;
    }

    if (updateError) {
      console.error("[revoke-renewal] Error actualizando:", updateError);
      return NextResponse.json(
        { error: "Error al revocar el plan" },
        { status: 500 }
      );
    }

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "admin_revoke_renewal",
      entity: "professionals",
      entityId: professionalId,
      metadata: { previous_plan_type: planType },
    });

    return NextResponse.json({
      ok: true,
      message: "Mes gratis revocado. El profesional pasó a Plan Light.",
    });
  } catch (error) {
    console.error("[POST /api/admin/professionals/:id/revoke-renewal] Error", error);
    return NextResponse.json(
      { error: "Error al revocar el plan" },
      { status: 500 }
    );
  }
}
