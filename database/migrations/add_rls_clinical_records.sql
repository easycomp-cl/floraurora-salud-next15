-- Migración para agregar Row Level Security (RLS) a la tabla clinical_records
-- Las políticas permiten que:
-- 1. Los profesionales puedan ver y editar sus propios registros clínicos
-- 2. Los administradores puedan ver y editar todos los registros
-- 3. Los pacientes puedan ver sus propios registros clínicos (solo lectura)

-- Habilitar RLS en la tabla
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

-- Política para profesionales: pueden ver y editar registros clínicos de sus propias citas
CREATE POLICY "Professionals can view their own clinical records"
  ON public.clinical_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.appointments a ON a.professional_id = u.id
      WHERE u.user_id = auth.uid()
        AND u.role = 3
        AND a.id = clinical_records.appointment_id
        AND a.professional_id = clinical_records.professional_id
    )
  );

CREATE POLICY "Professionals can insert their own clinical records"
  ON public.clinical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.appointments a ON a.professional_id = u.id
      WHERE u.user_id = auth.uid()
        AND u.role = 3
        AND a.id = clinical_records.appointment_id
        AND a.professional_id = clinical_records.professional_id
    )
  );

CREATE POLICY "Professionals can update their own clinical records"
  ON public.clinical_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.appointments a ON a.professional_id = u.id
      WHERE u.user_id = auth.uid()
        AND u.role = 3
        AND a.id = clinical_records.appointment_id
        AND a.professional_id = clinical_records.professional_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.appointments a ON a.professional_id = u.id
      WHERE u.user_id = auth.uid()
        AND u.role = 3
        AND a.id = clinical_records.appointment_id
        AND a.professional_id = clinical_records.professional_id
    )
  );

-- Política para administradores: pueden ver y editar todos los registros clínicos
CREATE POLICY "Admins can view all clinical records"
  ON public.clinical_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role = 1
    )
  );

CREATE POLICY "Admins can insert all clinical records"
  ON public.clinical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role = 1
    )
  );

CREATE POLICY "Admins can update all clinical records"
  ON public.clinical_records
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role = 1
    )
  );

CREATE POLICY "Admins can delete all clinical records"
  ON public.clinical_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.user_id = auth.uid()
        AND u.role = 1
    )
  );

-- Política para pacientes: pueden ver sus propios registros clínicos (solo lectura)
CREATE POLICY "Patients can view their own clinical records"
  ON public.clinical_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.appointments a ON a.patient_id = u.id
      WHERE u.user_id = auth.uid()
        AND u.role = 2
        AND a.id = clinical_records.appointment_id
        AND a.patient_id = clinical_records.patient_id
    )
  );

-- Comentarios
COMMENT ON POLICY "Professionals can view their own clinical records" ON public.clinical_records IS 'Permite a los profesionales ver los registros clínicos de sus propias citas';
COMMENT ON POLICY "Professionals can insert their own clinical records" ON public.clinical_records IS 'Permite a los profesionales crear registros clínicos para sus propias citas';
COMMENT ON POLICY "Professionals can update their own clinical records" ON public.clinical_records IS 'Permite a los profesionales actualizar los registros clínicos de sus propias citas';
COMMENT ON POLICY "Admins can view all clinical records" ON public.clinical_records IS 'Permite a los administradores ver todos los registros clínicos';
COMMENT ON POLICY "Admins can insert all clinical records" ON public.clinical_records IS 'Permite a los administradores crear registros clínicos';
COMMENT ON POLICY "Admins can update all clinical records" ON public.clinical_records IS 'Permite a los administradores actualizar todos los registros clínicos';
COMMENT ON POLICY "Admins can delete all clinical records" ON public.clinical_records IS 'Permite a los administradores eliminar registros clínicos';
COMMENT ON POLICY "Patients can view their own clinical records" ON public.clinical_records IS 'Permite a los pacientes ver sus propios registros clínicos (solo lectura)';
