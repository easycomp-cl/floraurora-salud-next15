-- Agregar columnas para plan y pago a la tabla professionals

-- Columna para el tipo de plan (commission o monthly)
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('commission', 'monthly')) DEFAULT NULL;

-- Columna para la fecha del último pago mensual exitoso
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS last_monthly_payment_date TIMESTAMPTZ DEFAULT NULL;

-- Columna para la fecha de expiración del plan mensual
-- Si esta fecha está en el futuro, el profesional tiene acceso activo
-- Si es NULL o está en el pasado, el profesional no tiene acceso (inactivo)
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS monthly_plan_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.professionals.plan_type IS 'Tipo de plan: commission (comisión) o monthly (mensual). Si es commission, no requiere pagos mensuales. Si es monthly, requiere pago mensual activo.';
COMMENT ON COLUMN public.professionals.last_monthly_payment_date IS 'Fecha del último pago mensual exitoso realizado';
COMMENT ON COLUMN public.professionals.monthly_plan_expires_at IS 'Fecha de expiración del plan mensual. Si está en el futuro, el profesional tiene acceso. Si es NULL o está en el pasado, el profesional está inactivo y no tiene acceso.';

