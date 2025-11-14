import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * API Route para crear una transacción de Webpay Plus
 * POST /api/payments/webpay/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, amount, buyOrder, sessionId } = body;

    // Validar datos requeridos
    if (!appointmentId || !amount || !buyOrder || !sessionId) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: appointmentId, amount, buyOrder, sessionId",
        },
        { status: 400 }
      );
    }

    // Validar que el monto sea un número positivo
    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser un número positivo" },
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

    // Configurar ambiente (integración o producción)
    const environment = isProduction
      ? Environment.Production
      : Environment.Integration;

    // Crear opciones de configuración
    const options = new Options(commerceCode, apiKey, environment);

    // Crear instancia de transacción
    const transaction = new WebpayPlus.Transaction(options);

    // URL de retorno después del pago
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/webpay/confirm`;

    // Crear la transacción en Webpay
    const response = await transaction.create(
      buyOrder,
      sessionId,
      amountNumber,
      returnUrl
    );

    // Validar respuesta
    if (!response.token || !response.url) {
      console.error("Respuesta inválida de Webpay:", response);
      return NextResponse.json(
        { error: "Error al crear la transacción en Webpay" },
        { status: 500 }
      );
    }

    // Guardar el buy_order en la cita para poder buscarlo después
    try {
      const supabase = await createClient();
      
      // Obtener la nota actual para no sobrescribirla
      const { data: currentAppointment } = await supabase
        .from("appointments")
        .select("note")
        .eq("id", appointmentId)
        .single();
      
      const currentNote = currentAppointment?.note || "";
      const buyOrderNote = `buy_order:${buyOrder}`;
      
      // Agregar el buy_order a la nota sin sobrescribir contenido existente
      const updatedNote = currentNote 
        ? `${currentNote}\n${buyOrderNote}`
        : buyOrderNote;
      
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ 
          note: updatedNote
        })
        .eq("id", appointmentId);

      if (updateError) {
        console.warn("No se pudo guardar el buy_order en la cita:", updateError);
        // No bloquear el flujo si falla esto
      } else {
        console.log("Buy_order guardado exitosamente:", buyOrder);
      }
    } catch (error) {
      console.warn("Error guardando buy_order:", error);
      // No bloquear el flujo
    }

    // Retornar token y URL para redirección
    return NextResponse.json({
      success: true,
      token: response.token,
      url: response.url,
      appointmentId,
      buyOrder, // También retornar el buyOrder para referencia
    });
  } catch (error) {
    console.error("Error creando transacción de Webpay:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud de pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

