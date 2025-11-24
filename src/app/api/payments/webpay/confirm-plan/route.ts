import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getTransbankConfig } from "@/lib/config";

/**
 * API Route para confirmar una transacción de Webpay Plus para pago de plan mensual
 * GET/POST /api/payments/webpay/confirm-plan
 * Esta ruta es llamada por Transbank después de que el usuario completa el pago
 */
export async function GET(request: NextRequest) {
  return handleWebpayCallback(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleWebpayCallback(request, "POST");
}

async function handleWebpayCallback(request: NextRequest, method: "GET" | "POST") {
  try {
    let tokenWs: string | null = null;
    let tokenTbk: string | null = null;

    if (method === "GET") {
      // Obtener el token de la URL (query parameters)
      const searchParams = request.nextUrl.searchParams;
      tokenWs = searchParams.get("token_ws");
      tokenTbk = searchParams.get("TBK_TOKEN");
    } else {
      // Obtener el token del body (formData)
      const formData = await request.formData();
      tokenWs = formData.get("token_ws") as string | null;
      tokenTbk = formData.get("TBK_TOKEN") as string | null;
    }

    // Si hay token de cancelación, redirigir
    if (tokenTbk) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=cancelled`
      );
    }

    if (!tokenWs) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener configuración de Transbank usando función helper
    const transbankConfig = getTransbankConfig();
    const { commerceCode, apiKey, isProduction, environment, detectedBy } = transbankConfig;

    if (!commerceCode || !apiKey) {
      console.error("❌ [confirm-plan] Credenciales de Transbank no configuradas");
      return NextResponse.json(
        { error: "Configuración de pago no disponible" },
        { status: 500 }
      );
    }

    console.log("🔐 [confirm-plan] Configuración de Transbank:", {
      hasCommerceCode: !!commerceCode,
      hasApiKey: !!apiKey,
      environment: environment === "production" ? "Production" : "Integration",
      isProduction,
      detectedBy,
    });

    // Importar dinámicamente el SDK de Transbank (solo en el servidor)
    const { WebpayPlus, Options, Environment } = await import("transbank-sdk");

    // Configurar ambiente según la detección automática
    const transbankEnvironment = isProduction
      ? Environment.Production
      : Environment.Integration;

    const options = new Options(commerceCode, apiKey, transbankEnvironment);
    const transaction = new WebpayPlus.Transaction(options);

    // Confirmar la transacción con Webpay
    let response;
    try {
      response = await transaction.commit(tokenWs);
    } catch (error: unknown) {
      console.error("Error confirmando transacción de Webpay:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage?.includes("aborted") || errorMessage?.includes("invalid finished state")) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=aborted`
        );
      }
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=error&message=${encodeURIComponent(errorMessage || "Error desconocido")}`
      );
    }

    // Validar respuesta
    if (!response) {
      console.error("Respuesta inválida de Webpay al confirmar:", response);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=invalid_response`
      );
    }

    // Verificar si la transacción fue exitosa
    const isSuccess = response.response_code === 0;

    if (!isSuccess) {
      console.error("Transacción rechazada:", response);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=rejected&code=${response.response_code || "unknown"}`
      );
    }

    // Extraer información de la transacción
    const {
      buy_order,
      authorization_code,
      transaction_date,
      card_detail,
      details,
    } = response;

    // Obtener professionalId del buy_order (formato: plan{professionalId}{timestamp})
    const buyOrderMatch = buy_order?.match(/^plan(\d+)/);
    const professionalIdFromBuyOrder = buyOrderMatch ? parseInt(buyOrderMatch[1]) : null;

    console.log("Buy_order recibido:", buy_order);
    console.log("ProfessionalId extraído del buy_order:", professionalIdFromBuyOrder);

    // Usar cliente admin para evitar problemas de RLS cuando Webpay redirige
    const adminSupabase = createAdminServer();

    // Buscar el registro de pago por buy_order
    const { data: paymentRecord, error: paymentError } = await adminSupabase
      .from("monthly_subscription_payments")
      .select("id, professional_id, provider_payment_status")
      .eq("buy_order", buy_order)
      .single();

    if (paymentError || !paymentRecord) {
      console.error("Error obteniendo registro de pago:", paymentError);
      
      // Si no encontramos el registro pero tenemos el professionalId del buy_order, continuar
      if (!professionalIdFromBuyOrder) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=error&message=${encodeURIComponent("No se encontró el registro de pago")}`
        );
      }
    }

    const professionalId = paymentRecord?.professional_id || professionalIdFromBuyOrder;

    if (!professionalId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=error&message=${encodeURIComponent("No se pudo identificar el profesional")}`
      );
    }

    console.log("Registrando pago para profesional con ID:", professionalId);

    // Obtener la fecha de expiración actual del profesional para calcular la nueva fecha correctamente
    // Esto se hace una sola vez y se usa tanto para el registro de pago como para actualizar el profesional
    const { data: currentProfessional } = await adminSupabase
      .from("professionals")
      .select("monthly_plan_expires_at")
      .eq("id", professionalId)
      .single();

    // Calcular nueva fecha de expiración según reglas financieras chilenas
    // Si es renovación: +30 días desde la fecha de expiración actual
    // Si es primer pago: +30 días desde hoy
    const { calculateNewExpirationDate } = await import("@/lib/utils/plan-renewal");
    const currentExpirationDate = currentProfessional?.monthly_plan_expires_at || null;
    const newExpirationDate = calculateNewExpirationDate(currentExpirationDate);

    // Verificar si el pago ya existe antes de actualizar
    if (paymentRecord && paymentRecord.provider_payment_status === "succeeded") {
      console.log("El pago ya está registrado como exitoso:", paymentRecord);
      // El pago ya está registrado, continuar con el flujo normalmente
    } else {
      const updateData: Record<string, unknown> = {
        provider_payment_id: authorization_code || tokenWs,
        provider_payment_status: "succeeded",
        payment_date: transaction_date ? new Date(transaction_date) : new Date(),
        expires_at: newExpirationDate.toISOString(),
        raw_response: {
          buy_order,
          authorization_code,
          transaction_date,
          card_number: card_detail?.card_number || null,
          response_code: response.response_code,
          vci: response.vci,
          details: details || [],
        },
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await adminSupabase
        .from("monthly_subscription_payments")
        .update(updateData)
        .eq("buy_order", buy_order);

      if (updateError) {
        console.error("Error actualizando registro de pago:", updateError);
        // Aunque falle el registro, la transacción fue exitosa en Webpay
        // Continuar con la actualización del plan del profesional
      } else {
        console.log("Pago registrado exitosamente");
      }
    }

    // Actualizar el plan del profesional
    const { error: updateProfessionalError } = await adminSupabase
      .from("professionals")
      .update({
        plan_type: "monthly", // Asegurar que el plan_type sea "monthly"
        last_monthly_payment_date: new Date().toISOString(),
        monthly_plan_expires_at: newExpirationDate.toISOString(),
        is_active: true,
      })
      .eq("id", professionalId);

    if (updateProfessionalError) {
      console.error("Error actualizando plan del profesional:", updateProfessionalError);
      // Aunque falle la actualización, el pago fue exitoso
      // Redirigir con advertencia
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=success&warning=plan_update_failed`
      );
    }

    console.log("Plan del profesional actualizado exitosamente");

    // Redirigir a página de éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=success`
    );
  } catch (error: unknown) {
    console.error("Error confirmando transacción de Webpay para plan:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/my-plan?payment=error&message=${encodeURIComponent(errorMessage)}`
    );
  }
}

