-- Crear tabla de configuraciones del sistema
-- Solo el admin puede modificar, los demás usuarios solo pueden leer

CREATE TABLE IF NOT EXISTS system_configurations (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  data_type VARCHAR(50) DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  category VARCHAR(100) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(config_key);
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_active ON system_configurations(is_active);

-- Insertar configuraciones iniciales
INSERT INTO system_configurations (config_key, config_value, description, data_type, category, created_by)
VALUES 
  ('appointment_confirmation_hours_before', '24', 'Horas antes de la cita en que se puede confirmar asistencia', 'number', 'appointments', NULL),
  ('max_appointments_per_day', '10', 'Máximo de citas que un profesional puede tener por día', 'number', 'appointments', NULL),
  ('appointment_cancellation_hours_before', '24', 'Horas mínimas antes de la cita para poder cancelar sin penalización', 'number', 'appointments', NULL),
  ('default_appointment_duration', '55', 'Duración predeterminada de las citas en minutos', 'number', 'appointments', NULL),
  ('max_advance_booking_days', '60', 'Días máximos de anticipación para agendar una cita', 'number', 'appointments', NULL),
  ('min_advance_booking_hours', '2', 'Horas mínimas de anticipación para agendar una cita', 'number', 'appointments', NULL),
  ('enable_email_notifications', 'true', 'Habilitar notificaciones por correo electrónico', 'boolean', 'notifications', NULL),
  ('enable_sms_notifications', 'false', 'Habilitar notificaciones por SMS', 'boolean', 'notifications', NULL),
  ('appointment_reminder_hours_before', '24', 'Horas antes de la cita para enviar recordatorio', 'number', 'notifications', NULL),
  ('session_timeout_minutes', '30', 'Tiempo de inactividad antes de cerrar sesión (minutos)', 'number', 'security', NULL),
  ('max_login_attempts', '5', 'Intentos máximos de inicio de sesión antes de bloquear cuenta', 'number', 'security', NULL),
  ('password_min_length', '8', 'Longitud mínima de contraseña', 'number', 'security', NULL),
  ('maintenance_mode', 'false', 'Modo de mantenimiento del sistema', 'boolean', 'system', NULL),
  ('maintenance_message', 'El sistema está en mantenimiento. Por favor, intente más tarde.', 'Mensaje a mostrar durante el mantenimiento', 'string', 'system', NULL)
ON CONFLICT (config_key) DO NOTHING;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_system_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER trigger_update_system_configurations_updated_at
  BEFORE UPDATE ON system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_system_configurations_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Política: Todos los usuarios autenticados pueden leer configuraciones activas
CREATE POLICY "Users can read active configurations"
  ON system_configurations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Política: Solo los administradores (role = 1) pueden leer todas las configuraciones
CREATE POLICY "Admins can read all configurations"
  ON system_configurations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

-- Política: Solo los administradores pueden insertar configuraciones
CREATE POLICY "Admins can insert configurations"
  ON system_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

-- Política: Solo los administradores pueden actualizar configuraciones
CREATE POLICY "Admins can update configurations"
  ON system_configurations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

-- Política: Solo los administradores pueden eliminar configuraciones
CREATE POLICY "Admins can delete configurations"
  ON system_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

-- Comentarios en la tabla y columnas
COMMENT ON TABLE system_configurations IS 'Tabla de configuraciones del sistema. Solo los administradores pueden modificar.';
COMMENT ON COLUMN system_configurations.config_key IS 'Clave única de la configuración (ej: appointment_confirmation_hours_before)';
COMMENT ON COLUMN system_configurations.config_value IS 'Valor de la configuración (se almacena como texto)';
COMMENT ON COLUMN system_configurations.description IS 'Descripción de qué hace esta configuración';
COMMENT ON COLUMN system_configurations.data_type IS 'Tipo de dato: string, number, boolean, json';
COMMENT ON COLUMN system_configurations.category IS 'Categoría de la configuración (appointments, notifications, security, system, etc.)';
COMMENT ON COLUMN system_configurations.is_active IS 'Indica si la configuración está activa';
COMMENT ON COLUMN system_configurations.created_by IS 'ID del usuario que creó la configuración';
COMMENT ON COLUMN system_configurations.updated_by IS 'ID del usuario que actualizó la configuración por última vez';

