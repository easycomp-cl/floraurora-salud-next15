-- =============================================
-- Script: Resetear tabla de registros clínicos (clinical_records)
-- Descripción: Elimina todos los registros clínicos y reinicia el contador
-- Fecha: 2025-01-31
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los registros clínicos de la base de datos
-- Ejecutar solo en desarrollo/testing

BEGIN;

-- 1. Eliminar logs de acceso a registros clínicos primero
DELETE FROM public.clinical_record_access_logs;

-- 2. Eliminar todos los registros clínicos
DELETE FROM public.clinical_records;

-- 3. Reiniciar secuencia si existe
DO $$
DECLARE
    seq_name text;
BEGIN
    SELECT sequence_name INTO seq_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    AND sequence_name LIKE '%clinical%';
    
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
        RAISE NOTICE 'Secuencia % reiniciada a 1', seq_name;
    ELSE
        RAISE NOTICE 'No se encontró secuencia para clinical_records.';
    END IF;
END $$;

COMMIT;

-- Mostrar resumen
SELECT 
    'clinical_records' as tabla,
    COUNT(*) as registros_restantes
FROM public.clinical_records;
