-- =============================================
-- Agregar columnas hide_title y no_opacity a home_carousel_items
-- Fecha: 2025-03-10
-- Descripción: Permite al administrador ocultar el título en el carrusel
--              y mostrar la imagen sin capa de opacidad oscura
-- =============================================

-- 1. Agregar columna hide_title (ocultar el elemento de título/texto en el carrusel)
ALTER TABLE public.home_carousel_items
ADD COLUMN IF NOT EXISTS hide_title BOOLEAN NOT NULL DEFAULT false;

-- 2. Agregar columna no_opacity (mostrar la imagen sin overlay oscuro, imagen clara)
ALTER TABLE public.home_carousel_items
ADD COLUMN IF NOT EXISTS no_opacity BOOLEAN NOT NULL DEFAULT false;

-- 3. Agregar columna adjust_image (imagen centrada, visible según resolución)
ALTER TABLE public.home_carousel_items
ADD COLUMN IF NOT EXISTS adjust_image BOOLEAN NOT NULL DEFAULT false;

-- 4. Comentarios para documentación
COMMENT ON COLUMN public.home_carousel_items.hide_title IS 'Si es true, no se muestra el título ni el contenedor de texto superpuesto en el carrusel';
COMMENT ON COLUMN public.home_carousel_items.no_opacity IS 'Si es true, la imagen se muestra sin overlay oscuro (opacidad), viéndose clara';
COMMENT ON COLUMN public.home_carousel_items.adjust_image IS 'Si es true, la imagen se ajusta y centra para verse completa según la resolución';
