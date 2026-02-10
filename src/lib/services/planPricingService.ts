import { createAdminServer } from "@/utils/supabase/server";

export interface PlanPricingConfig {
  premiumNormalPrice: number;
  premiumPromotionPrice: number;
  premiumPromotionMonths: number;
  lightCommissionPercentage: number; // Comisión del Plan Light por sesión (15%)
  premiumExtraSessionCommissionPercentage: number; // Comisión por sesiones extra del Plan Premium (1.6%)
}

/**
 * Obtiene las configuraciones de precios de planes desde la base de datos
 * Si no se encuentran, retorna valores por defecto
 */
export async function getPlanPricingConfig(): Promise<PlanPricingConfig> {
  const supabase = createAdminServer();

  const configKeys = [
    "plan_premium_normal_price",
    "plan_premium_promotion_price",
    "plan_premium_promotion_months",
    "plan_light_commission_percentage",
    "plan_premium_extra_session_commission_percentage",
  ];

  // Obtener TODAS las configuraciones de precios (activas e inactivas)
  // para poder determinar correctamente el estado de la promoción
  const { data: configurations, error } = await supabase
    .from("system_configurations")
    .select("config_key, config_value, data_type, is_active")
    .in("config_key", configKeys);

  if (error) {
    console.warn("[planPricingService] Error obteniendo configuraciones:", error);
  }

  // Valores por defecto
  const defaults: PlanPricingConfig = {
    premiumNormalPrice: 39990,
    premiumPromotionPrice: 24990,
    premiumPromotionMonths: 3,
    lightCommissionPercentage: 15, // Plan Light: 15% por sesión
    premiumExtraSessionCommissionPercentage: 1.6, // Plan Premium: 1.6% por sesiones extra
  };

  if (!configurations || configurations.length === 0) {
    return defaults;
  }

  // Convertir configuraciones a objeto
  // Separar configuraciones activas e inactivas para manejar correctamente el estado
  const configMap = new Map<string, number>();
  const activeConfigs = new Set<string>();
  const allConfigs = new Map<string, { value: number; is_active: boolean }>();
  
  configurations.forEach((config) => {
    if (config.data_type === "number") {
      const value = Number(config.config_value);
      if (!isNaN(value)) {
        allConfigs.set(config.config_key, { value, is_active: config.is_active });
        
        // Solo agregar a configMap y activeConfigs si está activa
        if (config.is_active) {
          configMap.set(config.config_key, value);
          activeConfigs.add(config.config_key);
        }
      }
    }
  });

  // El precio normal siempre debe estar activo, pero si no está en la BD, usar el valor por defecto
  // Si está en la BD pero inactivo, usar el valor de la BD de todas formas (es el precio base)
  const normalPriceConfig = allConfigs.get("plan_premium_normal_price");
  const premiumNormalPrice = normalPriceConfig 
    ? normalPriceConfig.value 
    : (configMap.get("plan_premium_normal_price") ?? defaults.premiumNormalPrice);

  // Verificar si la promoción está activa (ambas configuraciones deben estar activas)
  const promotionPriceConfig = allConfigs.get("plan_premium_promotion_price");
  const promotionMonthsConfig = allConfigs.get("plan_premium_promotion_months");
  
  const promotionPriceActive = promotionPriceConfig?.is_active ?? false;
  const promotionMonthsActive = promotionMonthsConfig?.is_active ?? false;
  const promotionActive = promotionPriceActive && promotionMonthsActive;

  // Si la promoción está activa, usar el precio promocional de la BD
  // Si no está activa, usar el precio normal
  const premiumPromotionPrice = promotionActive && promotionPriceConfig
    ? promotionPriceConfig.value
    : premiumNormalPrice; // Si la promoción no está activa, usar el precio normal
  
  const premiumPromotionMonths = promotionActive && promotionMonthsConfig
    ? promotionMonthsConfig.value
    : 0; // Si la promoción no está activa, no hay meses de promoción

  return {
    premiumNormalPrice,
    premiumPromotionPrice,
    premiumPromotionMonths,
    lightCommissionPercentage:
      configMap.get("plan_light_commission_percentage") ??
      defaults.lightCommissionPercentage,
    premiumExtraSessionCommissionPercentage:
      configMap.get("plan_premium_extra_session_commission_percentage") ??
      defaults.premiumExtraSessionCommissionPercentage,
  };
}

/**
 * Calcula el precio a cobrar según si el profesional está en período promocional
 * @param professionalId - ID del profesional
 * @returns Precio a cobrar (promocional o normal)
 */
export async function getPremiumPlanPrice(
  professionalId: number
): Promise<number> {
  const config = await getPlanPricingConfig();
  const supabase = createAdminServer();

  // PRIMERO: Verificar si el administrador activó manualmente el precio promocional
  const { data: professional, error: professionalError } = await supabase
    .from("professionals")
    .select("use_promotional_price")
    .eq("id", professionalId)
    .single();

  if (professionalError) {
    console.warn(
      "[planPricingService] Error obteniendo datos del profesional:",
      professionalError
    );
  } else if (professional?.use_promotional_price === true) {
    // Si el admin activó manualmente el precio promocional, usarlo siempre
    return config.premiumPromotionPrice;
  }

  // SEGUNDO: Verificar si el profesional está en período promocional natural
  // Un profesional está en promoción si tiene menos de X pagos mensuales exitosos
  const { data: payments, error } = await supabase
    .from("monthly_subscription_payments")
    .select("id")
    .eq("professional_id", professionalId)
    .eq("provider_payment_status", "succeeded")
    .order("payment_date", { ascending: false });

  if (error) {
    console.warn(
      "[planPricingService] Error verificando pagos del profesional:",
      error
    );
    // En caso de error, retornar precio promocional por defecto
    return config.premiumPromotionPrice;
  }

  // Si la promoción no está activa (meses = 0), siempre usar precio normal
  if (config.premiumPromotionMonths === 0) {
    return config.premiumNormalPrice;
  }

  // Si tiene menos pagos que los meses de promoción, aplicar precio promocional
  const paymentCount = payments?.length || 0;
  if (paymentCount < config.premiumPromotionMonths) {
    return config.premiumPromotionPrice;
  }

  return config.premiumNormalPrice;
}

/**
 * Obtiene el precio del plan premium para un nuevo profesional
 * Si la promoción está activa, retorna precio promocional, sino precio normal
 */
export async function getPremiumPlanPriceForNewProfessional(): Promise<number> {
  const config = await getPlanPricingConfig();
  // Si la promoción no está activa (meses = 0), usar precio normal
  if (config.premiumPromotionMonths === 0) {
    return config.premiumNormalPrice;
  }
  return config.premiumPromotionPrice;
}
