-- =============================================
-- Agregar configuraciones de precios de planes
-- Fecha: 2026-02-04
-- =============================================

-- Insertar configuraciones de precios de planes
INSERT INTO system_configurations (config_key, config_value, description, data_type, category, created_by)
VALUES 
  ('plan_premium_normal_price', '39990', 'Precio normal del Plan Premium en CLP', 'number', 'pricing', NULL),
  ('plan_premium_promotion_price', '24990', 'Precio promocional del Plan Premium por 3 meses en CLP', 'number', 'pricing', NULL),
  ('plan_premium_promotion_months', '3', 'Número de meses que dura la promoción del Plan Premium', 'number', 'pricing', NULL),
  ('plan_light_commission_percentage', '1.6', 'Porcentaje de comisión del Plan Light por sesión', 'number', 'pricing', NULL)
ON CONFLICT (config_key) DO UPDATE
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Comentarios
COMMENT ON COLUMN system_configurations.config_key IS 'Clave única de la configuración. Para precios de planes: plan_premium_normal_price, plan_premium_promotion_price, plan_premium_promotion_months, plan_light_commission_percentage';
