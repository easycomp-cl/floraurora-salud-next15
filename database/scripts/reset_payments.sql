-- =============================================
-- Script: Resetear tabla de pagos (payments)
-- Descripción: Elimina todos los pagos y reinicia el contador
-- Fecha: 2025-01-31
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los pagos de la base de datos
-- Ejecutar solo en desarrollo/testing

BEGIN;

-- 1. Eliminar todos los pagos
DELETE FROM public.payments;

-- 2. Reiniciar secuencia si existe
DO $$
DECLARE
    seq_name text;
BEGIN
    SELECT sequence_name INTO seq_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    AND sequence_name LIKE '%payment%'
    AND sequence_name NOT LIKE '%subscription%';
    
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
        RAISE NOTICE 'Secuencia % reiniciada a 1', seq_name;
    ELSE
        RAISE NOTICE 'No se encontró secuencia para payments.';
    END IF;
END $$;

COMMIT;

-- Mostrar resumen
SELECT 
    'payments' as tabla,
    COUNT(*) as registros_restantes
FROM public.payments;
