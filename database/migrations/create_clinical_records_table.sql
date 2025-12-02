-- Migración para crear la tabla de fichas clínicas
-- Esta tabla almacena las notas, evolución y observaciones de cada sesión

CREATE TABLE IF NOT EXISTS public.clinical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id text NOT NULL,
  professional_id integer NOT NULL,
  patient_id integer NOT NULL,
  notes text,
  evolution text,
  observations text,
  diagnostic_hypothesis text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT clinical_records_appointment_id_fkey 
    FOREIGN KEY (appointment_id) 
    REFERENCES public.appointments(id) 
    ON DELETE CASCADE,
  CONSTRAINT clinical_records_professional_id_fkey 
    FOREIGN KEY (professional_id) 
    REFERENCES public.professionals(id) 
    ON DELETE CASCADE,
  CONSTRAINT clinical_records_patient_id_fkey 
    FOREIGN KEY (patient_id) 
    REFERENCES public.patients(id) 
    ON DELETE CASCADE,
  
  -- Una ficha clínica por cita
  CONSTRAINT clinical_records_appointment_id_unique UNIQUE (appointment_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clinical_records_appointment_id 
  ON public.clinical_records(appointment_id);

CREATE INDEX IF NOT EXISTS idx_clinical_records_professional_id 
  ON public.clinical_records(professional_id);

CREATE INDEX IF NOT EXISTS idx_clinical_records_patient_id 
  ON public.clinical_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_clinical_records_created_at 
  ON public.clinical_records(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_clinical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_clinical_records_updated_at_trigger
  BEFORE UPDATE ON public.clinical_records
  FOR EACH ROW
  EXECUTE FUNCTION update_clinical_records_updated_at();

-- Comentarios
COMMENT ON TABLE public.clinical_records IS 'Fichas clínicas de las sesiones. Una ficha por cita, vinculada al profesional y paciente.';
COMMENT ON COLUMN public.clinical_records.appointment_id IS 'ID de la cita asociada (formato APT-00000060)';
COMMENT ON COLUMN public.clinical_records.professional_id IS 'ID del profesional que crea la ficha';
COMMENT ON COLUMN public.clinical_records.patient_id IS 'ID del paciente de la sesión';
COMMENT ON COLUMN public.clinical_records.notes IS 'Notas generales de la sesión';
COMMENT ON COLUMN public.clinical_records.evolution IS 'Evolución del paciente durante la sesión';
COMMENT ON COLUMN public.clinical_records.observations IS 'Observaciones clínicas';
COMMENT ON COLUMN public.clinical_records.diagnostic_hypothesis IS 'Hipótesis diagnóstica';

-- Habilitar RLS
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- Política: Los profesionales solo pueden ver/editar sus propias fichas
-- Nota: professionals.id referencia directamente a users.id (el ID numérico)
-- users.user_id contiene el UUID de Supabase Auth (auth.uid())
CREATE POLICY "Professionals can view their own clinical records"
  ON public.clinical_records
  FOR SELECT
  USING (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los profesionales solo pueden insertar fichas para sus propias citas
CREATE POLICY "Professionals can insert their own clinical records"
  ON public.clinical_records
  FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los profesionales solo pueden actualizar sus propias fichas
CREATE POLICY "Professionals can update their own clinical records"
  ON public.clinical_records
  FOR UPDATE
  USING (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los administradores pueden hacer todo (se maneja con createAdminServer)
-- Nota: Las operaciones administrativas usan createAdminServer que bypass RLS

