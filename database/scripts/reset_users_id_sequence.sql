-- =============================================
-- Script: Reiniciar secuencia de ID en tabla users
-- La secuencia se llama "Users_id_seq" (U mayúscula)
-- =============================================

-- ⚠️ ADVERTENCIA: Ejecutar solo en desarrollo/testing
-- NO elimina registros, solo ajusta la secuencia

-- 👇 CAMBIA EL 4 por el valor que quieras (será el próximo ID asignado)
ALTER SEQUENCE public."Users_id_seq" RESTART WITH 4;

-- Verificación
SELECT 
    'users' as tabla,
    COUNT(*) as total_registros,
    COALESCE(MAX(id), 0) as max_id_actual
FROM public.users;

SELECT last_value as proximo_id_secuencia 
FROM public."Users_id_seq";
