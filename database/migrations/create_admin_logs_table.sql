-- =============================================
-- Crear tabla admin_logs para auditoría administrativa
-- Fecha: 2025-01-XX
-- Descripción: Tabla para registrar todas las acciones administrativas realizadas en el sistema
-- =============================================

-- Crear la tabla admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id INTEGER REFERENCES public.users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

-- Comentarios para documentación
COMMENT ON TABLE public.admin_logs IS 'Registro de auditoría de todas las acciones administrativas realizadas en el sistema';
COMMENT ON COLUMN public.admin_logs.id IS 'ID único del registro de log';
COMMENT ON COLUMN public.admin_logs.actor_id IS 'ID del usuario que realizó la acción (referencia a users.id). NULL si la acción fue realizada por el sistema';
COMMENT ON COLUMN public.admin_logs.action IS 'Nombre de la acción realizada (ej: "create_user", "update_user", "block_user", "approve_professional_request")';
COMMENT ON COLUMN public.admin_logs.entity IS 'Tipo de entidad afectada (ej: "users", "professionals", "services", "professional_requests")';
COMMENT ON COLUMN public.admin_logs.entity_id IS 'ID de la entidad específica afectada por la acción';
COMMENT ON COLUMN public.admin_logs.metadata IS 'Metadatos adicionales en formato JSON (razones, valores anteriores, etc.)';
COMMENT ON COLUMN public.admin_logs.created_at IS 'Fecha y hora en que se registró la acción';
COMMENT ON COLUMN public.admin_logs.ip_address IS 'Dirección IP desde la cual se realizó la acción';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_admin_logs_actor_id ON public.admin_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON public.admin_logs(entity);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity_id ON public.admin_logs(entity_id) WHERE entity_id IS NOT NULL;

-- Índice compuesto para consultas comunes (actor + fecha)
CREATE INDEX IF NOT EXISTS idx_admin_logs_actor_created_at ON public.admin_logs(actor_id, created_at DESC) WHERE actor_id IS NOT NULL;

-- Índice GIN para búsquedas en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_admin_logs_metadata ON public.admin_logs USING GIN(metadata) WHERE metadata IS NOT NULL;

-- Permisos RLS (Row Level Security)
-- Nota: Asegúrate de tener políticas RLS configuradas según tus necesidades de seguridad

-- Permisos básicos
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
-- Solo los administradores pueden insertar logs (esto se maneja a nivel de aplicación)
-- Los usuarios autenticados pueden leer sus propios logs o todos según la política RLS

-- Política RLS opcional: Permitir que los administradores vean todos los logs
-- Descomenta y ajusta según tus necesidades:
/*
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los administradores pueden ver todos los logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text::integer
      AND users.role = 1 -- rol 1 = admin
    )
  );

CREATE POLICY "Los administradores pueden insertar logs"
  ON public.admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()::text::integer
      AND users.role = 1 -- rol 1 = admin
    )
  );
*/

