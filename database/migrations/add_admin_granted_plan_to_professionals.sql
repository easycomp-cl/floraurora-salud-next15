-- =============================================
-- Columna para indicar si el plan mensual actual fue concedido por admin (sin pago)
-- Requerida para: conceder mes gratis, revocar y pasar a Plan Light
-- Ejecutar en Supabase SQL Editor
-- =============================================

ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS admin_granted_plan BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.professionals.admin_granted_plan IS 'Si true, el plan mensual actual fue concedido por admin sin pago. Permite revocar y pasar a Plan Light.';
