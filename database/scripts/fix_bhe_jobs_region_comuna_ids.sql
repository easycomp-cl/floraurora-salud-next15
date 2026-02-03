-- =============================================
-- Script: Corregir regiones y comunas en bhe_jobs
-- Descripción: Convierte nombres de regiones/comunas a IDs numéricos en la tabla bhe_jobs
-- Fecha: 2026-02-03
-- Problema: Los jobs de BHE tienen nombres de regiones/comunas en lugar de IDs numéricos
-- =============================================

-- ⚠️ IMPORTANTE: Este script corrige los datos existentes en bhe_jobs
-- Ejecutar en producción después de verificar los datos

BEGIN;

DO $$
DECLARE
    job_record RECORD;
    region_id_found INTEGER;
    comuna_id_found INTEGER;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando corrección de regiones/comunas en bhe_jobs...';
    RAISE NOTICE '========================================';

    -- Iterar sobre todos los jobs que tienen region/comuna como texto
    FOR job_record IN 
        SELECT 
            id,
            professional_region,
            professional_comuna,
            patient_region,
            patient_comuna
        FROM public.bhe_jobs
        WHERE 
            -- Buscar jobs donde region/comuna es texto (no numérico)
            (professional_region IS NOT NULL AND professional_region::text ~ '^[^0-9]')
            OR (professional_comuna IS NOT NULL AND professional_comuna::text ~ '^[^0-9]')
            OR (patient_region IS NOT NULL AND patient_region::text ~ '^[^0-9]')
            OR (patient_comuna IS NOT NULL AND patient_comuna::text ~ '^[^0-9]')
    LOOP
        BEGIN
            -- Corregir professional_region si es texto
            IF job_record.professional_region IS NOT NULL 
               AND job_record.professional_region::text ~ '^[^0-9]' THEN
                
                SELECT id INTO region_id_found
                FROM public.regions
                WHERE name ILIKE job_record.professional_region::text
                LIMIT 1;
                
                IF region_id_found IS NOT NULL THEN
                    UPDATE public.bhe_jobs
                    SET professional_region = region_id_found
                    WHERE id = job_record.id;
                    
                    RAISE NOTICE 'Job %: professional_region "%" -> %', 
                        job_record.id, 
                        job_record.professional_region, 
                        region_id_found;
                ELSE
                    RAISE WARNING 'Job %: No se encontró región "%"', 
                        job_record.id, 
                        job_record.professional_region;
                    error_count := error_count + 1;
                END IF;
            END IF;

            -- Corregir professional_comuna si es texto
            IF job_record.professional_comuna IS NOT NULL 
               AND job_record.professional_comuna::text ~ '^[^0-9]' THEN
                
                SELECT id INTO comuna_id_found
                FROM public.municipalities
                WHERE name ILIKE job_record.professional_comuna::text
                LIMIT 1;
                
                IF comuna_id_found IS NOT NULL THEN
                    UPDATE public.bhe_jobs
                    SET professional_comuna = comuna_id_found
                    WHERE id = job_record.id;
                    
                    RAISE NOTICE 'Job %: professional_comuna "%" -> %', 
                        job_record.id, 
                        job_record.professional_comuna, 
                        comuna_id_found;
                ELSE
                    RAISE WARNING 'Job %: No se encontró comuna "%"', 
                        job_record.id, 
                        job_record.professional_comuna;
                    error_count := error_count + 1;
                END IF;
            END IF;

            -- Corregir patient_region si es texto
            IF job_record.patient_region IS NOT NULL 
               AND job_record.patient_region::text ~ '^[^0-9]' THEN
                
                SELECT id INTO region_id_found
                FROM public.regions
                WHERE name ILIKE job_record.patient_region::text
                LIMIT 1;
                
                IF region_id_found IS NOT NULL THEN
                    UPDATE public.bhe_jobs
                    SET patient_region = region_id_found
                    WHERE id = job_record.id;
                    
                    RAISE NOTICE 'Job %: patient_region "%" -> %', 
                        job_record.id, 
                        job_record.patient_region, 
                        region_id_found;
                ELSE
                    RAISE WARNING 'Job %: No se encontró región "%"', 
                        job_record.id, 
                        job_record.patient_region;
                    error_count := error_count + 1;
                END IF;
            END IF;

            -- Corregir patient_comuna si es texto
            IF job_record.patient_comuna IS NOT NULL 
               AND job_record.patient_comuna::text ~ '^[^0-9]' THEN
                
                SELECT id INTO comuna_id_found
                FROM public.municipalities
                WHERE name ILIKE job_record.patient_comuna::text
                LIMIT 1;
                
                IF comuna_id_found IS NOT NULL THEN
                    UPDATE public.bhe_jobs
                    SET patient_comuna = comuna_id_found
                    WHERE id = job_record.id;
                    
                    RAISE NOTICE 'Job %: patient_comuna "%" -> %', 
                        job_record.id, 
                        job_record.patient_comuna, 
                        comuna_id_found;
                ELSE
                    RAISE WARNING 'Job %: No se encontró comuna "%"', 
                        job_record.id, 
                        job_record.patient_comuna;
                    error_count := error_count + 1;
                END IF;
            END IF;

            updated_count := updated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error procesando job %: %', job_record.id, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Corrección completada.';
    RAISE NOTICE 'Jobs procesados: %', updated_count;
    RAISE NOTICE 'Errores encontrados: %', error_count;
    RAISE NOTICE '========================================';
END $$;

-- Verificar resultados
DO $$
DECLARE
    text_regions_count INTEGER;
    text_comunas_count INTEGER;
BEGIN
    -- Contar cuántos jobs aún tienen region/comuna como texto
    SELECT COUNT(*) INTO text_regions_count
    FROM public.bhe_jobs
    WHERE 
        (professional_region IS NOT NULL AND professional_region::text ~ '^[^0-9]')
        OR (patient_region IS NOT NULL AND patient_region::text ~ '^[^0-9]');
    
    SELECT COUNT(*) INTO text_comunas_count
    FROM public.bhe_jobs
    WHERE 
        (professional_comuna IS NOT NULL AND professional_comuna::text ~ '^[^0-9]')
        OR (patient_comuna IS NOT NULL AND patient_comuna::text ~ '^[^0-9]');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verificación final:';
    RAISE NOTICE 'Jobs con regiones como texto: %', text_regions_count;
    RAISE NOTICE 'Jobs con comunas como texto: %', text_comunas_count;
    RAISE NOTICE '========================================';
    
    IF text_regions_count > 0 OR text_comunas_count > 0 THEN
        RAISE WARNING 'Aún hay jobs con regiones/comunas como texto. Revisar manualmente.';
    END IF;
END $$;

COMMIT;
