import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * API Route para obtener el pago de una cita específica
 * GET /api/payments/get-by-appointment?appointmentId=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId es requerido" },
        { status: 400 }
      );
    }

    const supabase = createAdminServer();

    // Buscar el pago más reciente y exitoso para esta cita
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, currency, provider_payment_status, created_at")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error obteniendo pago:", error);
      return NextResponse.json(
        { error: "Error al obtener el pago" },
        { status: 500 }
      );
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { error: "No se encontró ningún pago para esta cita" },
        { status: 404 }
      );
    }

    const payment = payments[0];

    return NextResponse.json({
      amount: payment.amount,
      currency: payment.currency || "CLP",
      status: payment.provider_payment_status,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error("Error en get-by-appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

