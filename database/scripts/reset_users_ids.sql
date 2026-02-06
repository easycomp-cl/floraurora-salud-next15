-- =============================================
-- Script: Resetear IDs de la tabla users
-- Descripción: Reinicia el contador de IDs de la tabla users desde el 1
-- Fecha: 2026-02-05
-- =============================================

-- ⚠️ ADVERTENCIA: Este script reiniciará el contador de IDs de users
-- Ejecutar solo en desarrollo/testing
-- NOTA: Esto NO elimina registros, solo reinicia la secuencia

BEGIN;

DO $$
DECLARE
    seq_name text;
    max_id bigint;
    seq_full_name text;
BEGIN
    -- Obtener el máximo ID actual para referencia
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.users;
    
    -- Buscar la secuencia usando pg_get_serial_sequence (método más confiable)
    SELECT pg_get_serial_sequence('public.users', 'id') INTO seq_full_name;
    
    IF seq_full_name IS NOT NULL THEN
        -- Usar el nombre completo de la secuencia (incluye esquema)
        -- pg_get_serial_sequence devuelve 'schema.sequence_name'
        EXECUTE format('ALTER SEQUENCE %s RESTART WITH 1', seq_full_name);
        RAISE NOTICE '✅ Secuencia % reiniciada a 1 (ID máximo anterior: %)', seq_full_name, max_id;
    ELSE
        -- Si no se encuentra con pg_get_serial_sequence, intentar buscar manualmente
        SELECT sequence_name INTO seq_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
        AND sequence_name ILIKE 'users%id%seq'
        LIMIT 1;
        
        IF seq_name IS NOT NULL THEN
            -- Construir el nombre completo con esquema
            seq_full_name := 'public.' || quote_ident(seq_name);
            EXECUTE format('ALTER SEQUENCE %s RESTART WITH 1', seq_full_name);
            RAISE NOTICE '✅ Secuencia % reiniciada a 1 (ID máximo anterior: %)', seq_full_name, max_id;
        ELSE
            RAISE NOTICE '⚠️ No se encontró secuencia para users.id. El ID puede generarse de otra forma o la tabla puede estar vacía.';
            RAISE NOTICE '   ID máximo actual: %', max_id;
        END IF;
    END IF;
END $$;

COMMIT;

-- Verificar el estado actual
SELECT 
    'users' as tabla,
    COUNT(*) as total_registros,
    COALESCE(MAX(id), 0) as max_id_actual,
    COALESCE(MIN(id), 0) as min_id_actual
FROM public.users;
