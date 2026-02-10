import { NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getPlanPricingConfig } from "@/lib/services/planPricingService";

export interface PlanPayment {
  id: number;
  amount: number;
  currency: string;
  payment_date: string;
  provider_payment_status: string;
  expires_at: string;
}

export interface ProfessionalPlanResponse {
  plan_type: "commission" | "monthly" | null;
  monthly_plan_expires_at: string | null;
  last_monthly_payment_date: string | null;
  use_promotional_price: boolean;
  admin_granted_plan: boolean;
  can_revoke: boolean;
  payments: PlanPayment[];
  config: {
    premiumNormalPrice: number;
    premiumPromotionPrice: number;
  };
}

/**
 * GET /api/admin/professionals/[id]/plan
 * Obtiene el detalle del plan y el historial de pagos del profesional
 */
export async function GET(
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

    let professional: Record<string, unknown> | null = null;
    const { data: profWithGrant, error: profError } = await supabase
      .from("professionals")
      .select("id, plan_type, monthly_plan_expires_at, last_monthly_payment_date, use_promotional_price, admin_granted_plan")
      .eq("id", professionalId)
      .single();

    if (profError) {
      const { data: profBasic } = await supabase
        .from("professionals")
        .select("id, plan_type, monthly_plan_expires_at, last_monthly_payment_date, use_promotional_price")
        .eq("id", professionalId)
        .single();
      professional = profBasic as Record<string, unknown> | null;
      if (!professional) {
        return NextResponse.json(
          { error: "No se encontró el profesional" },
          { status: 404 }
        );
      }
      (professional as Record<string, unknown>).admin_granted_plan = false;
    } else {
      professional = profWithGrant as Record<string, unknown> | null;
    }

    if (!professional) {
      return NextResponse.json(
        { error: "No se encontró el profesional" },
        { status: 404 }
      );
    }

    let payments: PlanPayment[] = [];
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("monthly_subscription_payments")
      .select("id, amount, currency, payment_date, provider_payment_status, expires_at")
      .eq("professional_id", professionalId)
      .eq("provider_payment_status", "succeeded")
      .order("payment_date", { ascending: false })
      .limit(50);

    if (!paymentsError && paymentsData && paymentsData.length > 0) {
      payments = paymentsData.map((p) => ({
        id: Number(p.id),
        amount: Number(p.amount ?? 0),
        currency: String(p.currency ?? "CLP"),
        payment_date: String(p.payment_date ?? ""),
        provider_payment_status: String(p.provider_payment_status ?? ""),
        expires_at: String(p.expires_at ?? ""),
      }));
    }

    const config = await getPlanPricingConfig();

    const response: ProfessionalPlanResponse = {
      plan_type: (professional.plan_type as "commission" | "monthly" | null) ?? null,
      monthly_plan_expires_at: professional.monthly_plan_expires_at
        ? String(professional.monthly_plan_expires_at)
        : null,
      last_monthly_payment_date: professional.last_monthly_payment_date
        ? String(professional.last_monthly_payment_date)
        : null,
      use_promotional_price: Boolean(professional.use_promotional_price ?? false),
      admin_granted_plan: Boolean(professional.admin_granted_plan ?? false),
      can_revoke:
        (professional.plan_type as string) === "monthly" &&
        (Boolean(professional.admin_granted_plan ?? false) ||
          !(payments && payments.length > 0)),
      payments,
      config: {
        premiumNormalPrice: config.premiumNormalPrice,
        premiumPromotionPrice: config.premiumPromotionPrice,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/admin/professionals/:id/plan] Error", error);
    return NextResponse.json(
      { error: "Error al obtener el plan del profesional" },
      { status: 500 }
    );
  }
}
