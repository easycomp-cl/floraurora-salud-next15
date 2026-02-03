-- =============================================
-- Script: Resetear múltiples tablas comunes
-- Descripción: Elimina datos y reinicia contadores de tablas comunes
-- Fecha: 2025-01-31
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará datos de múltiples tablas
-- Ejecutar solo en desarrollo/testing

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando limpieza de tablas...';
    RAISE NOTICE '========================================';
END $$;

-- 1. RESETEAR CITAS Y DATOS RELACIONADOS
DO $$
BEGIN
    RAISE NOTICE '1. Eliminando citas y datos relacionados...';
END $$;

-- Eliminar registros relacionados primero
DELETE FROM public.clinical_records WHERE appointment_id IS NOT NULL;
DELETE FROM public.satisfaction_surveys WHERE appointment_id IS NOT NULL;
DELETE FROM public.bhe_jobs WHERE appointment_id IS NOT NULL;
DELETE FROM public.payments WHERE appointment_id IS NOT NULL;
DELETE FROM public.appointments;

-- 2. RESETEAR PAGOS
DO $$
BEGIN
    RAISE NOTICE '2. Eliminando pagos...';
END $$;
DELETE FROM public.payments;

-- 3. RESETEAR JOBS BHE
DO $$
BEGIN
    RAISE NOTICE '3. Eliminando jobs BHE...';
END $$;
DELETE FROM public.bhe_jobs;

-- 4. RESETEAR REGISTROS CLÍNICOS
DO $$
BEGIN
    RAISE NOTICE '4. Eliminando registros clínicos...';
END $$;
DELETE FROM public.clinical_record_access_logs;
DELETE FROM public.clinical_records;

-- 5. RESETEAR ENCUESTAS DE SATISFACCIÓN
DO $$
BEGIN
    RAISE NOTICE '5. Eliminando encuestas de satisfacción...';
END $$;
DELETE FROM public.satisfaction_surveys;

-- 6. RESETEAR CITAS PENDIENTES
DO $$
BEGIN
    RAISE NOTICE '6. Eliminando citas pendientes...';
END $$;
DELETE FROM public.pending_appointments;

-- 7. RESETEAR REGISTROS DE INGRESO DE PACIENTES
DO $$
BEGIN
    RAISE NOTICE '7. Eliminando registros de ingreso...';
END $$;
DELETE FROM public.patient_intake_records;

-- 8. REINICIAR TODAS LAS SECUENCIAS ENCONTRADAS
DO $$
BEGIN
    RAISE NOTICE '8. Reiniciando secuencias...';
END $$;

DO $$
DECLARE
    seq_record RECORD;
    sequences_to_reset TEXT[] := ARRAY[
        '%appointment%',
        '%payment%',
        '%clinical%',
        '%satisfaction%',
        '%admin_log%',
        '%carousel%',
        '%therapeutic%',
        '%system_config%',
        '%subscription_payment%'
    ];
    pattern TEXT;
BEGIN
    FOR pattern IN SELECT unnest(sequences_to_reset) LOOP
        FOR seq_record IN 
            SELECT sequence_name
            FROM information_schema.sequences
            WHERE sequence_schema = 'public'
            AND sequence_name ILIKE pattern
            AND sequence_name NOT LIKE '%_id_seq' -- Evitar duplicados
        LOOP
            BEGIN
                EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_record.sequence_name);
                RAISE NOTICE '✅ Secuencia % reiniciada a 1', seq_record.sequence_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ No se pudo reiniciar secuencia %: %', seq_record.sequence_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

COMMIT;

-- 9. MOSTRAR RESUMEN DE TABLAS LIMPIADAS
SELECT 
    'appointments' as tabla,
    COUNT(*) as registros_restantes
FROM public.appointments
UNION ALL
SELECT 
    'payments',
    COUNT(*)
FROM public.payments
UNION ALL
SELECT 
    'bhe_jobs',
    COUNT(*)
FROM public.bhe_jobs
UNION ALL
SELECT 
    'clinical_records',
    COUNT(*)
FROM public.clinical_records
UNION ALL
SELECT 
    'satisfaction_surveys',
    COUNT(*)
FROM public.satisfaction_surveys
UNION ALL
SELECT 
    'pending_appointments',
    COUNT(*)
FROM public.pending_appointments
UNION ALL
SELECT 
    'patient_intake_records',
    COUNT(*)
FROM public.patient_intake_records
ORDER BY tabla;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Proceso de limpieza completado';
    RAISE NOTICE '========================================';
END $$;
