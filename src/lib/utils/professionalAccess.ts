import { profileService } from "@/lib/services/profileService";
import type { ProfessionalProfile } from "@/lib/types/profile";

interface ProfessionalAccessCheck {
  canUseService: boolean;
  reason?: string;
  planType?: "commission" | "monthly" | null;
  isMonthlyPlanActive?: boolean;
  daysRemaining?: number | null;
}

interface ProfessionalWithPlan extends ProfessionalProfile {
  plan_type?: "commission" | "monthly" | null;
  monthly_plan_expires_at?: string | null;
  is_active?: boolean;
}

/**
 * Verifica si un profesional puede usar el servicio basado en su plan y pagos
 */
export async function checkProfessionalAccess(
  userId: number
): Promise<ProfessionalAccessCheck> {
  try {
    const professional = await profileService.getProfessionalProfile(userId);
    
    if (!professional) {
      return {
        canUseService: false,
        reason: "No se encontró información del profesional",
      };
    }

    const professionalWithPlan = professional as ProfessionalWithPlan;
    const planType = professionalWithPlan.plan_type ?? null;
    const monthlyPlanExpiresAt = professionalWithPlan.monthly_plan_expires_at 
      ? new Date(professionalWithPlan.monthly_plan_expires_at) 
      : null;
    const isActive = professionalWithPlan.is_active !== undefined 
      ? professionalWithPlan.is_active 
      : true; // Por defecto activo si no se especifica

    // Si tiene plan de comisión, puede usar el servicio (siempre que is_active sea true)
    if (planType === "commission") {
      if (!isActive) {
        return {
          canUseService: false,
          planType: "commission",
          reason: "Tu cuenta está inactiva. Contacta con el administrador.",
        };
      }
      return {
        canUseService: true,
        planType: "commission",
      };
    }

    // Si tiene plan mensual, verificar que el pago esté activo (monthly_plan_expires_at en el futuro)
    if (planType === "monthly") {
      const now = new Date();
      const hasActivePayment = monthlyPlanExpiresAt && monthlyPlanExpiresAt > now;
      
      const daysRemaining = monthlyPlanExpiresAt
        ? Math.ceil((monthlyPlanExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      if (hasActivePayment) {
        return {
          canUseService: true,
          planType: "monthly",
          isMonthlyPlanActive: true,
          daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
        };
      } else {
        // Si no tiene pago activo, está inactivo
        return {
          canUseService: false,
          planType: "monthly",
          isMonthlyPlanActive: false,
          reason: monthlyPlanExpiresAt && monthlyPlanExpiresAt <= now
            ? "Tu plan mensual ha expirado. Por favor, realiza el pago para continuar usando el servicio."
            : "No has realizado el pago del plan mensual o el pago falló. Por favor, realiza el pago para activar tu cuenta.",
          daysRemaining: daysRemaining && daysRemaining > 0 ? daysRemaining : null,
        };
      }
    }

    // Si no tiene plan asignado
    return {
      canUseService: false,
      planType: null,
      reason: "No tienes un plan asignado. Contacta con el administrador para activar tu cuenta.",
    };
  } catch (error) {
    console.error("Error verificando acceso del profesional:", error);
    return {
      canUseService: false,
      reason: "Error al verificar el acceso",
    };
  }
}

