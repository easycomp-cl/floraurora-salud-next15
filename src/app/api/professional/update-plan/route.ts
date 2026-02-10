import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { validateAuth } from "@/utils/supabase/auth-validation";

/**
 * API Route para actualizar el plan de un profesional
 * POST /api/professional/update-plan
 * 
 * Usa validación de seguridad para asegurar que las cookies coincidan con el header
 * y rechaza peticiones con cookies desactualizadas sin header confiable
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType } = body;

    // Validar datos requeridos
    if (!planType) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: planType",
        },
        { status: 400 }
      );
    }

    // Validar que el planType sea válido
    if (planType !== "commission" && planType !== "monthly") {
      return NextResponse.json(
        { error: "planType debe ser 'commission' o 'monthly'" },
        { status: 400 }
      );
    }

    // Validar autenticación usando la función de validación centralizada
    const authValidation = await validateAuth(request);

    if (!authValidation.isValid) {
      console.error("❌ [update-plan] Validación de autenticación fallida:", authValidation.error);
      
      // Si hay desajuste crítico, cerrar sesión automáticamente
      if (authValidation.sessionMismatch) {
        console.error("🚨 [update-plan] Desajuste crítico detectado - cerrando sesión automáticamente");
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

    // Verificar que el profesional existe y pertenece al usuario autenticado
    const adminSupabase = createAdminServer();

    // Verificar si el profesional existe, si no, crearlo
    const { data: existingProfessional, error: profError } = await adminSupabase
      .from("professionals")
      .select("id, plan_type")
      .eq("id", professionalIdNum)
      .maybeSingle();

    if (profError && profError.code !== 'PGRST116') { // PGRST116 es "no rows returned"
      console.error("Error verificando profesional:", profError);
      return NextResponse.json(
        { error: "Error al verificar el profesional" },
        { status: 500 }
      );
    }

    if (!existingProfessional) {
      // Crear el registro del profesional si no existe
      const { error: createError } = await adminSupabase
        .from("professionals")
        .insert({
          id: professionalIdNum,
          plan_type: null,
          is_active: false,
          last_monthly_payment_date: null,
          monthly_plan_expires_at: null,
        })
        .select("id, plan_type")
        .single();

      if (createError) {
        console.error("Error creando registro de profesional:", createError);
        return NextResponse.json(
          { error: "Error al crear el registro del profesional" },
          { status: 500 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      plan_type: planType,
      is_active: true, // Activar el profesional al asignar un plan
    };

    // Si el plan es "commission", no necesita fechas de pago
    // Si el plan es "monthly", las fechas se establecerán después del pago
    if (planType === "commission") {
      updateData.last_monthly_payment_date = null;
      updateData.monthly_plan_expires_at = null;
    }
    // Para monthly, no establecemos las fechas aquí, se establecerán después del pago

    // Actualizar el plan del profesional
    const { error: updateError } = await adminSupabase
      .from("professionals")
      .update(updateData)
      .eq("id", professionalIdNum);

    if (updateError) {
      console.error("Error actualizando plan del profesional:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Plan actualizado exitosamente",
      planType,
    });
  } catch (error) {
    console.error("Error actualizando plan:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

