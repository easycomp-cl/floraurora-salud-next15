-- =============================================
-- Script: Resetear tabla de jobs BHE (bhe_jobs)
-- Descripción: Elimina todos los jobs de BHE y reinicia el contador
-- Fecha: 2025-01-31
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los jobs de BHE de la base de datos
-- Ejecutar solo en desarrollo/testing

BEGIN;

-- 1. Eliminar todos los jobs de BHE
DELETE FROM public.bhe_jobs;

-- 2. Reiniciar secuencia si existe
-- Nota: bhe_jobs usa UUID como ID, no hay secuencia que reiniciar
DO $$
BEGIN
    RAISE NOTICE 'Tabla bhe_jobs usa UUID como ID, no requiere reinicio de secuencia.';
END $$;

COMMIT;

-- Mostrar resumen
SELECT 
    'bhe_jobs' as tabla,
    COUNT(*) as registros_restantes
FROM public.bhe_jobs;
