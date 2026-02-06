import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/utils/supabase/auth-validation";
import {
  getPlanPricingConfig,
  getPremiumPlanPrice,
  getPremiumPlanPriceForNewProfessional,
} from "@/lib/services/planPricingService";

/**
 * API Route para obtener los precios de los planes
 * GET /api/plans/pricing
 */
export async function GET(request: NextRequest) {
  try {
    // Intentar validar autenticación, pero no requerirla estrictamente
    // Si hay autenticación, usar precio específico del usuario
    // Si no hay autenticación, usar precio para nuevo profesional
    const authValidation = await validateAuth(request);

    // Obtener configuración de precios (siempre desde BD)
    const config = await getPlanPricingConfig();

    let premiumPrice: number;
    let professionalIdNum: number | null = null;

    if (authValidation.isValid && authValidation.userRecordId) {
      // Usuario autenticado: usar precio específico según su historial de pagos
      professionalIdNum = Number(authValidation.userRecordId);
      if (!isNaN(professionalIdNum) && professionalIdNum > 0) {
        premiumPrice = await getPremiumPlanPrice(professionalIdNum);
      } else {
        premiumPrice = await getPremiumPlanPriceForNewProfessional();
      }
    } else {
      // Usuario no autenticado o autenticación fallida: usar precio para nuevo profesional
      premiumPrice = await getPremiumPlanPriceForNewProfessional();
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log("[pricing API] Usuario no autenticado o autenticación fallida, usando precio para nuevo profesional:", {
          error: authValidation.error,
          premiumPrice,
        });
      }
    }

    // Determinar si la promoción está activa en la BD
    // La promoción está activa si hay meses configurados Y el precio promocional es menor que el normal
    const isPromotionActive = config.premiumPromotionMonths > 0 && 
                              config.premiumPromotionPrice < config.premiumNormalPrice;
    
    // Determinar si el usuario actual está pagando precio promocional
    const isUserPromotional = premiumPrice < config.premiumNormalPrice;

    return NextResponse.json({
      success: true,
      pricing: {
        premiumNormalPrice: config.premiumNormalPrice,
        premiumPromotionPrice: config.premiumPromotionPrice,
        premiumPromotionMonths: config.premiumPromotionMonths,
        premiumCurrentPrice: premiumPrice,
        lightCommissionPercentage: config.lightCommissionPercentage,
        premiumExtraSessionCommissionPercentage: config.premiumExtraSessionCommissionPercentage,
        isPromotional: isUserPromotional, // Si el usuario actual está pagando precio promocional
        isPromotionActive: isPromotionActive, // Si la promoción está activa en la BD
      },
    });
  } catch (error) {
    console.error("Error obteniendo precios:", error);
    return NextResponse.json(
      {
        error: "Error al obtener los precios",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
