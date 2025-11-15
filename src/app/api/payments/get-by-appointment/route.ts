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

    console.log("Buscando pago para appointmentId:", appointmentId);

    const supabase = createAdminServer();

    // Buscar el pago más reciente y exitoso para esta cita
    // Intentar primero con el ID tal como viene
    let { data: payments, error } = await supabase
      .from("payments")
      .select("id, appointment_id, amount, currency, provider_payment_status, created_at")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1);

    // Si no se encuentra, intentar con diferentes formatos
    if ((!payments || payments.length === 0) && appointmentId.includes('-')) {
      console.log("No se encontró con el ID completo, intentando con formato numérico...");
      // Extraer solo los números del ID (por si viene como APT-00000053)
      const numericId = appointmentId.replace(/\D/g, '');
      if (numericId) {
        console.log("Buscando con ID numérico:", numericId);
        const result = await supabase
          .from("payments")
          .select("id, appointment_id, amount, currency, provider_payment_status, created_at")
          .eq("appointment_id", numericId)
          .order("created_at", { ascending: false })
          .limit(1);
        payments = result.data;
        error = result.error;
      }
    }

    // Si aún no se encuentra, buscar por el ID numérico extraído
    if ((!payments || payments.length === 0) && !appointmentId.match(/^\d+$/)) {
      const numericId = appointmentId.replace(/\D/g, '');
      if (numericId && numericId !== appointmentId) {
        console.log("Buscando con ID numérico extraído:", numericId);
        const result = await supabase
          .from("payments")
          .select("id, appointment_id, amount, currency, provider_payment_status, created_at")
          .eq("appointment_id", numericId)
          .order("created_at", { ascending: false })
          .limit(1);
        payments = result.data;
        error = result.error;
      }
    }

    if (error) {
      console.error("Error obteniendo pago:", error);
      return NextResponse.json(
        { error: "Error al obtener el pago", details: error.message },
        { status: 500 }
      );
    }

    if (!payments || payments.length === 0) {
      console.log("No se encontró ningún pago para appointmentId:", appointmentId);
      // Intentar buscar todos los pagos recientes para debugging
      const { data: recentPayments } = await supabase
        .from("payments")
        .select("appointment_id, provider_payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      console.log("Últimos 5 pagos registrados (para debugging):", recentPayments);
      
      return NextResponse.json(
        { error: "No se encontró ningún pago para esta cita", appointmentId },
        { status: 404 }
      );
    }

    const payment = payments[0];
    console.log("Pago encontrado:", payment);

    return NextResponse.json({
      amount: payment.amount,
      currency: payment.currency || "CLP",
      status: payment.provider_payment_status,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error("Error en get-by-appointment:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

