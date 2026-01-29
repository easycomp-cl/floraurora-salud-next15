-- Migración para agregar campos clínicos a la tabla clinical_records
-- Estos campos se asociarán a cada cita individual

ALTER TABLE public.clinical_records
ADD COLUMN IF NOT EXISTS medical_history text,
ADD COLUMN IF NOT EXISTS family_history text,
ADD COLUMN IF NOT EXISTS consultation_reason text;

-- Comentarios
COMMENT ON COLUMN public.clinical_records.medical_history IS 'Historia médica/psicológica previa asociada a esta cita';
COMMENT ON COLUMN public.clinical_records.family_history IS 'Antecedentes familiares asociados a esta cita';
COMMENT ON COLUMN public.clinical_records.consultation_reason IS 'Motivo de consulta asociado a esta cita';
