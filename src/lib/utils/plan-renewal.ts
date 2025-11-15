/**
 * Utilidades para el cálculo de renovación de planes mensuales
 * Según reglas financieras chilenas
 */

/**
 * Calcula la nueva fecha de expiración del plan mensual
 * 
 * Reglas:
 * - Si es el primer pago (no hay fecha de expiración previa): +30 días desde hoy
 * - Si es renovación (hay fecha de expiración previa): +30 días desde la fecha de expiración actual
 * 
 * @param currentExpirationDate - Fecha de expiración actual (null si es primer pago)
 * @returns Nueva fecha de expiración (30 días después)
 */
export function calculateNewExpirationDate(
  currentExpirationDate: Date | null | string
): Date {
  const now = new Date();
  
  // Si no hay fecha de expiración previa, es el primer pago
  if (!currentExpirationDate) {
    const newExpiration = new Date(now);
    newExpiration.setDate(newExpiration.getDate() + 30);
    return newExpiration;
  }
  
  // Si hay fecha de expiración previa, es una renovación
  // Sumar 30 días desde la fecha de expiración actual (no desde hoy)
  const expirationDate = typeof currentExpirationDate === 'string' 
    ? new Date(currentExpirationDate) 
    : currentExpirationDate;
  
  const newExpiration = new Date(expirationDate);
  newExpiration.setDate(newExpiration.getDate() + 30);
  
  return newExpiration;
}

/**
 * Verifica si el plan puede ser renovado
 * 
 * Reglas:
 * - No se puede renovar hasta 5 días antes de que expire
 * - Si el plan ya expiró, se puede renovar inmediatamente
 * 
 * @param expirationDate - Fecha de expiración del plan
 * @returns true si se puede renovar, false si no
 */
export function canRenewPlan(
  expirationDate: Date | null | string
): { canRenew: boolean; reason?: string; daysUntilRenewal?: number } {
  if (!expirationDate) {
    // Si no hay fecha de expiración, es el primer pago (siempre permitido)
    return { canRenew: true };
  }
  
  const expiration = typeof expirationDate === 'string' 
    ? new Date(expirationDate) 
    : expirationDate;
  
  const now = new Date();
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Si el plan ya expiró, se puede renovar inmediatamente
  if (diffDays <= 0) {
    return { 
      canRenew: true,
      reason: "Tu plan ha expirado. Puedes renovarlo ahora."
    };
  }
  
  // Si faltan más de 5 días, no se puede renovar aún
  if (diffDays > 5) {
    return { 
      canRenew: false,
      reason: `Podrás renovar tu plan cuando falten 5 días o menos para su expiración.`,
      daysUntilRenewal: diffDays - 5
    };
  }
  
  // Si faltan 5 días o menos, se puede renovar
  return { 
    canRenew: true,
    reason: diffDays === 5 
      ? "Puedes renovar tu plan ahora. Se extenderá por 30 días desde la fecha de expiración actual."
      : `Tu plan expira en ${diffDays} días. Puedes renovarlo ahora y se extenderá por 30 días desde la fecha de expiración.`
  };
}

/**
 * Calcula la fecha en que se debe realizar el pago automático
 * 
 * Reglas financieras chilenas:
 * - El pago automático se realiza el último día del plazo (día de expiración)
 * 
 * @param expirationDate - Fecha de expiración del plan
 * @returns Fecha en que se debe realizar el pago automático
 */
export function calculateAutoPaymentDate(
  expirationDate: Date | null | string
): Date | null {
  if (!expirationDate) {
    return null;
  }
  
  const expiration = typeof expirationDate === 'string' 
    ? new Date(expirationDate) 
    : expirationDate;
  
  // El pago automático se realiza el mismo día de expiración
  // A las 00:00 horas del día de expiración
  const autoPaymentDate = new Date(expiration);
  autoPaymentDate.setHours(0, 0, 0, 0);
  
  return autoPaymentDate;
}

/**
 * Verifica si el pago automático está habilitado para un profesional
 * (Por ahora siempre retorna false, ya que no está implementado)
 * 
 * @param professionalId - ID del profesional
 * @returns true si el pago automático está habilitado
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isAutoPaymentEnabled(professionalId: number): boolean {
  // TODO: Implementar lógica para verificar si el profesional tiene pago automático habilitado
  // Esto podría estar en una columna de la tabla professionals o en una tabla separada
  return false;
}

