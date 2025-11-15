import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { validateAuth } from "@/utils/supabase/auth-validation";

/**
 * API Route para crear una transacción de Webpay Plus para pago de plan mensual
 * POST /api/payments/webpay/create-plan
 * 
 * Usa validación de seguridad para asegurar que las cookies coincidan con el header
 * y rechaza peticiones con cookies desactualizadas sin header confiable
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount } = body;

    // Validar datos requeridos
    if (!amount) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: amount",
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

    // Validar autenticación usando la función de validación centralizada
    console.log("🔍 [create-plan] Validando autenticación...");
    const authValidation = await validateAuth(request);

    if (!authValidation.isValid) {
      console.error("❌ [create-plan] Validación de autenticación fallida:", authValidation.error);
      
      // Si hay desajuste crítico, cerrar sesión automáticamente
      if (authValidation.sessionMismatch) {
        console.error("🚨 [create-plan] Desajuste crítico detectado - cerrando sesión automáticamente");
        const supabase = await createClient(request);
        await supabase.auth.signOut();
        
        // Limpiar cookies en la respuesta
        const errorResponse = NextResponse.json(
          { 
            error: authValidation.error || "Sesión desactualizada",
            needsReauth: true,
            sessionMismatch: true,
          },
          { status: 401 }
        );
        
        // Limpiar cookies de Supabase
        const allCookies = request.cookies.getAll();
        allCookies.forEach(cookie => {
          if (cookie.name.includes('supabase') || cookie.name.includes('sb-') || cookie.name.includes('auth-token')) {
            errorResponse.cookies.delete(cookie.name);
            errorResponse.cookies.set(cookie.name, '', {
              expires: new Date(0),
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          }
        });
        
        return errorResponse;
      }
      
      return NextResponse.json(
        { 
          error: authValidation.error || "No autenticado",
          needsReauth: authValidation.needsReauth 
        },
        { status: authValidation.needsReauth ? 401 : 403 }
      );
    }

    const professionalIdNum = Number(authValidation.userRecordId);
    
    console.log("✅ [create-plan] Autenticación validada:", {
      userRecordId: professionalIdNum,
      userId: authValidation.userId,
    });

    // Verificar que el profesional existe y pertenece al usuario autenticado
    const adminSupabase = createAdminServer();

    // Verificar si el profesional existe, si no, crearlo
    let professional = null;
    const { data: existingProfessional, error: profError } = await adminSupabase
      .from("professionals")
      .select("id, plan_type")
      .eq("id", professionalIdNum)
      .maybeSingle();

    if (profError && profError.code !== 'PGRST116') {
      console.error("Error verificando profesional:", profError);
      return NextResponse.json(
        { error: "Error al verificar el profesional" },
        { status: 500 }
      );
    }

    // Si el profesional no existe, crearlo
    if (!existingProfessional) {
      const { data: newProfessional, error: createError } = await adminSupabase
        .from("professionals")
        .insert({
          id: professionalIdNum,
          plan_type: "monthly", // Ya que estamos creando para un pago mensual
          is_active: false,
          last_monthly_payment_date: null,
          monthly_plan_expires_at: null,
        })
        .select("id, plan_type")
        .single();

      if (createError || !newProfessional) {
        console.error("Error creando registro de profesional:", createError);
        return NextResponse.json(
          { error: "Error al crear el registro del profesional" },
          { status: 500 }
        );
      }
      
      professional = newProfessional;
    } else {
      professional = existingProfessional;
    }

    // Verificar que el profesional tiene plan mensual o está seleccionando el plan mensual
    // Permitir si plan_type es null (seleccionando plan) o "monthly" (renovando)
    if (professional.plan_type && professional.plan_type !== "monthly") {
      return NextResponse.json(
        { error: "Solo los profesionales con plan mensual pueden realizar pagos mensuales" },
        { status: 400 }
      );
    }

    // Obtener credenciales de variables de entorno
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;
    const apiKey = process.env.TRANSBANK_API_KEY;
    const transbankEnvironment = process.env.TRANSBANK_ENVIRONMENT?.toUpperCase() || "TEST";
    const isProduction = transbankEnvironment === "PROD";

    if (!commerceCode || !apiKey) {
      console.error("Credenciales de Transbank no configuradas");
      return NextResponse.json(
        { error: "Configuración de pago no disponible" },
        { status: 500 }
      );
    }

    // Importar dinámicamente el SDK de Transbank (solo en el servidor)
    const { WebpayPlus, Options, Environment } = await import("transbank-sdk");

    // Configurar ambiente según TRANSBANK_ENVIRONMENT (PROD o TEST)
    const environment = isProduction
      ? Environment.Production
      : Environment.Integration;

    // Crear opciones de configuración
    const options = new Options(commerceCode, apiKey, environment);

    // Crear instancia de transacción
    const transaction = new WebpayPlus.Transaction(options);

    // Generar buy_order único (formato: plan{professionalId}{timestamp})
    // Limitar a 26 caracteres según Transbank
    const timestamp = Date.now().toString();
    const buyOrderPrefix = "plan";
    const maxIdLength = 26 - buyOrderPrefix.length;
    const professionalIdStr = String(professionalIdNum);
    const truncatedId = professionalIdStr.length > maxIdLength 
      ? professionalIdStr.slice(-maxIdLength) 
      : professionalIdStr;
    const buyOrder = `${buyOrderPrefix}${truncatedId}${timestamp.slice(-(26 - buyOrderPrefix.length - truncatedId.length))}`;

    // Generar session_id único (máximo 61 caracteres según Transbank)
    const sessionId = authValidation.userId || `s${Date.now()}`;

    // URL de retorno después del pago
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/webpay/confirm-plan`;

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

    // Crear registro inicial del pago en estado "pending"
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 30 días desde ahora

    const { error: paymentError } = await adminSupabase
      .from("monthly_subscription_payments")
      .insert({
        professional_id: professionalIdNum,
        amount: amountNumber,
        currency: "CLP",
        provider: "webpay_plus",
        provider_payment_status: "pending",
        buy_order: buyOrder,
        expires_at: expiresAt.toISOString(),
        metadata: {
          source: "webpay_plus",
          token: response.token,
          environment: isProduction ? "production" : "integration",
          session_id: sessionId,
        },
      });

    if (paymentError) {
      console.error("Error guardando registro de pago:", paymentError);
      // No bloquear el flujo, pero registrar el error
      console.warn("ADVERTENCIA: No se pudo guardar el registro inicial del pago.");
    }

    // Retornar token y URL para redirección
    return NextResponse.json({
      success: true,
      token: response.token,
      url: response.url,
      professionalId: professionalIdNum,
      buyOrder,
    });
  } catch (error) {
    console.error("Error creando transacción de Webpay para plan:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud de pago",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

