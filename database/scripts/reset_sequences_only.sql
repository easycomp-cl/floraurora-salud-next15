-- =============================================
-- Script: Reiniciar solo las secuencias (sin eliminar datos)
-- Descripción: Reinicia todas las secuencias a 1 sin eliminar registros
-- Fecha: 2025-01-31
-- =============================================

-- Este script solo reinicia las secuencias, NO elimina datos
-- Útil cuando quieres mantener los datos pero reiniciar los contadores

BEGIN;

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
        '%subscription_payment%',
        '%access_log%'
    ];
    pattern TEXT;
    reset_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Buscando secuencias para reiniciar...';
    
    FOR pattern IN SELECT unnest(sequences_to_reset) LOOP
        FOR seq_record IN 
            SELECT sequence_name
            FROM information_schema.sequences
            WHERE sequence_schema = 'public'
            AND sequence_name ILIKE pattern
        LOOP
            BEGIN
                -- Obtener el valor actual antes de reiniciar
                EXECUTE format('SELECT last_value FROM %I', seq_record.sequence_name) INTO seq_record;
                
                -- Reiniciar la secuencia
                EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_record.sequence_name);
                reset_count := reset_count + 1;
                RAISE NOTICE '✅ Secuencia % reiniciada a 1', seq_record.sequence_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '⚠️ No se pudo reiniciar secuencia %: %', seq_record.sequence_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Total de secuencias reiniciadas: %', reset_count;
END $$;

COMMIT;

-- Mostrar todas las secuencias y sus valores actuales
SELECT 
    sequence_name as secuencia,
    last_value as ultimo_valor,
    CASE 
        WHEN last_value = 1 THEN '✅ Reiniciada'
        ELSE '⚠️ Valor actual: ' || last_value::text
    END as estado
FROM information_schema.sequences s
JOIN pg_sequences ps ON s.sequence_name = ps.sequencename
WHERE s.sequence_schema = 'public'
ORDER BY sequence_name;
