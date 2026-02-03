-- =============================================
-- Script: Resetear tabla de citas (appointments)
-- Descripción: Elimina todas las citas y reinicia el contador
-- Fecha: 2025-01-31
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará TODAS las citas de la base de datos
-- Ejecutar solo en desarrollo/testing

BEGIN;

-- 1. Eliminar registros relacionados primero (por foreign keys)
-- Eliminar registros clínicos asociados a citas
DELETE FROM public.clinical_records WHERE appointment_id IS NOT NULL;

-- Eliminar encuestas de satisfacción asociadas a citas
DELETE FROM public.satisfaction_surveys WHERE appointment_id IS NOT NULL;

-- Eliminar jobs de BHE asociados a citas
DELETE FROM public.bhe_jobs WHERE appointment_id IS NOT NULL;

-- Eliminar pagos asociados a citas
DELETE FROM public.payments WHERE appointment_id IS NOT NULL;

-- 2. Eliminar todas las citas
DELETE FROM public.appointments;

-- 3. Si existe una secuencia para appointments, reiniciarla
-- Nota: Si el ID se genera con una función/trigger, puede que necesites ajustar esto
DO $$
DECLARE
    seq_name text;
BEGIN
    -- Buscar si existe una secuencia relacionada con appointments
    SELECT sequence_name INTO seq_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    AND sequence_name LIKE '%appointment%';
    
    IF seq_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
        RAISE NOTICE 'Secuencia % reiniciada a 1', seq_name;
    ELSE
        RAISE NOTICE 'No se encontró secuencia para appointments. El ID puede generarse de otra forma.';
    END IF;
END $$;

-- 4. Verificar que la tabla esté vacía
DO $$
DECLARE
    count_appointments integer;
BEGIN
    SELECT COUNT(*) INTO count_appointments FROM public.appointments;
    IF count_appointments > 0 THEN
        RAISE EXCEPTION 'Aún quedan % citas en la tabla', count_appointments;
    ELSE
        RAISE NOTICE '✅ Tabla appointments limpiada exitosamente. Total de registros: %', count_appointments;
    END IF;
END $$;

COMMIT;

-- Mostrar resumen
SELECT 
    'appointments' as tabla,
    COUNT(*) as registros_restantes
FROM public.appointments;
