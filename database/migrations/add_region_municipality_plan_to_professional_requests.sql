-- =============================================
-- Agregar region_id, municipality_id y plan_type a professional_requests
-- Requerido para: guardar región/comuna y plan seleccionado en el registro
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Columna region_id (FK a regions)
ALTER TABLE public.professional_requests
ADD COLUMN IF NOT EXISTS region_id INTEGER NULL REFERENCES public.regions(id);

COMMENT ON COLUMN public.professional_requests.region_id IS 'ID de la región del profesional (tabla regions)';

-- Columna municipality_id (FK a municipalities)
ALTER TABLE public.professional_requests
ADD COLUMN IF NOT EXISTS municipality_id INTEGER NULL REFERENCES public.municipalities(id);

COMMENT ON COLUMN public.professional_requests.municipality_id IS 'ID de la comuna del profesional (tabla municipalities)';

-- Columna plan_type: 'commission' (Plan Light) o 'monthly' (Plan Premium)
ALTER TABLE public.professional_requests
ADD COLUMN IF NOT EXISTS plan_type TEXT NULL CHECK (plan_type IN ('commission', 'monthly'));

COMMENT ON COLUMN public.professional_requests.plan_type IS 'Tipo de plan seleccionado: commission (Plan Light) o monthly (Plan Premium)';
