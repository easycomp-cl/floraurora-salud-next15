import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getTransbankConfig } from "@/lib/config";
import { createMeetLink } from "@/lib/services/googleMeetService";
import { BHEService } from "@/lib/services/bheService";

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
    console.log("🔄 [Webpay Confirm] Iniciando confirmación de transacción");
    console.log("📥 [Webpay Confirm] Método:", method);
    console.log("📥 [Webpay Confirm] URL completa:", request.url);
    
    let tokenWs: string | null = null;
    let tokenTbk: string | null = null;

    if (method === "GET") {
      // Obtener el token de la URL (query parameters)
      const searchParams = request.nextUrl.searchParams;
      tokenWs = searchParams.get("token_ws");
      tokenTbk = searchParams.get("TBK_TOKEN");
      console.log("📥 [Webpay Confirm] GET - token_ws:", tokenWs ? "presente" : "ausente");
      console.log("📥 [Webpay Confirm] GET - TBK_TOKEN:", tokenTbk ? "presente" : "ausente");
      console.log("📥 [Webpay Confirm] GET - Todos los parámetros:", Object.fromEntries(searchParams.entries()));
    } else {
      // Obtener el token del body (formData)
      const formData = await request.formData();
      tokenWs = formData.get("token_ws") as string | null;
      tokenTbk = formData.get("TBK_TOKEN") as string | null;
      console.log("📥 [Webpay Confirm] POST - token_ws:", tokenWs ? "presente" : "ausente");
      console.log("📥 [Webpay Confirm] POST - TBK_TOKEN:", tokenTbk ? "presente" : "ausente");
      console.log("📥 [Webpay Confirm] POST - Todos los campos:", Array.from(formData.entries()).map(([key]) => key));
    }

    // Si hay token de cancelación, redirigir y limpiar datos temporales
    if (tokenTbk) {
      console.log("❌ [Webpay Confirm] Transacción cancelada por el usuario");
      
      // Intentar obtener el buy_order de los parámetros para limpiar datos temporales
      // Transbank envía el buy_order en TBK_ORDEN_COMPRA cuando se cancela
      let buyOrderToClean = null;
      if (method === "GET") {
        const searchParams = request.nextUrl.searchParams;
        // Transbank envía el buy_order como TBK_ORDEN_COMPRA
        buyOrderToClean = searchParams.get("TBK_ORDEN_COMPRA") || searchParams.get("buy_order");
        console.log("🔍 [Webpay Confirm] Buy_order extraído de TBK_ORDEN_COMPRA:", buyOrderToClean);
      } else {
        try {
          const formData = await request.formData();
          buyOrderToClean = formData.get("TBK_ORDEN_COMPRA") as string | null || formData.get("buy_order") as string | null;
          console.log("🔍 [Webpay Confirm] Buy_order extraído de formData:", buyOrderToClean);
        } catch {
          // Ignorar errores al obtener formData
        }
      }
      
      // Limpiar datos temporales si existen (no crítico si falla)
      if (buyOrderToClean) {
        try {
          const adminSupabase = createAdminServer();
          const { error: deleteError } = await adminSupabase
            .from("pending_appointments")
            .delete()
            .eq("buy_order", buyOrderToClean);
          
          if (deleteError) {
            console.warn("⚠️ [Webpay Confirm] Error eliminando datos temporales:", deleteError);
          } else {
            console.log("✅ [Webpay Confirm] Datos temporales eliminados por cancelación, buy_order:", buyOrderToClean);
          }
        } catch (error) {
          console.warn("⚠️ [Webpay Confirm] Error limpiando datos temporales (no crítico):", error);
        }
      } else {
        console.warn("⚠️ [Webpay Confirm] No se pudo obtener el buy_order para limpiar datos temporales");
      }
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=cancelled`
      );
    }

    if (!tokenWs) {
      console.error("❌ [Webpay Confirm] Token no proporcionado");
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }
    
    console.log("✅ [Webpay Confirm] Token recibido:", tokenWs.substring(0, 20) + "...");

    // Obtener configuración de Transbank usando función helper
    const transbankConfig = getTransbankConfig();
    const { commerceCode, apiKey, isProduction, environment, detectedBy } = transbankConfig;

    if (!commerceCode || !apiKey) {
      console.error("❌ [Webpay Confirm] Credenciales de Transbank no configuradas");
      return NextResponse.json(
        { error: "Configuración de pago no disponible" },
        { status: 500 }
      );
    }

    // Validar formato de credenciales (sin espacios al inicio/final)
    const commerceCodeTrimmed = commerceCode.trim();
    const apiKeyTrimmed = apiKey.trim();

    console.log("🔐 [Webpay Confirm] Configuración de Transbank:", {
      hasCommerceCode: !!commerceCodeTrimmed,
      hasApiKey: !!apiKeyTrimmed,
      commerceCodeLength: commerceCodeTrimmed.length,
      apiKeyLength: apiKeyTrimmed.length,
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

    const options = new Options(commerceCodeTrimmed, apiKeyTrimmed, transbankEnvironment);
    const transaction = new WebpayPlus.Transaction(options);

    // Confirmar la transacción con Webpay
    console.log("🔄 [Webpay Confirm] Confirmando transacción con Transbank...");
    let response;
    try {
      response = await transaction.commit(tokenWs);
      console.log("✅ [Webpay Confirm] Respuesta de Transbank:", {
        response_code: response?.response_code,
        status: response?.status,
        buy_order: response?.buy_order,
        amount: response?.amount,
        authorization_code: response?.authorization_code ? "presente" : "ausente",
      });
    } catch (error: unknown) {
      console.error("❌ [Webpay Confirm] Error confirmando transacción de Webpay:", {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Manejar casos específicos de errores
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObj = error as { message?: string; buy_order?: string };
      
      // Intentar obtener el buy_order para limpiar datos temporales
      let buyOrderToClean = errorObj?.buy_order || null;
      if (!buyOrderToClean && method === "GET") {
        const searchParams = request.nextUrl.searchParams;
        buyOrderToClean = searchParams.get("buy_order");
      }
      
      // Limpiar datos temporales si hay error (no crítico si falla)
      if (buyOrderToClean) {
        try {
          const adminSupabase = createAdminServer();
          await adminSupabase
            .from("pending_appointments")
            .delete()
            .eq("buy_order", buyOrderToClean);
          console.log("🗑️ [Webpay Confirm] Datos temporales eliminados por error");
        } catch (cleanError) {
          console.warn("⚠️ [Webpay Confirm] Error limpiando datos temporales (no crítico):", cleanError);
        }
      }
      
      if (errorMessage?.includes("aborted") || errorMessage?.includes("invalid finished state")) {
        // La transacción ya fue abortada o tiene un estado inválido
        // Intentar obtener información del buy_order si está disponible en el error
        const buyOrderFromError = buyOrderToClean;
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
      console.error("❌ [Webpay Confirm] Transacción rechazada:", response);
      const buyOrder = response.buy_order || "";
      
      // Limpiar datos temporales si el pago fue rechazado
      if (buyOrder) {
        try {
          const adminSupabase = createAdminServer();
          await adminSupabase
            .from("pending_appointments")
            .delete()
            .eq("buy_order", buyOrder);
          console.log("🗑️ [Webpay Confirm] Datos temporales eliminados por pago rechazado");
        } catch (error) {
          console.warn("⚠️ [Webpay Confirm] Error limpiando datos temporales (no crítico):", error);
        }
      }
      
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

    console.log("📋 [Webpay Confirm] Buy_order recibido:", buy_order);

    // Usar cliente admin para evitar problemas de RLS cuando Webpay redirige
    // El usuario puede no estar autenticado en este punto
    const adminSupabase = createAdminServer();

    let appointment = null;
    let appointmentError = null;
    let appointmentId = null;
    let appointmentData = null;

    // NUEVO FLUJO: Buscar datos temporales de la cita primero
    if (buy_order) {
      console.log("🔍 [Webpay Confirm] Buscando datos temporales de cita para buy_order:", buy_order);
      try {
        const { data: pendingData, error: pendingError } = await adminSupabase
          .from("pending_appointments")
          .select("appointment_data")
          .eq("buy_order", buy_order)
          .single();

        if (pendingData && !pendingError && pendingData.appointment_data) {
          appointmentData = pendingData.appointment_data;
          console.log("✅ [Webpay Confirm] Datos temporales encontrados, creando cita...");
          
          // Crear la cita ahora que el pago fue exitoso
          const { DateTime } = await import("luxon");
          const scheduledAt = DateTime.fromISO(
            `${appointmentData.date}T${appointmentData.time}`,
            { zone: 'America/Santiago' }
          ).toUTC();

          if (!scheduledAt.isValid) {
            throw new Error('Fecha u hora inválida para la zona horaria de Chile');
          }

          const requiresConfirmation = Boolean(appointmentData.requires_confirmation);
          
          const appointmentRecord = {
            patient_id: appointmentData.patient_id,
            professional_id: appointmentData.professional_id,
            scheduled_at: scheduledAt.toISO(),
            duration_minutes: appointmentData.duration_minutes ?? 55,
            status: requiresConfirmation ? 'pending_confirmation' : 'confirmed',
            payment_status: 'succeeded', // Ya pagado
            note: `buy_order:${buy_order}`,
            area: appointmentData.area || 'Psicología',
            service: appointmentData.service_name || 'Consulta Individual'
          };

          console.log("📝 [Webpay Confirm] Creando cita con datos:", appointmentRecord);

          const { data: newAppointment, error: createError } = await adminSupabase
            .from("appointments")
            .insert(appointmentRecord)
            .select("id, patient_id, professional_id, note")
            .single();

          if (createError || !newAppointment) {
            console.error("❌ [Webpay Confirm] Error creando cita:", createError);
            throw new Error(`Error al crear la cita: ${createError?.message || "Error desconocido"}`);
          }

          appointment = newAppointment;
          appointmentId = String(newAppointment.id);
          console.log("✅ [Webpay Confirm] Cita creada exitosamente:", appointmentId);

          // Crear automáticamente registro de ingreso si es la primera cita del paciente con este profesional
          if (newAppointment.patient_id && newAppointment.professional_id) {
            try {
              // Verificar si ya existe un registro de ingreso
              const { data: existingIntake } = await adminSupabase
                .from("patient_intake_records")
                .select("id")
                .eq("patient_id", newAppointment.patient_id)
                .eq("professional_id", newAppointment.professional_id)
                .single();

              if (!existingIntake) {
                // Crear registro vacío de ingreso
                await adminSupabase
                  .from("patient_intake_records")
                  .insert({
                    patient_id: newAppointment.patient_id,
                    professional_id: newAppointment.professional_id,
                  });
                console.log("✅ [Webpay Confirm] Registro de ingreso creado automáticamente");
              }
            } catch (intakeError) {
              // No fallar la creación de la cita si falla la creación del registro de ingreso
              console.error("⚠️ [Webpay Confirm] Error creando registro de ingreso automático:", intakeError);
            }
          }

          // Crear enlace de Google Meet para la cita
          try {
            // Obtener datos del profesional y paciente para crear el enlace de Meet
            const [professionalResult, patientResult, appointmentDetails] = await Promise.all([
              newAppointment.professional_id
                ? adminSupabase
                    .from("users")
                    .select("id, name, last_name, email")
                    .eq("id", newAppointment.professional_id)
                    .single()
                : Promise.resolve({ data: null, error: null }),
              newAppointment.patient_id
                ? adminSupabase
                    .from("users")
                    .select("id, name, last_name, email")
                    .eq("id", newAppointment.patient_id)
                    .single()
                : Promise.resolve({ data: null, error: null }),
              adminSupabase
                .from("appointments")
                .select("scheduled_at, duration_minutes, service")
                .eq("id", newAppointment.id)
                .single(),
            ]);

            const professional = professionalResult.data;
            const patient = patientResult.data;
            const appointmentData = appointmentDetails.data;

            if (
              professional?.email &&
              patient &&
              appointmentData?.scheduled_at &&
              appointmentData.duration_minutes
            ) {
              const professionalName = `${professional.name || ""} ${professional.last_name || ""}`.trim() || "Profesional";
              const patientName = `${patient.name || ""} ${patient.last_name || ""}`.trim() || "Paciente";
              const scheduledAt = new Date(appointmentData.scheduled_at);

              console.log("🔗 [Webpay Confirm] Creando enlace de Google Meet...");

              const meetResult = await createMeetLink({
                appointmentId: String(newAppointment.id),
                professionalEmail: professional.email,
                professionalName,
                patientEmail: patient.email, // Agregar email del paciente para invitarlo al evento
                patientName,
                scheduledAt,
                durationMinutes: appointmentData.duration_minutes,
                serviceName: appointmentData.service || undefined,
              });

              // Actualizar la cita con el enlace de Meet
              await adminSupabase
                .from("appointments")
                .update({
                  meet_link: meetResult.meetLink,
                  meet_event_id: meetResult.eventId,
                })
                .eq("id", newAppointment.id);

              console.log("✅ [Webpay Confirm] Enlace de Google Meet creado y guardado");
            } else {
              console.warn(
                "⚠️ [Webpay Confirm] No se pudo crear enlace de Meet: faltan datos del profesional, paciente o cita"
              );
            }
          } catch (meetError) {
            // No bloquear el flujo si falla la creación del enlace de Meet
            console.error("❌ [Webpay Confirm] Error creando enlace de Google Meet:", meetError);
            console.log("ℹ️ [Webpay Confirm] Continuando sin enlace de Meet (se puede crear manualmente después)");
          }

          // Eliminar el registro temporal
          await adminSupabase
            .from("pending_appointments")
            .delete()
            .eq("buy_order", buy_order);
          console.log("🗑️ [Webpay Confirm] Registro temporal eliminado");
        } else {
          console.log("ℹ️ [Webpay Confirm] No se encontraron datos temporales, buscando cita existente...");
        }
      } catch (tempError) {
        console.warn("⚠️ [Webpay Confirm] Error buscando datos temporales (puede no existir la tabla):", tempError);
        // Continuar con el flujo antiguo
      }
    }

    // FLUJO ANTIGUO: Buscar cita existente si no se creó en el nuevo flujo
    if (!appointment) {
      // Obtener appointmentId del buy_order (formato: apt{id})
      const buyOrderMatch = buy_order?.match(/^apt(\d+)$/);
      const appointmentIdFromBuyOrder = buyOrderMatch ? buyOrderMatch[1] : null;

      console.log("🔍 [Webpay Confirm] AppointmentId extraído del buy_order:", appointmentIdFromBuyOrder);

      // Primero buscar por buy_order en el campo note (más confiable)
      if (buy_order) {
        console.log("🔍 [Webpay Confirm] Buscando cita por buy_order en note...");
        const { data, error } = await adminSupabase
          .from("appointments")
          .select("id, patient_id, professional_id, note")
          .like("note", `%buy_order:${buy_order}%`)
          .single();
        
        if (data && !error) {
          appointment = data;
          appointmentError = null;
          appointmentId = String(appointment.id);
          console.log("✅ [Webpay Confirm] Cita encontrada por buy_order:", appointmentId);
        } else {
          console.log("ℹ️ [Webpay Confirm] No se encontró por buy_order, error:", error);
          appointmentError = error;
        }
      }

      // Si no se encontró por buy_order, intentar buscar por ID numérico
      if ((appointmentError || !appointment) && appointmentIdFromBuyOrder) {
        console.log("🔍 [Webpay Confirm] Buscando cita por ID numérico extraído del buy_order...");
        const { data, error } = await adminSupabase
          .from("appointments")
          .select("id, patient_id, professional_id, note")
          .eq("id", Number(appointmentIdFromBuyOrder))
          .single();
        
        if (data && !error) {
          appointment = data;
          appointmentError = null;
          appointmentId = String(appointment.id);
          console.log("✅ [Webpay Confirm] Cita encontrada por ID numérico:", appointmentId);
        } else {
          console.log("❌ [Webpay Confirm] No se encontró por ID numérico, error:", error);
          appointmentError = error;
        }
      }

      if (appointmentError || !appointment) {
        console.error("❌ [Webpay Confirm] Error obteniendo cita:", {
          appointmentError,
          buy_order,
          appointmentId,
          appointment,
        });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=appointment_not_found&buyOrder=${encodeURIComponent(buy_order || "")}&appointmentId=${encodeURIComponent(appointmentIdFromBuyOrder || "")}`
        );
      }

      // Asegurar que tenemos el appointmentId correcto
      if (!appointmentId) {
        appointmentId = String(appointment.id);
      }
    }

    // Verificar que tenemos un appointmentId válido
    if (!appointmentId) {
      console.error("❌ [Webpay Confirm] No se pudo obtener el appointmentId");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/payment-error?reason=appointment_not_found&buyOrder=${encodeURIComponent(buy_order || "")}`
      );
    }

    // Extraer el número del appointment_id para buscar en diferentes formatos
    const appointmentIdNum = String(appointmentId).replace(/\D/g, '');
    // Formatear appointment_id en formato consistente (APT-00000056)
    const appointmentIdFormatted = appointmentId.startsWith('APT-') 
      ? appointmentId 
      : `APT-${appointmentIdNum.padStart(8, '0')}`;
    const appointmentIdFormats = [
      appointmentId, // Formato original
      appointmentIdNum, // Solo números
      `APT-${appointmentIdNum.padStart(8, '0')}`, // APT-00000056
      `apt${appointmentIdNum.padStart(8, '0')}`, // apt00000056
    ];

    // Verificar si el pago ya existe antes de insertar (buscar en diferentes formatos)
    let existingPayment = null;

    // Intentar buscar con cada formato
    for (const format of appointmentIdFormats) {
      const { data } = await adminSupabase
        .from("payments")
        .select("id, appointment_id, provider_payment_status, provider_payment_id")
        .eq("appointment_id", format)
        .eq("provider", "webpay_plus")
        .limit(1);

      if (data && data.length > 0) {
        existingPayment = data[0];
        break;
      }
    }

    // También buscar por provider_payment_id usando tokenWs (único por transacción)
    // tokenWs es único, así que si encontramos un pago con el mismo tokenWs, es el mismo pago
    if (!existingPayment && tokenWs) {
      const { data: paymentByToken } = await adminSupabase
        .from("payments")
        .select("id, appointment_id, provider_payment_status, provider_payment_id")
        .eq("provider_payment_id", tokenWs)
        .eq("provider", "webpay_plus")
        .limit(1);

      if (paymentByToken && paymentByToken.length > 0) {
        existingPayment = paymentByToken[0];
      }
    }
    
    // También buscar por authorization_code como fallback (solo si no encontramos por tokenWs)
    // PERO solo si el appointment_id coincide (en testing, Transbank puede reutilizar códigos)
    if (!existingPayment && authorization_code) {
      const { data: paymentByAuthCode } = await adminSupabase
        .from("payments")
        .select("id, appointment_id, provider_payment_status, provider_payment_id")
        .eq("provider_payment_id", authorization_code)
        .eq("provider", "webpay_plus")
        .limit(10); // Obtener varios para verificar

      if (paymentByAuthCode && paymentByAuthCode.length > 0) {
        // Verificar si alguno de los pagos encontrados corresponde a esta cita
        const matchingPayment = paymentByAuthCode.find(p => {
          const paymentAppointmentId = String(p.appointment_id || "");
          const paymentIdNum = paymentAppointmentId.replace(/\D/g, '');
          const currentIdNum = appointmentIdNum;
          
          return paymentAppointmentId === appointmentId || 
                 paymentIdNum === currentIdNum ||
                 paymentAppointmentId === `APT-${currentIdNum.padStart(8, '0')}` ||
                 paymentAppointmentId === `apt${currentIdNum.padStart(8, '0')}`;
        });
        
        if (matchingPayment) {
          existingPayment = matchingPayment;
        }
        // Si no coincide, no establecer existingPayment, permitir que se inserte el nuevo pago con tokenWs
      }
    }

    if (existingPayment) {
      // El pago ya está registrado, continuar con el flujo normalmente
    } else {
      // Registrar el pago en la base de datos
      // Reutilizar el cliente admin ya creado arriba
      // appointmentIdFormatted ya está definido arriba
      
      // IMPORTANTE: La restricción única es (provider, provider_payment_id)
      // En testing, Transbank reutiliza authorization_code, pero tokenWs es único por transacción
      // Usar tokenWs como provider_payment_id para evitar conflictos de restricción única
      // El authorization_code se guarda en raw_response para referencia
      const providerPaymentId = tokenWs || authorization_code;
      
      const paymentRecord = {
        appointment_id: appointmentIdFormatted, // Usar formato consistente
        patient_id: appointment.patient_id,
        professional_id: appointment.professional_id,
        provider: "webpay_plus",
        provider_payment_id: providerPaymentId, // Usar tokenWs (único) en lugar de authorization_code (puede repetirse)
        provider_payment_status: "succeeded",
        amount: amount || 0,
        currency: "CLP",
        receipt_url: null, // Webpay no proporciona URL de recibo directamente en testing
        // En producción, Transbank genera vouchers que tienen validez como boleta electrónica
        raw_response: {
          buy_order,
          authorization_code, // Guardar authorization_code aquí para referencia
          transaction_date,
          card_number: card_detail?.card_number || null,
          response_code: response.response_code,
          vci: response.vci,
          details: details || [],
          token_ws: tokenWs, // También guardar tokenWs en raw_response
        },
        metadata: {
          source: "webpay_plus",
          token: tokenWs,
          authorization_code: authorization_code, // Guardar también en metadata
          environment: environment,
        },
      };

      const { error: paymentError } = await adminSupabase
        .from("payments")
        .insert(paymentRecord)
        .select("id, appointment_id, amount, created_at")
        .single();

      if (paymentError) {
        // Si es error de clave duplicada, el pago ya existe, continuar normalmente
        if (paymentError.code === '23505') {
          // Error de clave duplicada - el pago ya existe, continuar normalmente
        } else {
          console.error("❌ Error registrando pago:", {
            code: paymentError.code,
            message: paymentError.message,
            details: paymentError.details,
            hint: paymentError.hint,
            paymentRecord: {
              appointment_id: paymentRecord.appointment_id,
              provider_payment_id: paymentRecord.provider_payment_id,
              amount: paymentRecord.amount
            }
          });
          // Aunque falle el registro, la transacción fue exitosa en Webpay
          // Redirigir con advertencia
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/success?appointmentId=${encodeURIComponent(appointmentId)}&payment=registered_manually`
          );
        }
      }
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

    // Encolar job de BHE para emisión de boleta electrónica
    // Solo crear el job si la variable de entorno CREATE_JOBS_RPA_SII está en true
    const shouldCreateBHEJob = process.env.CREATE_JOBS_RPA_SII === "true";
    
    if (shouldCreateBHEJob) {
      try {
        // Solo crear BHE job si el profesional está verificado en SII
        if (appointment.professional_id) {
          const { data: professionalData } = await adminSupabase
            .from("professionals")
            .select("sii_bhe_verified")
            .eq("id", appointment.professional_id)
            .single();

          if (!professionalData?.sii_bhe_verified) {
            console.log(
              "⏭️ [Webpay Confirm] Profesional no verificado en SII para emisión BHE. Job no creado."
            );
          } else {
        /**
         * Función helper para convertir región/comuna a ID numérico
         * Maneja el caso donde en la tabla users se guardaron nombres en lugar de IDs
         */
        const normalizeRegionOrComunaId = async (
          value: unknown,
          type: "region" | "municipality",
          userId: number,
          userType: "professional" | "patient"
        ): Promise<number | null> => {
          // Si es null o undefined, retornar null
          if (value === null || value === undefined) {
            return null;
          }

          // Si ya es un número válido, retornarlo directamente
          if (typeof value === "number" && !isNaN(value) && value > 0) {
            return value;
          }

          // Si es string, puede ser un nombre o un número como string
          if (typeof value === "string") {
            // Intentar convertir a número primero
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue) && numValue > 0) {
              return numValue;
            }

            // Si no es un número, buscar el ID por nombre
            console.warn(
              `⚠️ [Webpay Confirm] ${userType} (user_id: ${userId}) tiene ${type} como nombre ("${value}") en lugar de ID. Buscando ID correspondiente...`
            );

            try {
              if (type === "region") {
                const { data: regionData } = await adminSupabase
                  .from("regions")
                  .select("id")
                  .ilike("name", value.trim())
                  .single();

                if (regionData?.id) {
                  console.log(
                    `✅ [Webpay Confirm] Región "${value}" convertida a ID: ${regionData.id}`
                  );
                  return regionData.id;
                } else {
                  console.error(
                    `❌ [Webpay Confirm] No se encontró región con nombre "${value}"`
                  );
                  return null;
                }
              } else {
                // municipality
                const { data: municipalityData } = await adminSupabase
                  .from("municipalities")
                  .select("id")
                  .ilike("name", value.trim())
                  .single();

                if (municipalityData?.id) {
                  console.log(
                    `✅ [Webpay Confirm] Comuna "${value}" convertida a ID: ${municipalityData.id}`
                  );
                  return municipalityData.id;
                } else {
                  console.error(
                    `❌ [Webpay Confirm] No se encontró comuna con nombre "${value}"`
                  );
                  return null;
                }
              }
            } catch (searchError) {
              console.error(
                `❌ [Webpay Confirm] Error buscando ${type} "${value}":`,
                searchError
              );
              return null;
            }
          }

          // Si no es ni número ni string válido, retornar null
          console.warn(
            `⚠️ [Webpay Confirm] ${userType} (user_id: ${userId}) tiene ${type} con tipo inválido: ${typeof value}, valor: ${value}`
          );
          return null;
        };

        // Obtener datos completos del profesional
        let professionalRut: string | null = null;
        let professionalAddress: string | null = null;
        let professionalRegion: number | null = null;
        let professionalComuna: number | null = null;
        
        if (appointment.professional_id) {
          // Obtener datos del usuario profesional
          const { data: professionalUserData } = await adminSupabase
            .from("users")
            .select("rut, address, region, municipality")
            .eq("id", appointment.professional_id)
            .single();
          
          professionalRut = professionalUserData?.rut || null;
          professionalAddress = professionalUserData?.address || null;
          
          // Normalizar región y comuna a IDs numéricos (maneja el caso donde se guardaron nombres)
          professionalRegion = await normalizeRegionOrComunaId(
            professionalUserData?.region,
            "region",
            appointment.professional_id,
            "professional"
          );
          
          professionalComuna = await normalizeRegionOrComunaId(
            professionalUserData?.municipality,
            "municipality",
            appointment.professional_id,
            "professional"
          );
        }

        // Obtener datos completos del paciente
        let patientRut: string | null = null;
        let patientNames: string | null = null;
        let patientAddress: string | null = null;
        let patientRegion: number | null = null;
        let patientComuna: number | null = null;
        let patientEmail: string | null = null;
        
        if (appointment.patient_id) {
          // Obtener datos del usuario paciente
          const { data: patientUserData } = await adminSupabase
            .from("users")
            .select("rut, name, last_name, email, address, region, municipality")
            .eq("id", appointment.patient_id)
            .single();
          
          patientRut = patientUserData?.rut || null;
          patientNames = patientUserData?.name && patientUserData?.last_name
            ? `${patientUserData.name} ${patientUserData.last_name}`
            : patientUserData?.name || null;
          patientAddress = patientUserData?.address || null;
          patientEmail = patientUserData?.email || null;
          
          // Normalizar región y comuna a IDs numéricos (maneja el caso donde se guardaron nombres)
          patientRegion = await normalizeRegionOrComunaId(
            patientUserData?.region,
            "region",
            appointment.patient_id,
            "patient"
          );
          
          patientComuna = await normalizeRegionOrComunaId(
            patientUserData?.municipality,
            "municipality",
            appointment.patient_id,
            "patient"
          );
        }

        // Obtener información completa de la cita
        const appointmentData = await adminSupabase
          .from("appointments")
          .select("service, area, note, scheduled_at")
          .eq("id", appointmentId)
          .single();

        const serviceName = appointmentData.data?.service || appointmentData.data?.area || "Consulta psicológica";
        const glosa = `Servicio de ${serviceName}`;
        
        // service_date: fecha de la cita (scheduled_at)
        // Nota: Si hay reagendamientos, se debería usar la primera fecha con pago exitoso
        // Por ahora usamos scheduled_at, pero esto podría requerir revisar historial de pagos
        const serviceDate = appointmentData.data?.scheduled_at
          ? new Date(appointmentData.data.scheduled_at).toISOString().split('T')[0]
          : null;
        
        // service_detail: es lo mismo que glosa (el servicio ofrecido)
        const serviceDetail = glosa;

        // Determinar payment_id único para idempotencia
        // Preferir buy_order, luego tokenWs/authorization_code, finalmente timestamp
        const uniquePaymentId = buy_order || tokenWs || authorization_code || `payment_${Date.now()}`;

        // Validación final: asegurar que region y comuna sean números válidos o undefined/null
        // Esto previene que se guarden strings o valores inválidos en la base de datos
        const validateRegionComuna = (
          value: number | null | undefined,
          fieldName: string,
          userType: string
        ): number | undefined => {
          if (value === null || value === undefined) {
            return undefined;
          }
          if (typeof value === "number" && !isNaN(value) && value > 0) {
            return value;
          }
          console.error(
            `❌ [Webpay Confirm] ${fieldName} de ${userType} tiene valor inválido: ${value} (tipo: ${typeof value}). Se omitirá.`
          );
          return undefined;
        };

        const validatedProfessionalRegion = validateRegionComuna(
          professionalRegion,
          "professional_region",
          "profesional"
        );
        const validatedProfessionalComuna = validateRegionComuna(
          professionalComuna,
          "professional_comuna",
          "profesional"
        );
        const validatedPatientRegion = validateRegionComuna(
          patientRegion,
          "patient_region",
          "paciente"
        );
        const validatedPatientComuna = validateRegionComuna(
          patientComuna,
          "patient_comuna",
          "paciente"
        );

        // Log de los valores que se van a guardar para debugging
        console.log("📋 [Webpay Confirm] Datos de región/comuna para BHE job:", {
          professional_region: validatedProfessionalRegion,
          professional_comuna: validatedProfessionalComuna,
          patient_region: validatedPatientRegion,
          patient_comuna: validatedPatientComuna,
        });

        // Encolar el job de BHE
        await BHEService.enqueueJob({
          payment_id: uniquePaymentId, // Usar buy_order como payment_id único para idempotencia
          appointment_id: appointmentIdFormatted,
          professional_id: appointment.professional_id!,
          patient_id: appointment.patient_id || undefined,
          patient_rut: patientRut || undefined,
          amount: amount || 0,
          glosa: glosa,
          issue_date: new Date().toISOString().split('T')[0],
          professional_rut: professionalRut || undefined,
          professional_address: professionalAddress || undefined,
          professional_region: validatedProfessionalRegion,
          professional_comuna: validatedProfessionalComuna,
          patient_names: patientNames || undefined,
          patient_address: patientAddress || undefined,
          patient_region: validatedPatientRegion,
          patient_comuna: validatedPatientComuna,
          patient_email: patientEmail || undefined,
          service_date: serviceDate || undefined,
          service_detail: serviceDetail || undefined,
          metadata: {
            buy_order,
            authorization_code,
            transaction_date,
            source: "webpay_plus",
          },
        });

        console.log("✅ [Webpay Confirm] Job de BHE encolado exitosamente");
          }
        }
      } catch (bheError) {
        // No bloquear el flujo si falla el encolado de BHE
        // El job puede ser creado manualmente después si es necesario
        console.error("⚠️ [Webpay Confirm] Error al encolar job de BHE (no crítico):", bheError);
      }
    } else {
      console.log("⏭️ [Webpay Confirm] Creación de job BHE omitida (CREATE_JOBS_RPA_SII=false)");
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
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/appointments/success?appointmentId=${encodeURIComponent(appointmentId)}&requiresConfirmation=false&payment=success`
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

