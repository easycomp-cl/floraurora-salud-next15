-- =============================================
-- Script para crear la tabla specialty_status
-- Esta tabla permite rastrear el estado activo/inactivo de las especialidades
-- ya que la tabla specialties no tiene un campo is_active
-- =============================================
-- Ejecutar este script en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.specialty_status (
  specialty_id bigint PRIMARY KEY REFERENCES public.specialties(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crear índice para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_specialty_status_is_active ON public.specialty_status(is_active);

-- Comentario en la tabla
COMMENT ON TABLE public.specialty_status IS 'Tabla auxiliar para rastrear el estado activo/inactivo de las especialidades';

