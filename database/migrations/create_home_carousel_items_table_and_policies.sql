 -- =============================================
-- Tabla home_carousel_items y Políticas RLS
-- Fecha: 2025-01-XX
-- Descripción: Tabla para gestionar elementos del carrusel de la página principal
--              con políticas RLS para que solo los administradores puedan gestionar
-- =============================================

-- 1. Crear la tabla home_carousel_items (si no existe)
CREATE TABLE IF NOT EXISTS public.home_carousel_items (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  message TEXT,
  image_url TEXT,
  cta_label TEXT,
  cta_link TEXT,
  start_date DATE,
  end_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES public.users (id)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_home_carousel_active 
  ON public.home_carousel_items(is_active);

CREATE INDEX IF NOT EXISTS idx_home_carousel_order 
  ON public.home_carousel_items(display_order);

CREATE INDEX IF NOT EXISTS idx_home_carousel_dates 
  ON public.home_carousel_items(start_date, end_date);

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.touch_carousel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trg_home_carousel_updated_at ON public.home_carousel_items;
CREATE TRIGGER trg_home_carousel_updated_at
  BEFORE UPDATE ON public.home_carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_carousel_updated_at();

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.home_carousel_items ENABLE ROW LEVEL SECURITY;

-- 6. Otorgar permisos básicos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_carousel_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.home_carousel_items_id_seq TO authenticated;

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Política 1: SELECT - Los administradores pueden ver todos los elementos del carrusel
-- Los usuarios no autenticados también pueden ver los elementos activos (para mostrar en la página principal)
CREATE POLICY "Los administradores pueden ver todos los elementos del carrusel"
  ON public.home_carousel_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 2: SELECT - Usuarios públicos pueden ver elementos activos del carrusel
-- (Para mostrar en la página principal sin autenticación)
CREATE POLICY "Usuarios públicos pueden ver elementos activos del carrusel"
  ON public.home_carousel_items
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  );

-- Política 3: INSERT - Solo los administradores pueden crear elementos del carrusel
CREATE POLICY "Solo administradores pueden crear elementos del carrusel"
  ON public.home_carousel_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 4: UPDATE - Solo los administradores pueden actualizar elementos del carrusel
CREATE POLICY "Solo administradores pueden actualizar elementos del carrusel"
  ON public.home_carousel_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 5: DELETE - Solo los administradores pueden eliminar elementos del carrusel
CREATE POLICY "Solo administradores pueden eliminar elementos del carrusel"
  ON public.home_carousel_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON TABLE public.home_carousel_items IS 'Elementos del carrusel que se muestran en la página principal';
COMMENT ON COLUMN public.home_carousel_items.title IS 'Título del elemento del carrusel';
COMMENT ON COLUMN public.home_carousel_items.message IS 'Mensaje descriptivo del elemento';
COMMENT ON COLUMN public.home_carousel_items.image_url IS 'URL de la imagen (almacenada en Supabase Storage)';
COMMENT ON COLUMN public.home_carousel_items.cta_label IS 'Texto del botón de llamada a la acción';
COMMENT ON COLUMN public.home_carousel_items.cta_link IS 'URL de destino del botón CTA';
COMMENT ON COLUMN public.home_carousel_items.start_date IS 'Fecha de inicio de visualización (opcional)';
COMMENT ON COLUMN public.home_carousel_items.end_date IS 'Fecha de fin de visualización (opcional)';
COMMENT ON COLUMN public.home_carousel_items.display_order IS 'Orden de visualización (menor número = mayor prioridad)';
COMMENT ON COLUMN public.home_carousel_items.is_active IS 'Indica si el elemento está activo y debe mostrarse';
COMMENT ON COLUMN public.home_carousel_items.updated_by IS 'ID del usuario administrador que realizó la última modificación';

