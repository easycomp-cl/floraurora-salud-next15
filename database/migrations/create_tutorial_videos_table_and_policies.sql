-- =============================================
-- Tabla tutorial_videos y Políticas RLS
-- Fecha: 2025-02-10
-- Descripción: Tabla para gestionar videos tutoriales de YouTube.
--              El admin puede asignar visibilidad: profesionales, pacientes o ambos.
--              (Los pacientes aún no tienen acceso a la página tutoriales)
-- =============================================

-- 1. Crear la tabla tutorial_videos
CREATE TABLE IF NOT EXISTS public.tutorial_videos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'professionals' CHECK (visibility IN ('professionals', 'patients', 'both')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES public.users (id)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_active ON public.tutorial_videos(is_active);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_order ON public.tutorial_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_visibility ON public.tutorial_videos(visibility);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.touch_tutorial_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tutorial_videos_updated_at ON public.tutorial_videos;
CREATE TRIGGER trg_tutorial_videos_updated_at
  BEFORE UPDATE ON public.tutorial_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_tutorial_videos_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;

-- 5. Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorial_videos TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.tutorial_videos_id_seq TO authenticated;

-- =============================================
-- POLÍTICAS RLS
-- =============================================

-- Admin: SELECT todos
CREATE POLICY "Admin puede ver todos los tutoriales"
  ON public.tutorial_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

-- Profesionales: SELECT donde visibility IN ('professionals', 'both')
CREATE POLICY "Profesionales pueden ver tutoriales para ellos"
  ON public.tutorial_videos
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (visibility = 'professionals' OR visibility = 'both')
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 3
      AND users.is_active = true
    )
  );

-- Pacientes: SELECT donde visibility IN ('patients', 'both') (para cuando tengan acceso)
CREATE POLICY "Pacientes pueden ver tutoriales para ellos"
  ON public.tutorial_videos
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (visibility = 'patients' OR visibility = 'both')
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 2
      AND users.is_active = true
    )
  );

-- Solo admin: INSERT, UPDATE, DELETE
CREATE POLICY "Solo admin puede crear tutoriales"
  ON public.tutorial_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

CREATE POLICY "Solo admin puede actualizar tutoriales"
  ON public.tutorial_videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

CREATE POLICY "Solo admin puede eliminar tutoriales"
  ON public.tutorial_videos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1
      AND users.is_active = true
    )
  );

COMMENT ON TABLE public.tutorial_videos IS 'Videos tutoriales de YouTube gestionados por el admin';
COMMENT ON COLUMN public.tutorial_videos.visibility IS 'professionals: solo profesionales, patients: solo pacientes, both: ambos';
