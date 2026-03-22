-- =============================================
-- Agregar sii_bhe_verified a professionals
-- Indica si el profesional está verificado en SII para emisión de BHE por Rakidium
-- =============================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS sii_bhe_verified BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.professionals.sii_bhe_verified IS 'Si true, el profesional está verificado en SII y autorizado para que Rakidium emita BHE a su nombre para los pacientes. Debe ser activado por admin tras validar el proceso de registro SII.';

CREATE INDEX IF NOT EXISTS idx_professionals_sii_bhe_verified
  ON public.professionals(sii_bhe_verified)
  WHERE sii_bhe_verified = true;
