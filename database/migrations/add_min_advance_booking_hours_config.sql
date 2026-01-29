-- Actualizar configuración de horas mínimas de anticipación para agendar una cita
-- Valor por defecto: 5 horas (el usuario debe poder agendar con al menos 5 horas de diferencia)

UPDATE system_configurations
SET config_value = '5',
    description = 'Horas mínimas de anticipación para agendar una cita (mínimo tiempo entre ahora y la hora de la cita)',
    updated_at = NOW()
WHERE config_key = 'min_advance_booking_hours';

-- Si no existe, crearla
INSERT INTO system_configurations (config_key, config_value, description, data_type, category, created_by)
VALUES 
  ('min_advance_booking_hours', '5', 'Horas mínimas de anticipación para agendar una cita (mínimo tiempo entre ahora y la hora de la cita)', 'number', 'appointments', NULL)
ON CONFLICT (config_key) DO NOTHING;
