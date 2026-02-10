-- =============================================
-- Script: Reiniciar secuencia de ID en tabla users
-- Descripción: Reinicia el contador para que el próximo ID sea 3 o 4
-- (o el siguiente seguro después del máximo existente)
-- Fecha: 2026-02-10
-- =============================================

-- ⚠️ ADVERTENCIA: Ejecutar solo en desarrollo/testing
-- NO elimina registros, solo ajusta la secuencia
-- Con IDs actuales 1, 2, 28 → próximo ID será 4 (configurable abajo)

BEGIN;

DO $$
DECLARE
    seq_full_name text;
    max_id bigint;
    next_id bigint := 4;  -- 👈 Cambiar a 3 si prefieres que el próximo sea 3
BEGIN
    -- Obtener el máximo ID actual
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM public.users;
    
    -- Usar el mayor entre (next_id configurado) y (max_id + 1) para evitar conflictos
    IF max_id >= next_id THEN
        next_id := max_id + 1;
        RAISE NOTICE '⚠️ max_id (%) >= next_id configurado. Usando % para evitar conflictos.', max_id, next_id;
    END IF;
    
    -- Obtener la secuencia (identity columns usan pg_get_serial_sequence)
    SELECT pg_get_serial_sequence('public.users', 'id') INTO seq_full_name;
    
    IF seq_full_name IS NOT NULL THEN
        EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', seq_full_name, next_id);
        RAISE NOTICE '✅ Secuencia % reiniciada. Próximo ID: % (max_id anterior: %)', seq_full_name, next_id, max_id;
    ELSE
        -- Fallback: buscar secuencia manualmente (users_id_seq para identity)
        seq_full_name := 'public.users_id_seq';
        BEGIN
            EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', seq_full_name, next_id);
            RAISE NOTICE '✅ Secuencia % reiniciada. Próximo ID: % (max_id anterior: %)', seq_full_name, next_id, max_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'No se encontró secuencia para users.id: %', SQLERRM;
        END;
    END IF;
END $$;

COMMIT;

-- Verificación
SELECT 
    'users' as tabla,
    COUNT(*) as total_registros,
    COALESCE(MAX(id), 0) as max_id_actual
FROM public.users;

SELECT last_value as proximo_id_secuencia 
FROM pg_sequences 
WHERE schemaname = 'public' AND sequencename = 'users_id_seq';
