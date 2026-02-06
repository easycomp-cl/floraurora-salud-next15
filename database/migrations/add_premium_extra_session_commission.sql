-- =============================================
-- Agregar configuración de comisión por sesiones extra del Plan Premium
-- Fecha: 2026-02-04
-- =============================================

-- Insertar configuración de comisión por sesiones extra del Plan Premium
INSERT INTO system_configurations (config_key, config_value, description, data_type, category, created_by)
VALUES 
  ('plan_premium_extra_session_commission_percentage', '1.6', 'Porcentaje de comisión por sesiones extra del Plan Premium (además del pago mensual)', 'number', 'pricing', NULL)
ON CONFLICT (config_key) DO UPDATE
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Actualizar el valor de la comisión del Plan Light a 15% (ya que es diferente a la del premium)
UPDATE system_configurations
SET 
  config_value = '15',
  description = 'Porcentaje de comisión del Plan Light por sesión (no requiere pago mensual)',
  updated_at = NOW()
WHERE config_key = 'plan_light_commission_percentage';
