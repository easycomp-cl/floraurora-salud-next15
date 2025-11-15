import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * API Route para crear una transacción de Webpay Plus
 * POST /api/payments/webpay/create
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentData, appointmentId, amount, buyOrder, sessionId } = body;

    // Validar datos requeridos
    // Aceptar tanto appointmentData (nuevo flujo) como appointmentId (compatibilidad)
    if ((!appointmentData && !appointmentId) || !amount || !buyOrder || !sessionId) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: appointmentData (o appointmentId), amount, buyOrder, sessionId",
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
    const transbankEnvironment = process.env.TRANSBANK_ENVIRONMENT?.toUpperCase() || "TEST";
    const isProduction = transbankEnvironment === "PROD";

    // Log de configuración (sin exponer valores completos)
    console.log("🔐 [Webpay Create] Configuración:", {
      hasCommerceCode: !!commerceCode,
      hasApiKey: !!apiKey,
      commerceCodeLength: commerceCode?.length || 0,
      apiKeyLength: apiKey?.length || 0,
      transbankEnvironment,
      isProduction,
      environment: isProduction ? "Production" : "Integration",
    });

    if (!commerceCode || !apiKey) {
      console.error("❌ [Webpay Create] Credenciales de Transbank no configuradas");
      return NextResponse.json(
        { 
          error: "Configuración de pago no disponible",
          details: "Las credenciales de Transbank no están configuradas. Por favor, verifica las variables de entorno TRANSBANK_COMMERCE_CODE y TRANSBANK_API_KEY."
        },
        { status: 500 }
      );
    }

    // Importar dinámicamente el SDK de Transbank (solo en el servidor)
    const { WebpayPlus, Options, Environment } = await import("transbank-sdk");

    // Configurar ambiente según TRANSBANK_ENVIRONMENT (PROD o TEST)
    const environment = isProduction
      ? Environment.Production
      : Environment.Integration;

    console.log("🔧 [Webpay Create] Creando transacción con:", {
      buyOrder,
      sessionId,
      amount: amountNumber,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/webpay/confirm`,
      environment: isProduction ? "Production" : "Integration",
    });

    // Crear opciones de configuración
    const options = new Options(commerceCode, apiKey, environment);

    // Crear instancia de transacción
    const transaction = new WebpayPlus.Transaction(options);

    // URL de retorno después del pago
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/webpay/confirm`;

    // Crear la transacción en Webpay
    let response;
    try {
      response = await transaction.create(
        buyOrder,
        sessionId,
        amountNumber,
        returnUrl
      );
      console.log("✅ [Webpay Create] Transacción creada exitosamente:", {
        hasToken: !!response.token,
        hasUrl: !!response.url,
      });
    } catch (createError) {
      console.error("❌ [Webpay Create] Error al crear transacción:", {
        error: createError instanceof Error ? createError.message : String(createError),
        errorName: createError instanceof Error ? createError.name : "Unknown",
        stack: createError instanceof Error ? createError.stack : undefined,
      });
      
      // Si es un error de autenticación, dar un mensaje más específico
      if (createError instanceof Error && createError.message.includes("401")) {
        return NextResponse.json(
          {
            error: "Error de autenticación con Transbank",
            details: "Las credenciales de Transbank no son válidas o el ambiente no coincide. Verifica que TRANSBANK_COMMERCE_CODE y TRANSBANK_API_KEY sean correctos para el ambiente de integración.",
          },
          { status: 401 }
        );
      }
      
      throw createError;
    }

    // Validar respuesta
    if (!response.token || !response.url) {
      console.error("Respuesta inválida de Webpay:", response);
      return NextResponse.json(
        { error: "Error al crear la transacción en Webpay" },
        { status: 500 }
      );
    }

    // Guardar los datos de la cita temporalmente si se enviaron (nuevo flujo)
    // Si se envió appointmentId, la cita ya existe (flujo antiguo - compatibilidad)
    if (appointmentData) {
      // En el nuevo flujo, guardamos los datos de la cita en una tabla temporal
      // para recuperarlos cuando el pago sea exitoso
      console.log("💾 [Webpay Create] Guardando datos de cita temporal para buy_order:", buyOrder);
      try {
        const adminSupabase = createAdminServer();
        
        // Crear registro temporal con los datos de la cita
        // Usaremos una tabla temporal o guardaremos en una tabla de "pending_appointments"
        // Por ahora, guardamos en una tabla temporal usando el buyOrder como clave
        const { error: tempError } = await adminSupabase
          .from("pending_appointments")
          .upsert({
            buy_order: buyOrder,
            appointment_data: appointmentData,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Expira en 30 minutos
          }, {
            onConflict: "buy_order"
          });

        if (tempError) {
          // Si la tabla no existe, solo loguear el error pero no bloquear
          console.warn("⚠️ [Webpay Create] No se pudo guardar en tabla temporal (puede no existir):", tempError.message);
          console.log("💾 [Webpay Create] Los datos se guardarán en el endpoint de confirmación usando el buyOrder");
        } else {
          console.log("✅ [Webpay Create] Datos de cita temporal guardados para buy_order:", buyOrder);
        }
      } catch (error) {
        console.warn("⚠️ [Webpay Create] Error guardando datos temporales (no crítico):", error);
        // No bloquear el flujo si falla guardar temporalmente
      }
    } else if (appointmentId) {
      // Flujo antiguo: la cita ya existe, guardar el buy_order en la nota
      try {
        const adminSupabase = createAdminServer();
        
        // Obtener la nota actual para no sobrescribirla
        const { data: currentAppointment, error: fetchError } = await adminSupabase
          .from("appointments")
          .select("id, note")
          .eq("id", appointmentId)
          .single();
        
        if (fetchError) {
          console.error("Error obteniendo cita para guardar buy_order:", fetchError);
          // Intentar buscar la cita de otra forma
          const { data: altAppointment } = await adminSupabase
            .from("appointments")
            .select("id, note")
            .eq("id", String(appointmentId))
            .single();
          
          if (!altAppointment) {
            throw new Error(`No se encontró la cita con ID ${appointmentId} para guardar el buy_order`);
          }
        }
        
        const currentNote = currentAppointment?.note || "";
        const buyOrderNote = `buy_order:${buyOrder}`;
        
        // Verificar si el buy_order ya está guardado
        if (currentNote.includes(`buy_order:${buyOrder}`)) {
          console.log("Buy_order ya está guardado en la cita:", buyOrder);
        } else {
          // Agregar el buy_order a la nota sin sobrescribir contenido existente
          const updatedNote = currentNote 
            ? `${currentNote}\n${buyOrderNote}`
            : buyOrderNote;
          
          const { error: updateError } = await adminSupabase
            .from("appointments")
            .update({ 
              note: updatedNote
            })
            .eq("id", appointmentId);

          if (updateError) {
            console.error("Error guardando buy_order en la cita:", updateError);
            console.warn("ADVERTENCIA: El buy_order no se pudo guardar. Se intentará buscar por ID después.");
          } else {
            console.log("Buy_order guardado exitosamente en la cita:", buyOrder);
          }
        }
      } catch (error) {
        console.error("Error crítico guardando buy_order:", error);
        console.warn("ADVERTENCIA: No se pudo guardar el buy_order. Se intentará buscar por ID después.");
      }
    }

    // Retornar token y URL para redirección
    return NextResponse.json({
      success: true,
      token: response.token,
      url: response.url,
      appointmentId: appointmentId || null, // Puede ser null si se usa el nuevo flujo
      appointmentData: appointmentData || null, // Datos de la cita si se usa el nuevo flujo
      buyOrder, // También retornar el buyOrder para referencia
    });
  } catch (error) {
    console.error("❌ [Webpay Create] Error general:", {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : "Unknown",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Detectar errores específicos de Transbank
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes("401") || errorMessage.includes("not authorized") || errorMessage.includes("unauthorized")) {
        return NextResponse.json(
          {
            error: "Error de autenticación con Transbank",
            details: "Las credenciales de Transbank no son válidas. Verifica que las variables de entorno TRANSBANK_COMMERCE_CODE y TRANSBANK_API_KEY sean correctas para el ambiente de integración. En desarrollo, usa las credenciales de prueba proporcionadas por Transbank.",
          },
          { status: 401 }
        );
      }
      
      if (errorMessage.includes("400") || errorMessage.includes("bad request")) {
        return NextResponse.json(
          {
            error: "Solicitud inválida a Transbank",
            details: error.message,
          },
          { status: 400 }
        );
      }
      
      // Detectar errores de TransbankError específicamente
      if (error.name === "TransbankError" || errorMessage.includes("transbank")) {
        return NextResponse.json(
          {
            error: "Error de Transbank",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud de pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

