-- Agregar campo para certificados adicionales en professional_requests
-- Fecha: 2025-01-17

-- Agregar columna adicional_certificates_urls si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_requests' 
    AND column_name = 'additional_certificates_urls'
  ) THEN
    ALTER TABLE public.professional_requests
    ADD COLUMN additional_certificates_urls TEXT;
    
    COMMENT ON COLUMN public.professional_requests.additional_certificates_urls IS 
    'JSON array de URLs de certificados adicionales subidos por el profesional';
  END IF;
END $$;

