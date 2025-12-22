-- Migración para crear la tabla de fichas de ingreso
-- Esta tabla almacena la ficha de ingreso única por relación paciente-profesional
-- Se crea automáticamente en la primera cita del paciente con el profesional

CREATE TABLE IF NOT EXISTS public.patient_intake_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id integer NOT NULL,
  professional_id integer NOT NULL,
  
  -- Datos de identificación del paciente
  full_name text,
  rut text,
  birth_date date,
  age integer, -- Calculado automáticamente desde birth_date
  gender text,
  email text,
  phone text,
  address text,
  
  -- Información clínica inicial
  medical_history text, -- Historia médica/psicológica previa
  family_history text, -- Antecedentes familiares
  consultation_reason text, -- Motivo de consulta inicial
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT patient_intake_records_patient_id_fkey 
    FOREIGN KEY (patient_id) 
    REFERENCES public.patients(id) 
    ON DELETE CASCADE,
  CONSTRAINT patient_intake_records_professional_id_fkey 
    FOREIGN KEY (professional_id) 
    REFERENCES public.professionals(id) 
    ON DELETE CASCADE,
  
  -- Una ficha de ingreso única por relación paciente-profesional
  CONSTRAINT patient_intake_records_patient_professional_unique 
    UNIQUE (patient_id, professional_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_patient_intake_records_patient_id 
  ON public.patient_intake_records(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_intake_records_professional_id 
  ON public.patient_intake_records(professional_id);

CREATE INDEX IF NOT EXISTS idx_patient_intake_records_patient_professional 
  ON public.patient_intake_records(patient_id, professional_id);

CREATE INDEX IF NOT EXISTS idx_patient_intake_records_created_at 
  ON public.patient_intake_records(created_at DESC);

-- Función para calcular edad automáticamente desde birth_date
CREATE OR REPLACE FUNCTION calculate_age_from_birth_date(birth_date date)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM age(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_patient_intake_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Actualizar edad si cambió birth_date
  IF NEW.birth_date IS NOT NULL AND (OLD.birth_date IS NULL OR OLD.birth_date != NEW.birth_date) THEN
    NEW.age = calculate_age_from_birth_date(NEW.birth_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at y edad
CREATE TRIGGER update_patient_intake_records_updated_at_trigger
  BEFORE UPDATE ON public.patient_intake_records
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_intake_records_updated_at();

-- Trigger para calcular edad al insertar
CREATE OR REPLACE FUNCTION set_age_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birth_date IS NOT NULL AND NEW.age IS NULL THEN
    NEW.age = calculate_age_from_birth_date(NEW.birth_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_intake_records_age_on_insert
  BEFORE INSERT ON public.patient_intake_records
  FOR EACH ROW
  EXECUTE FUNCTION set_age_on_insert();

-- Comentarios
COMMENT ON TABLE public.patient_intake_records IS 'Fichas de ingreso de pacientes. Una ficha única por relación paciente-profesional, creada automáticamente en la primera cita.';
COMMENT ON COLUMN public.patient_intake_records.patient_id IS 'ID del paciente';
COMMENT ON COLUMN public.patient_intake_records.professional_id IS 'ID del profesional tratante';
COMMENT ON COLUMN public.patient_intake_records.full_name IS 'Nombre completo del paciente';
COMMENT ON COLUMN public.patient_intake_records.rut IS 'RUT del paciente';
COMMENT ON COLUMN public.patient_intake_records.birth_date IS 'Fecha de nacimiento del paciente';
COMMENT ON COLUMN public.patient_intake_records.age IS 'Edad calculada automáticamente desde birth_date';
COMMENT ON COLUMN public.patient_intake_records.gender IS 'Sexo/género del paciente';
COMMENT ON COLUMN public.patient_intake_records.email IS 'Correo electrónico del paciente';
COMMENT ON COLUMN public.patient_intake_records.phone IS 'Teléfono del paciente';
COMMENT ON COLUMN public.patient_intake_records.address IS 'Dirección del paciente';
COMMENT ON COLUMN public.patient_intake_records.medical_history IS 'Historia médica/psicológica previa del paciente';
COMMENT ON COLUMN public.patient_intake_records.family_history IS 'Antecedentes familiares relevantes';
COMMENT ON COLUMN public.patient_intake_records.consultation_reason IS 'Motivo de consulta inicial';

-- Habilitar RLS
ALTER TABLE public.patient_intake_records ENABLE ROW LEVEL SECURITY;

-- Política: Los profesionales solo pueden ver sus propias fichas de ingreso
CREATE POLICY "Professionals can view their own intake records"
  ON public.patient_intake_records
  FOR SELECT
  USING (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los profesionales solo pueden insertar fichas de ingreso para sus propios pacientes
CREATE POLICY "Professionals can insert their own intake records"
  ON public.patient_intake_records
  FOR INSERT
  WITH CHECK (
    professional_id IN (
      SELECT p.id 
      FROM public.professionals p
      INNER JOIN public.users u ON p.id = u.id
      WHERE u.user_id = auth.uid()
    )
  );

-- Política: Los profesionales solo pueden actualizar sus propias fichas de ingreso
CREATE POLICY "Professionals can update their own intake records"
  ON public.patient_intake_records
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

