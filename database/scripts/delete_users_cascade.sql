-- =============================================
-- Script: Eliminar usuarios con CASCADE (pacientes y profesionales)
-- Descripción: Elimina usuarios que son pacientes o profesionales con eliminación en cascada
-- Fecha: 2026-02-05
-- =============================================

-- ⚠️ ADVERTENCIA: Este script eliminará usuarios y todos sus datos relacionados
-- Ejecutar solo en desarrollo/testing
-- 
-- Este script elimina usuarios que tienen rol de paciente (role = 2) o profesional (role = 3)
-- La eliminación en cascada eliminará automáticamente:
-- - Registros en la tabla patients (si existe foreign key con CASCADE)
-- - Registros en la tabla professionals (si existe foreign key con CASCADE)
-- - Todos los datos relacionados (citas, pagos, registros clínicos, etc.)

BEGIN;

DO $$
DECLARE
    deleted_count integer;
    patients_count integer;
    professionals_count integer;
    user_ids_to_delete integer[];
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando eliminación de usuarios...';
    RAISE NOTICE '========================================';
    
    -- Contar usuarios antes de eliminar
    SELECT COUNT(*) INTO patients_count 
    FROM public.users 
    WHERE role = 2; -- Pacientes
    
    SELECT COUNT(*) INTO professionals_count 
    FROM public.users 
    WHERE role = 3; -- Profesionales
    
    RAISE NOTICE 'Usuarios a eliminar:';
    RAISE NOTICE '  - Pacientes (role = 2): %', patients_count;
    RAISE NOTICE '  - Profesionales (role = 3): %', professionals_count;
    
    -- Obtener los IDs de usuarios a eliminar
    SELECT ARRAY_AGG(id) INTO user_ids_to_delete
    FROM public.users 
    WHERE role IN (2, 3);
    
    -- Verificar si hay usuarios para eliminar
    IF user_ids_to_delete IS NULL OR array_length(user_ids_to_delete, 1) IS NULL THEN
        RAISE NOTICE 'No hay usuarios para eliminar. Finalizando...';
        RETURN;
    END IF;
    
    -- 1. Eliminar o actualizar registros relacionados que tienen foreign keys sin CASCADE
    -- Verificar y limpiar referencias solo si las tablas existen
    
    -- professional_requests
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'professional_requests') THEN
        RAISE NOTICE '1. Limpiando referencias en professional_requests...';
        UPDATE public.professional_requests 
        SET reviewed_by = NULL 
        WHERE reviewed_by = ANY(user_ids_to_delete);
    ELSE
        RAISE NOTICE '1. Tabla professional_requests no existe, omitiendo...';
    END IF;
    
    -- system_configurations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_configurations') THEN
        RAISE NOTICE '2. Limpiando referencias en system_configurations...';
        UPDATE public.system_configurations 
        SET created_by = NULL 
        WHERE created_by = ANY(user_ids_to_delete);
        
        UPDATE public.system_configurations 
        SET updated_by = NULL 
        WHERE updated_by = ANY(user_ids_to_delete);
    ELSE
        RAISE NOTICE '2. Tabla system_configurations no existe, omitiendo...';
    END IF;
    
    -- home_carousel_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'home_carousel_items') THEN
        RAISE NOTICE '3. Limpiando referencias en home_carousel_items...';
        UPDATE public.home_carousel_items 
        SET updated_by = NULL 
        WHERE updated_by = ANY(user_ids_to_delete);
    ELSE
        RAISE NOTICE '3. Tabla home_carousel_items no existe, omitiendo...';
    END IF;
    
    -- notification_templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_templates') THEN
        RAISE NOTICE '4. Limpiando referencias en notification_templates...';
        UPDATE public.notification_templates 
        SET updated_by = NULL 
        WHERE updated_by = ANY(user_ids_to_delete);
    ELSE
        RAISE NOTICE '4. Tabla notification_templates no existe, omitiendo...';
    END IF;
    
    -- system_settings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        RAISE NOTICE '5. Limpiando referencias en system_settings...';
        UPDATE public.system_settings 
        SET updated_by = NULL 
        WHERE updated_by = ANY(user_ids_to_delete);
    ELSE
        RAISE NOTICE '5. Tabla system_settings no existe, omitiendo...';
    END IF;
    
    -- admin_logs.actor_id ya tiene ON DELETE SET NULL, así que se manejará automáticamente
    
    -- 2. Eliminar usuarios que son pacientes o profesionales
    -- La eliminación en cascada se encargará de eliminar los registros relacionados
    RAISE NOTICE '6. Eliminando usuarios...';
    DELETE FROM public.users 
    WHERE role IN (2, 3); -- 2 = paciente, 3 = profesional
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Usuarios eliminados: %', deleted_count;
    RAISE NOTICE '========================================';
    
    -- Verificar que se eliminaron correctamente
    IF deleted_count = (patients_count + professionals_count) THEN
        RAISE NOTICE '✅ Eliminación completada correctamente';
    ELSE
        RAISE WARNING '⚠️ Número de eliminaciones no coincide. Esperado: %, Eliminado: %', 
            (patients_count + professionals_count), deleted_count;
    END IF;
END $$;

COMMIT;

-- Mostrar resumen de usuarios restantes
SELECT 
    'users' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE role = 1) as administradores,
    COUNT(*) FILTER (WHERE role = 2) as pacientes,
    COUNT(*) FILTER (WHERE role = 3) as profesionales
FROM public.users;

-- Verificar que no queden pacientes o profesionales
DO $$
DECLARE
    remaining_patients integer;
    remaining_professionals integer;
BEGIN
    SELECT COUNT(*) INTO remaining_patients 
    FROM public.users 
    WHERE role = 2;
    
    SELECT COUNT(*) INTO remaining_professionals 
    FROM public.users 
    WHERE role = 3;
    
    IF remaining_patients > 0 OR remaining_professionals > 0 THEN
        RAISE WARNING '⚠️ Aún quedan usuarios: % pacientes, % profesionales', 
            remaining_patients, remaining_professionals;
    ELSE
        RAISE NOTICE '✅ No quedan pacientes ni profesionales en la tabla users';
    END IF;
END $$;
