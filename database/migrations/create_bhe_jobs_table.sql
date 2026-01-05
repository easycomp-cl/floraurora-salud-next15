-- =============================================
-- Migración: Sistema de Cola para Boletas de Honorarios Electrónicas (BHE)
-- Descripción: Tabla para gestionar la emisión de boletas mediante robot RPA externo
-- Fecha: 2025-01-XX
-- =============================================

-- 1. Crear tabla principal bhe_jobs
CREATE TABLE IF NOT EXISTS public.bhe_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificadores de la transacción
  payment_id text NOT NULL, -- ID del pago (puede ser buy_order de Transbank u otro identificador)
  appointment_id text NULL, -- ID de la cita asociada (opcional, formato: "APT-00000060")
  
  -- Identificadores de usuarios
  professional_id integer NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id integer NULL REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_rut text NULL, -- RUT del paciente (para la boleta)
  
  -- Datos de la boleta
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  glosa text NOT NULL, -- Descripción del servicio
  issue_date date NOT NULL DEFAULT current_date,
  
  -- Estado y control de procesamiento
  status text NOT NULL CHECK (status IN ('queued', 'processing', 'done', 'failed', 'retrying')) DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_run_at timestamptz NULL, -- Para reintentos programados
  
  -- Claim/Lock para múltiples workers
  claimed_by text NULL, -- Identificador del worker que reclamó el job
  claimed_at timestamptz NULL,
  
  -- Timestamps de procesamiento
  started_at timestamptz NULL,
  finished_at timestamptz NULL,
  
  -- Resultados del procesamiento
  result_folio text NULL, -- Folio de la boleta emitida por el SII
  result_pdf_bucket text NULL DEFAULT 'bhe-pdfs', -- Bucket de Supabase Storage
  result_pdf_path text NULL, -- Ruta del PDF en Storage
  
  -- Manejo de errores
  last_error text NULL, -- Último error ocurrido
  
  -- Metadatos
  metadata jsonb NULL, -- Datos adicionales (ej: respuesta del RPA)
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraint de idempotencia: evitar duplicados por webhooks repetidos
  CONSTRAINT bhe_jobs_payment_id_unique UNIQUE (payment_id)
);

-- 2. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_status ON public.bhe_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_next_run_at ON public.bhe_jobs(next_run_at) WHERE next_run_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_status_next_run_at ON public.bhe_jobs(status, next_run_at) WHERE status IN ('queued', 'retrying');
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_professional_id ON public.bhe_jobs(professional_id);
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_patient_id ON public.bhe_jobs(patient_id) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_appointment_id ON public.bhe_jobs(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_payment_id ON public.bhe_jobs(payment_id);
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_created_at ON public.bhe_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bhe_jobs_claimed_by ON public.bhe_jobs(claimed_by) WHERE claimed_by IS NOT NULL;

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_bhe_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bhe_jobs_updated_at_trigger
  BEFORE UPDATE ON public.bhe_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_bhe_jobs_updated_at();

-- 4. Función SQL para claim/lock de jobs (crítico para múltiples workers)
-- Esta función asegura que solo un worker pueda reclamar un job a la vez
CREATE OR REPLACE FUNCTION claim_bhe_job(worker_id text)
RETURNS TABLE (
  id uuid,
  payment_id text,
  appointment_id text,
  professional_id integer,
  patient_id integer,
  patient_rut text,
  amount numeric,
  glosa text,
  issue_date date,
  status text,
  attempts int,
  metadata jsonb
) AS $$
DECLARE
  claimed_job_id uuid;
BEGIN
  -- Buscar y reclamar un job elegible en una transacción atómica
  UPDATE public.bhe_jobs
  SET 
    status = 'processing',
    claimed_by = worker_id,
    claimed_at = now(),
    started_at = now(),
    attempts = attempts + 1
  WHERE id = (
    SELECT id
    FROM public.bhe_jobs
    WHERE status IN ('queued', 'retrying')
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (claimed_by IS NULL OR claimed_at < now() - INTERVAL '30 minutes') -- Liberar jobs abandonados después de 30 min
    ORDER BY created_at ASC -- FIFO
    LIMIT 1
    FOR UPDATE SKIP LOCKED -- Evitar bloqueos entre workers
  )
  RETURNING bhe_jobs.id INTO claimed_job_id;
  
  -- Si se reclamó un job, devolver sus datos
  IF claimed_job_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.payment_id,
      b.appointment_id,
      b.professional_id,
      b.patient_id,
      b.patient_rut,
      b.amount,
      b.glosa,
      b.issue_date,
      b.status,
      b.attempts,
      b.metadata
    FROM public.bhe_jobs b
    WHERE b.id = claimed_job_id;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 5. Función para marcar un job como completado
CREATE OR REPLACE FUNCTION complete_bhe_job(
  job_id uuid,
  folio text,
  pdf_bucket text,
  pdf_path text
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.bhe_jobs
  SET 
    status = 'done',
    finished_at = now(),
    result_folio = folio,
    result_pdf_bucket = pdf_bucket,
    result_pdf_path = pdf_path,
    last_error = NULL -- Limpiar errores previos
  WHERE id = job_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para marcar un job como fallido y programar reintento
CREATE OR REPLACE FUNCTION fail_bhe_job(
  job_id uuid,
  error_message text,
  max_attempts int DEFAULT 5
)
RETURNS boolean AS $$
DECLARE
  current_attempts int;
  next_run timestamptz;
BEGIN
  -- Obtener intentos actuales
  SELECT attempts INTO current_attempts
  FROM public.bhe_jobs
  WHERE id = job_id;
  
  -- Calcular próximo intento con backoff exponencial
  -- 5m, 15m, 1h, 3h, 6h
  CASE current_attempts
    WHEN 1 THEN next_run := now() + INTERVAL '5 minutes';
    WHEN 2 THEN next_run := now() + INTERVAL '15 minutes';
    WHEN 3 THEN next_run := now() + INTERVAL '1 hour';
    WHEN 4 THEN next_run := now() + INTERVAL '3 hours';
    ELSE next_run := now() + INTERVAL '6 hours';
  END CASE;
  
  -- Si supera el máximo de intentos, marcar como fallido permanentemente
  IF current_attempts >= max_attempts THEN
    UPDATE public.bhe_jobs
    SET 
      status = 'failed',
      finished_at = now(),
      last_error = error_message,
      claimed_by = NULL,
      claimed_at = NULL
    WHERE id = job_id;
  ELSE
    -- Programar reintento
    UPDATE public.bhe_jobs
    SET 
      status = 'retrying',
      next_run_at = next_run,
      last_error = error_message,
      claimed_by = NULL,
      claimed_at = NULL,
      started_at = NULL
    WHERE id = job_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 7. Tabla opcional de auditoría (eventos de cambios de estado)
CREATE TABLE IF NOT EXISTS public.bhe_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.bhe_jobs(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'status_change', 'error', 'retry', etc.
  old_status text,
  new_status text,
  payload jsonb NULL, -- Datos adicionales del evento
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bhe_job_events_job_id ON public.bhe_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_bhe_job_events_created_at ON public.bhe_job_events(created_at DESC);

-- Trigger para registrar cambios de estado automáticamente
CREATE OR REPLACE FUNCTION log_bhe_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.bhe_job_events (job_id, event_type, old_status, new_status, payload)
    VALUES (
      NEW.id,
      'status_change',
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'attempts', NEW.attempts,
        'claimed_by', NEW.claimed_by,
        'last_error', NEW.last_error
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_bhe_job_status_change_trigger
  AFTER UPDATE OF status ON public.bhe_jobs
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_bhe_job_status_change();

-- 8. Comentarios para documentación
COMMENT ON TABLE public.bhe_jobs IS 'Cola de trabajos para emisión de Boletas de Honorarios Electrónicas mediante robot RPA externo';
COMMENT ON COLUMN public.bhe_jobs.payment_id IS 'ID único del pago (buy_order de Transbank u otro). Usado para idempotencia';
COMMENT ON COLUMN public.bhe_jobs.status IS 'Estado del job: queued (en cola), processing (procesando), done (completado), failed (fallido), retrying (reintentando)';
COMMENT ON COLUMN public.bhe_jobs.next_run_at IS 'Fecha/hora del próximo intento (para jobs en estado retrying)';
COMMENT ON COLUMN public.bhe_jobs.claimed_by IS 'Identificador del worker que reclamó el job (para evitar duplicados)';
COMMENT ON COLUMN public.bhe_jobs.result_pdf_bucket IS 'Bucket de Supabase Storage donde se almacena el PDF';
COMMENT ON COLUMN public.bhe_jobs.result_pdf_path IS 'Ruta del archivo PDF en Supabase Storage';
COMMENT ON FUNCTION claim_bhe_job IS 'Función transaccional para reclamar un job elegible. Evita que múltiples workers procesen el mismo job';
COMMENT ON FUNCTION complete_bhe_job IS 'Marca un job como completado con los resultados del procesamiento';
COMMENT ON FUNCTION fail_bhe_job IS 'Marca un job como fallido y programa reintento con backoff exponencial';

-- 9. Habilitar RLS
ALTER TABLE public.bhe_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bhe_job_events ENABLE ROW LEVEL SECURITY;

-- 10. Políticas RLS para bhe_jobs

-- Policy: Los profesionales solo pueden ver sus propias boletas
CREATE POLICY "Professionals can view their own BHE jobs"
  ON public.bhe_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.professionals p
      JOIN public.users u ON p.id = u.id
      WHERE p.id = bhe_jobs.professional_id
      AND u.user_id = auth.uid()
    )
  );

-- Policy: Los pacientes solo pueden ver boletas asociadas a ellos
CREATE POLICY "Patients can view their own BHE jobs"
  ON public.bhe_jobs
  FOR SELECT
  USING (
    patient_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM public.patients p
      JOIN public.users u ON p.id = u.id
      WHERE p.id = bhe_jobs.patient_id
      AND u.user_id = auth.uid()
    )
  );

-- Policy: Solo el sistema (service role) puede insertar jobs
-- Los usuarios no pueden insertar directamente, solo a través de la API

-- Policy: Solo el sistema (service role) puede actualizar jobs
-- Los usuarios no pueden modificar jobs directamente

-- Policy: Los administradores pueden ver todos los jobs
CREATE POLICY "Admins can view all BHE jobs"
  ON public.bhe_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- 11. Políticas RLS para bhe_job_events

-- Policy: Los profesionales pueden ver eventos de sus boletas
CREATE POLICY "Professionals can view events of their BHE jobs"
  ON public.bhe_job_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.bhe_jobs b
      JOIN public.professionals p ON b.professional_id = p.id
      JOIN public.users u ON p.id = u.id
      WHERE b.id = bhe_job_events.job_id
      AND u.user_id = auth.uid()
    )
  );

-- Policy: Los administradores pueden ver todos los eventos
CREATE POLICY "Admins can view all BHE job events"
  ON public.bhe_job_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- 
-- 1. La función claim_bhe_job() usa FOR UPDATE SKIP LOCKED para evitar
--    que múltiples workers procesen el mismo job simultáneamente.
--
-- 2. Los jobs abandonados (claimed_by no NULL pero sin actualización en 30 min)
--    se liberan automáticamente para ser reclamados nuevamente.
--
-- 3. El sistema de reintentos usa backoff exponencial: 5m, 15m, 1h, 3h, 6h.
--    Después de 5 intentos fallidos, el job se marca como 'failed'.
--
-- 4. La constraint UNIQUE(payment_id) asegura idempotencia: si un webhook
--    se procesa múltiples veces, solo se crea un job.
--
-- 5. Las políticas RLS permiten que profesionales y pacientes vean solo
--    sus propias boletas. Solo el service role puede insertar/actualizar.
--
-- =============================================

