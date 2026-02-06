-- =============================================
-- Agregar configuraciones de horas permitidas para crear horarios
-- Fecha: 2026-02-04
-- =============================================

-- Insertar configuración de hora inicial permitida para crear horarios
INSERT INTO system_configurations (config_key, config_value, description, data_type, category, created_by)
VALUES 
  ('schedule_start_hour', '08:00', 'Hora inicial permitida para crear horarios del profesional (formato HH:MM)', 'string', 'appointments', NULL),
  ('schedule_end_hour', '23:00', 'Hora final permitida para crear horarios del profesional (formato HH:MM)', 'string', 'appointments', NULL)
ON CONFLICT (config_key) DO UPDATE
SET 
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Comentarios
COMMENT ON COLUMN system_configurations.config_key IS 'Clave única de la configuración. Para horarios: schedule_start_hour, schedule_end_hour';
