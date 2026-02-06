-- Agregar campo para activar precio promocional manualmente por profesional
-- Este campo permite que un administrador active el precio promocional para un profesional específico
-- independientemente de si ya pasó los meses promocionales o no

ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS use_promotional_price BOOLEAN DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN public.professionals.use_promotional_price IS 'Si es true, el profesional pagará el precio promocional independientemente de su historial de pagos. Puede ser activado manualmente por un administrador.';

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_professionals_use_promotional_price 
ON public.professionals(use_promotional_price) 
WHERE use_promotional_price = true;
