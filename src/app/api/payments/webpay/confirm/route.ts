import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";

/**
 * API Route para confirmar una transacción de Webpay Plus
 * GET/POST /api/payments/webpay/confirm
 * Esta ruta es llamada por Transbank después de que el usuario completa el pago
 * Transbank puede enviar el token por GET (en la URL) o por POST (en el body)
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
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=cancelled`
      );
    }

    if (!tokenWs) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }

    // Obtener credenciales de variables de entorno
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;
    const apiKey = process.env.TRANSBANK_API_KEY;
    const isProduction = process.env.NODE_ENV === "production";

    if (!commerceCode || !apiKey) {
      console.error("Credenciales de Transbank no configuradas");
      return NextResponse.json(
        { error: "Configuración de pago no disponible" },
        { status: 500 }
      );
    }

    // Importar dinámicamente el SDK de Transbank (solo en el servidor)
    const { WebpayPlus, Options, Environment } = await import("transbank-sdk");

    // Configurar ambiente
    const environment = isProduction
      ? Environment.Production
      : Environment.Integration;

    const options = new Options(commerceCode, apiKey, environment);
    const transaction = new WebpayPlus.Transaction(options);

    // Confirmar la transacción con Webpay
    let response;
    try {
      response = await transaction.commit(tokenWs);
    } catch (error: unknown) {
      console.error("Error confirmando transacción de Webpay:", error);
      
      // Manejar casos específicos de errores
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObj = error as { message?: string; buy_order?: string };
      if (errorMessage?.includes("aborted") || errorMessage?.includes("invalid finished state")) {
        // La transacción ya fue abortada o tiene un estado inválido
        // Intentar obtener información del buy_order si está disponible en el error
        const buyOrderFromError = errorObj?.buy_order || null;
        if (buyOrderFromError) {
          const buyOrderMatch = buyOrderFromError.match(/^apt(\d+)$/);
          const appointmentId = buyOrderMatch ? buyOrderMatch[1] : null;
          if (appointmentId) {
            return NextResponse.redirect(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?appointmentId=${appointmentId}&reason=aborted`
            );
          }
        }
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=aborted`
        );
      }
      
      // Otro tipo de error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=error&message=${encodeURIComponent(errorMessage || "Error desconocido")}`
      );
    }

    // Validar respuesta
    if (!response) {
      console.error("Respuesta inválida de Webpay al confirmar:", response);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=invalid_response`
      );
    }

    // Verificar si la transacción fue exitosa
    const isSuccess = response.response_code === 0;

    if (!isSuccess) {
      console.error("Transacción rechazada:", response);
      const buyOrder = response.buy_order || "";
      const buyOrderMatch = buyOrder.match(/^apt(\d+)$/);
      const appointmentId = buyOrderMatch ? buyOrderMatch[1] : null;
      
      const errorParams = new URLSearchParams({
        reason: String(response.response_code || "rejected"),
        status: response.status || "FAILED",
      });
      if (appointmentId) {
        errorParams.set("appointmentId", appointmentId);
      }
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?${errorParams.toString()}`
      );
    }

    // Extraer información de la transacción
    const {
      buy_order,
      amount,
      authorization_code,
      transaction_date,
      card_detail,
      details,
    } = response;

    // Obtener appointmentId del buy_order (formato: apt{id})
    const buyOrderMatch = buy_order?.match(/^apt(\d+)$/);
    let appointmentId = buyOrderMatch ? buyOrderMatch[1] : null;

    console.log("Buy_order recibido:", buy_order);
    console.log("AppointmentId extraído:", appointmentId);

    // Crear cliente de Supabase
    const supabase = await createClient();

    let appointment = null;
    let appointmentError = null;

    // Intentar buscar por ID primero
    if (appointmentId) {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, patient_id, professional_id, note")
        .eq("id", Number(appointmentId))
        .single();
      
      appointment = data;
      appointmentError = error;
    }

    // Si no se encontró por ID, buscar por buy_order en el campo note
    if ((appointmentError || !appointment) && buy_order) {
      console.log("No se encontró por ID, buscando por buy_order en note...");
      const { data, error } = await supabase
        .from("appointments")
        .select("id, patient_id, professional_id, note")
        .like("note", `%buy_order:${buy_order}%`)
        .single();
      
      if (data && !error) {
        appointment = data;
        appointmentError = null;
        appointmentId = String(appointment.id);
        console.log("Cita encontrada por buy_order:", appointment);
      } else {
        appointmentError = error;
      }
    }

    if (appointmentError || !appointment) {
      console.error("Error obteniendo cita:", {
        appointmentError,
        buy_order,
        appointmentId,
        appointment,
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=appointment_not_found&buyOrder=${encodeURIComponent(buy_order || "")}`
      );
    }

    // Asegurar que tenemos el appointmentId correcto
    if (!appointmentId) {
      appointmentId = String(appointment.id);
    }

    // Registrar el pago en la base de datos
    // Usar el cliente admin para evitar problemas de RLS
    const adminSupabase = createAdminServer();
    
    const paymentRecord = {
      appointment_id: String(appointmentId),
      patient_id: appointment.patient_id,
      professional_id: appointment.professional_id,
      provider: "webpay_plus",
      provider_payment_id: authorization_code || tokenWs,
      provider_payment_status: "succeeded",
      amount: amount || 0,
      currency: "CLP",
      receipt_url: null, // Webpay no proporciona URL de recibo directamente en testing
      // En producción, Transbank genera vouchers que tienen validez como boleta electrónica
      raw_response: {
        buy_order,
        authorization_code,
        transaction_date,
        card_number: card_detail?.card_number || null,
        response_code: response.response_code,
        vci: response.vci,
        details: details || [],
      },
      metadata: {
        source: "webpay_plus",
        token: tokenWs,
        environment: isProduction ? "production" : "integration",
      },
    };

    const { error: paymentError } = await adminSupabase
      .from("payments")
      .insert(paymentRecord)
      .select("id, appointment_id")
      .single();

    if (paymentError) {
      console.error("Error registrando pago:", paymentError);
      // Aunque falle el registro, la transacción fue exitosa en Webpay
      // Redirigir con advertencia
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/success?appointmentId=${appointmentId}&payment=registered_manually`
      );
    }

    // Actualizar estado de pago de la cita
    // Usar el cliente admin para evitar problemas de RLS
    const { error: updateError } = await adminSupabase
      .from("appointments")
      .update({ payment_status: "succeeded" })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error actualizando estado de cita:", updateError);
    }

    // Enviar emails de confirmación
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/appointments/send-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ appointmentId: String(appointmentId) }),
      });
    } catch (emailError) {
      console.error("Error enviando emails de confirmación:", emailError);
      // No bloquear el flujo si falla el envío de emails
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/success?appointmentId=${appointmentId}&requiresConfirmation=false&payment=success`
    );
  } catch (error: unknown) {
    console.error("Error confirmando transacción de Webpay:", error);
    
    // Intentar extraer información útil del error
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    const errorParams = new URLSearchParams({
      reason: "error",
      message: errorMessage,
    });
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?${errorParams.toString()}`
    );
  }
}

