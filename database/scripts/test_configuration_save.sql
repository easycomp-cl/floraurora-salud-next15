-- =============================================
-- Script para probar que las configuraciones se guardan correctamente
-- =============================================

-- 1. Verificar valores actuales de precios
SELECT 
  config_key,
  config_value,
  is_active,
  updated_at,
  updated_by
FROM system_configurations
WHERE category = 'pricing'
ORDER BY config_key;

-- 2. Simular una actualización (esto lo hace el endpoint PUT)
-- NOTA: No ejecutar esto directamente, es solo para referencia
-- El endpoint PUT hace algo similar a esto:

/*
UPDATE system_configurations
SET 
  config_value = '39990',
  updated_by = 1,  -- ID del admin
  is_active = true
WHERE id = (SELECT id FROM system_configurations WHERE config_key = 'plan_premium_normal_price');

-- El trigger actualiza automáticamente updated_at
*/

-- 3. Verificar que el trigger funciona correctamente
-- Comparar updated_at antes y después de una actualización manual
SELECT 
  config_key,
  updated_at,
  NOW() as ahora,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutos_desde_actualizacion
FROM system_configurations
WHERE category = 'pricing'
ORDER BY updated_at DESC;

-- 4. Verificar integridad de datos
SELECT 
  config_key,
  CASE 
    WHEN data_type = 'number' AND (config_value ~ '^[0-9]+\.?[0-9]*$' = false) THEN 'ERROR: No es número'
    WHEN data_type = 'boolean' AND config_value NOT IN ('true', 'false', '1', '0') THEN 'ERROR: No es booleano'
    ELSE 'OK'
  END as validacion_tipo,
  config_value,
  data_type
FROM system_configurations
WHERE is_active = true
ORDER BY category, config_key;

-- 5. Verificar que todas las configuraciones de pricing tienen valores válidos
SELECT 
  config_key,
  config_value,
  CASE 
    WHEN config_key = 'plan_premium_normal_price' AND CAST(config_value AS INTEGER) > 0 THEN 'OK'
    WHEN config_key = 'plan_premium_promotion_price' AND CAST(config_value AS INTEGER) > 0 THEN 'OK'
    WHEN config_key = 'plan_premium_promotion_months' AND CAST(config_value AS INTEGER) >= 0 THEN 'OK'
    WHEN config_key = 'plan_light_commission_percentage' AND CAST(config_value AS INTEGER) BETWEEN 0 AND 100 THEN 'OK'
    ELSE 'REVISAR'
  END as validacion_valor
FROM system_configurations
WHERE category = 'pricing' AND is_active = true
ORDER BY config_key;
