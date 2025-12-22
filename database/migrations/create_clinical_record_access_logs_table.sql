-- Migración para crear la tabla de logs de acceso a fichas clínicas
-- Esta tabla registra todos los accesos y modificaciones a las fichas clínicas para auditoría

CREATE TABLE IF NOT EXISTS public.clinical_record_access_logs (
  id BIGSERIAL PRIMARY KEY,
  clinical_record_id uuid REFERENCES public.clinical_records(id) ON DELETE SET NULL,
  intake_record_id uuid REFERENCES public.patient_intake_records(id) ON DELETE SET NULL,
  professional_id integer NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'view', 'create', 'update', 'delete'
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT NULL, -- Cambios realizados, valores anteriores, etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_clinical_record_id 
  ON public.clinical_record_access_logs(clinical_record_id) 
  WHERE clinical_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_intake_record_id 
  ON public.clinical_record_access_logs(intake_record_id) 
  WHERE intake_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_professional_id 
  ON public.clinical_record_access_logs(professional_id);

CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_action 
  ON public.clinical_record_access_logs(action);

CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_created_at 
  ON public.clinical_record_access_logs(created_at DESC);

-- Índice compuesto para consultas comunes (profesional + fecha)
CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_professional_created_at 
  ON public.clinical_record_access_logs(professional_id, created_at DESC);

-- Índice GIN para búsquedas en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_clinical_record_access_logs_metadata 
  ON public.clinical_record_access_logs USING GIN(metadata) 
  WHERE metadata IS NOT NULL;

-- Comentarios
COMMENT ON TABLE public.clinical_record_access_logs IS 'Registro de auditoría de accesos y modificaciones a fichas clínicas';
COMMENT ON COLUMN public.clinical_record_access_logs.id IS 'ID único del registro de log';
COMMENT ON COLUMN public.clinical_record_access_logs.clinical_record_id IS 'ID de la ficha de evolución accedida (nullable si es ficha de ingreso)';
COMMENT ON COLUMN public.clinical_record_access_logs.intake_record_id IS 'ID de la ficha de ingreso accedida (nullable si es ficha de evolución)';
COMMENT ON COLUMN public.clinical_record_access_logs.professional_id IS 'ID del profesional que realizó la acción';
COMMENT ON COLUMN public.clinical_record_access_logs.action IS 'Tipo de acción: view, create, update, delete';
COMMENT ON COLUMN public.clinical_record_access_logs.ip_address IS 'Dirección IP desde la cual se realizó la acción';
COMMENT ON COLUMN public.clinical_record_access_logs.user_agent IS 'User agent del navegador/cliente que realizó la acción';
COMMENT ON COLUMN public.clinical_record_access_logs.metadata IS 'Metadatos adicionales en formato JSON (campos modificados, valores anteriores, etc.)';
COMMENT ON COLUMN public.clinical_record_access_logs.created_at IS 'Fecha y hora en que se registró la acción';

-- Habilitar RLS
ALTER TABLE public.clinical_record_access_logs ENABLE ROW LEVEL SECURITY;

-- Política: Solo los administradores pueden ver los logs de acceso
CREATE POLICY "Only administrators can view access logs"
  ON public.clinical_record_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política: Los profesionales pueden insertar logs de sus propias acciones
-- Esto permite que el sistema registre automáticamente las acciones del profesional
CREATE POLICY "Professionals can insert their own access logs"
  ON public.clinical_record_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los administradores pueden insertar logs (para operaciones administrativas)
CREATE POLICY "Administrators can insert access logs"
  ON public.clinical_record_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Nota: No se permiten UPDATE ni DELETE en los logs de auditoría para mantener integridad

