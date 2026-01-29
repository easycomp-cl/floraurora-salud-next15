-- Migración para crear la tabla de encuestas de satisfacción
-- Esta tabla almacena las calificaciones y comentarios de los pacientes sobre sus citas

CREATE TABLE IF NOT EXISTS public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id text NOT NULL,
  patient_id integer NOT NULL,
  professional_id integer NOT NULL,
  
  -- Evaluación del profesional (1-5 estrellas, obligatorio)
  professional_empathy_rating integer NOT NULL CHECK (professional_empathy_rating >= 1 AND professional_empathy_rating <= 5),
  professional_punctuality_rating integer NOT NULL CHECK (professional_punctuality_rating >= 1 AND professional_punctuality_rating <= 5),
  professional_satisfaction_rating integer NOT NULL CHECK (professional_satisfaction_rating >= 1 AND professional_satisfaction_rating <= 5),
  
  -- Evaluación de la plataforma (1-5 estrellas, obligatorio)
  platform_booking_rating integer NOT NULL CHECK (platform_booking_rating >= 1 AND platform_booking_rating <= 5),
  platform_payment_rating integer NOT NULL CHECK (platform_payment_rating >= 1 AND platform_payment_rating <= 5),
  platform_experience_rating integer NOT NULL CHECK (platform_experience_rating >= 1 AND platform_experience_rating <= 5),
  
  -- Comentarios (opcionales)
  what_you_valued text,
  what_to_improve text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT satisfaction_surveys_appointment_id_fkey 
    FOREIGN KEY (appointment_id) 
    REFERENCES public.appointments(id) 
    ON DELETE CASCADE,
  CONSTRAINT satisfaction_surveys_patient_id_fkey 
    FOREIGN KEY (patient_id) 
    REFERENCES public.patients(id) 
    ON DELETE CASCADE,
  CONSTRAINT satisfaction_surveys_professional_id_fkey 
    FOREIGN KEY (professional_id) 
    REFERENCES public.professionals(id) 
    ON DELETE CASCADE,
  
  -- Una encuesta por cita
  CONSTRAINT satisfaction_surveys_appointment_id_unique UNIQUE (appointment_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_appointment_id 
  ON public.satisfaction_surveys(appointment_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_patient_id 
  ON public.satisfaction_surveys(patient_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_professional_id 
  ON public.satisfaction_surveys(professional_id);

CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_created_at 
  ON public.satisfaction_surveys(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_satisfaction_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_satisfaction_surveys_updated_at_trigger
  BEFORE UPDATE ON public.satisfaction_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_satisfaction_surveys_updated_at();

-- Comentarios
COMMENT ON TABLE public.satisfaction_surveys IS 'Encuestas de satisfacción de los pacientes sobre sus citas. Una encuesta por cita.';
COMMENT ON COLUMN public.satisfaction_surveys.appointment_id IS 'ID de la cita asociada (formato APT-00000060)';
COMMENT ON COLUMN public.satisfaction_surveys.patient_id IS 'ID del paciente que completa la encuesta';
COMMENT ON COLUMN public.satisfaction_surveys.professional_id IS 'ID del profesional evaluado';
COMMENT ON COLUMN public.satisfaction_surveys.professional_empathy_rating IS 'Calificación de trato y empatía del profesional (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.professional_punctuality_rating IS 'Calificación de puntualidad del profesional (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.professional_satisfaction_rating IS 'Calificación general de satisfacción con el profesional (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.platform_booking_rating IS 'Calificación de facilidad para agendar la cita (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.platform_payment_rating IS 'Calificación de facilidad del proceso de pago (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.platform_experience_rating IS 'Calificación general de experiencia con la plataforma (1-5)';
COMMENT ON COLUMN public.satisfaction_surveys.what_you_valued IS 'Comentario sobre lo que más valoró el paciente (opcional)';
COMMENT ON COLUMN public.satisfaction_surveys.what_to_improve IS 'Comentario sobre qué se puede mejorar (opcional)';

-- Habilitar RLS
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Política: Los pacientes solo pueden ver sus propias encuestas
CREATE POLICY "Patients can view their own satisfaction surveys"
  ON public.satisfaction_surveys
  FOR SELECT
  USING (
    patient_id IN (
      SELECT p.id 
      FROM public.patients p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los pacientes solo pueden insertar encuestas para sus propias citas
CREATE POLICY "Patients can insert their own satisfaction surveys"
  ON public.satisfaction_surveys
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT p.id 
      FROM public.patients p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los pacientes solo pueden actualizar sus propias encuestas
CREATE POLICY "Patients can update their own satisfaction surveys"
  ON public.satisfaction_surveys
  FOR UPDATE
  USING (
    patient_id IN (
      SELECT p.id 
      FROM public.patients p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los profesionales pueden ver las encuestas de sus citas (solo lectura)
CREATE POLICY "Professionals can view surveys for their appointments"
  ON public.satisfaction_surveys
  FOR SELECT
  USING (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los administradores pueden ver todas las encuestas (solo lectura)
-- Nota: Los administradores tienen role = 1 en la tabla users
CREATE POLICY "Admins can view all satisfaction surveys"
  ON public.satisfaction_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users u
      WHERE u.user_id = auth.uid() 
      AND u.role = 1
    )
  );

-- Nota: Las operaciones administrativas también pueden usar createAdminServer que bypass RLS
