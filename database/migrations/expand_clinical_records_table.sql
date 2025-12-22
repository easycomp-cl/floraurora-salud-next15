-- Migración para expandir la tabla clinical_records con nuevos campos
-- Esta migración agrega los campos requeridos según las especificaciones del módulo

-- Agregar nuevos campos si no existen
DO $$ 
BEGIN
    -- Campo: session_development (Desarrollo de la sesión)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'session_development'
    ) THEN
        ALTER TABLE public.clinical_records 
        ADD COLUMN session_development text;
        
        COMMENT ON COLUMN public.clinical_records.session_development IS 'Desarrollo de la sesión';
    END IF;

    -- Campo: treatment_applied (Tratamiento aplicado)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'treatment_applied'
    ) THEN
        ALTER TABLE public.clinical_records 
        ADD COLUMN treatment_applied text;
        
        COMMENT ON COLUMN public.clinical_records.treatment_applied IS 'Tratamiento aplicado durante la sesión';
    END IF;

    -- Campo: next_session_indications (Indicaciones para próxima sesión)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'next_session_indications'
    ) THEN
        ALTER TABLE public.clinical_records 
        ADD COLUMN next_session_indications text;
        
        COMMENT ON COLUMN public.clinical_records.next_session_indications IS 'Indicaciones para la próxima sesión';
    END IF;

    -- Renombrar diagnostic_hypothesis a diagnosis si existe y diagnosis no existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'diagnostic_hypothesis'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'diagnosis'
    ) THEN
        ALTER TABLE public.clinical_records 
        RENAME COLUMN diagnostic_hypothesis TO diagnosis;
        
        COMMENT ON COLUMN public.clinical_records.diagnosis IS 'Diagnóstico o hipótesis diagnóstica';
    END IF;

    -- Si diagnostic_hypothesis existe pero diagnosis también existe, mantener ambos
    -- pero actualizar comentarios
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clinical_records' 
        AND column_name = 'diagnosis'
    ) THEN
        COMMENT ON COLUMN public.clinical_records.diagnosis IS 'Diagnóstico o hipótesis diagnóstica';
    END IF;
END $$;

-- Actualizar comentarios de campos existentes
COMMENT ON COLUMN public.clinical_records.notes IS 'Notas generales de la sesión';
COMMENT ON COLUMN public.clinical_records.evolution IS 'Evolución del paciente durante la sesión';
COMMENT ON COLUMN public.clinical_records.observations IS 'Observaciones clínicas relevantes de la sesión';

-- Actualizar comentario de la tabla
COMMENT ON TABLE public.clinical_records IS 'Fichas clínicas de evolución por sesión. Una ficha por cita, vinculada al profesional y paciente. Incluye desarrollo de sesión, diagnóstico, tratamiento aplicado e indicaciones.';

