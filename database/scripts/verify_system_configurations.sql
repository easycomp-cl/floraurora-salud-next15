-- =============================================
-- Script para verificar que las configuraciones se están guardando correctamente
-- =============================================

-- 1. Verificar todas las configuraciones activas
SELECT 
  id,
  config_key,
  config_value,
  data_type,
  category,
  is_active,
  updated_at,
  updated_by
FROM system_configurations
WHERE is_active = true
ORDER BY category, config_key;

-- 2. Verificar configuraciones de precios específicamente
SELECT 
  config_key,
  config_value,
  is_active,
  updated_at
FROM system_configurations
WHERE category = 'pricing'
ORDER BY config_key;

-- 3. Verificar que el trigger de updated_at funciona
-- (debería actualizarse automáticamente cuando se modifica un registro)
SELECT 
  config_key,
  updated_at,
  CASE 
    WHEN updated_at >= NOW() - INTERVAL '1 hour' THEN 'Reciente'
    WHEN updated_at >= NOW() - INTERVAL '24 hours' THEN 'Hoy'
    ELSE 'Antiguo'
  END as estado_actualizacion
FROM system_configurations
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Verificar configuraciones que deberían estar activas pero no lo están
SELECT 
  config_key,
  category,
  is_active,
  config_value
FROM system_configurations
WHERE is_active = false
ORDER BY category, config_key;

-- 5. Contar configuraciones por categoría
SELECT 
  category,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as activas,
  COUNT(*) FILTER (WHERE is_active = false) as inactivas
FROM system_configurations
GROUP BY category
ORDER BY category;
