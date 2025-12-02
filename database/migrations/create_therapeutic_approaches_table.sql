-- =============================================
-- Migración: Crear tabla de enfoques terapéuticos
-- Descripción: Tabla mantenedor de enfoques terapéuticos y relación 1:1 con profesionales
-- Fecha: 2025-12-02
-- =============================================

-- 1. Crear tabla de enfoques terapéuticos (mantenedor)
CREATE TABLE IF NOT EXISTS public.therapeutic_approaches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_therapeutic_approaches_is_active 
  ON public.therapeutic_approaches(is_active);

CREATE INDEX IF NOT EXISTS idx_therapeutic_approaches_name 
  ON public.therapeutic_approaches(name);

-- 3. Insertar los enfoques terapéuticos iniciales
INSERT INTO public.therapeutic_approaches (name, description, is_active) VALUES
  ('Psicología', 'Enfoque general de psicología', true),
  ('Psicoanálisis', 'Enfoque psicoanalítico basado en las teorías de Freud y sus seguidores', true),
  ('Cognitivo conductual', 'Enfoque que combina terapia cognitiva y conductual', true),
  ('Humanista', 'Enfoque humanista centrado en el crecimiento personal y la autorrealización', true),
  ('Sistémico', 'Enfoque sistémico que considera al individuo dentro de su contexto familiar y social', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Agregar columna approach_id a la tabla professionals (relación 1:1)
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS approach_id INTEGER NULL;

-- 5. Crear foreign key constraint para la relación 1:1
DO $$
BEGIN
  -- Verificar si la foreign key ya existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'professionals_approach_id_fkey'
    AND table_name = 'professionals'
  ) THEN
    ALTER TABLE public.professionals
    ADD CONSTRAINT professionals_approach_id_fkey
    FOREIGN KEY (approach_id)
    REFERENCES public.therapeutic_approaches(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key creada: professionals.approach_id -> therapeutic_approaches.id';
  ELSE
    RAISE NOTICE 'Foreign key ya existe entre professionals y therapeutic_approaches';
  END IF;
END $$;

-- 6. Crear índice para la foreign key
CREATE INDEX IF NOT EXISTS idx_professionals_approach_id 
  ON public.professionals(approach_id);

-- 7. Crear constraint único para asegurar relación 1:1 (opcional, comentado porque puede haber profesionales sin enfoque)
-- ALTER TABLE public.professionals
-- ADD CONSTRAINT professionals_approach_id_unique UNIQUE (approach_id);

-- 8. Agregar comentarios para documentación
COMMENT ON TABLE public.therapeutic_approaches IS 'Tabla mantenedor de enfoques terapéuticos disponibles para profesionales';
COMMENT ON COLUMN public.therapeutic_approaches.name IS 'Nombre del enfoque terapéutico';
COMMENT ON COLUMN public.therapeutic_approaches.description IS 'Descripción del enfoque terapéutico';
COMMENT ON COLUMN public.therapeutic_approaches.is_active IS 'Indica si el enfoque está activo y disponible para selección';

COMMENT ON COLUMN public.professionals.approach_id IS 'ID del enfoque terapéutico del profesional (relación 1:1). NULL si no tiene enfoque asignado.';

-- 9. Habilitar RLS (Row Level Security)
ALTER TABLE public.therapeutic_approaches ENABLE ROW LEVEL SECURITY;

-- 10. Crear políticas RLS básicas
-- Eliminar política si existe antes de crearla
DROP POLICY IF EXISTS "Therapeutic approaches are viewable by authenticated users" ON public.therapeutic_approaches;

-- Permitir lectura a todos los usuarios autenticados
CREATE POLICY "Therapeutic approaches are viewable by authenticated users"
  ON public.therapeutic_approaches
  FOR SELECT
  TO authenticated
  USING (true);

-- Permitir inserción/actualización solo a administradores (ajustar según necesidades)
-- DROP POLICY IF EXISTS "Therapeutic approaches are editable by admins" ON public.therapeutic_approaches;
-- CREATE POLICY "Therapeutic approaches are editable by admins"
--   ON public.therapeutic_approaches
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.users
--       WHERE users.user_id = auth.uid()
--       AND users.role = 1
--     )
--   );

-- 11. Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_therapeutic_approaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Crear trigger para updated_at
DROP TRIGGER IF EXISTS trg_therapeutic_approaches_updated_at ON public.therapeutic_approaches;
CREATE TRIGGER trg_therapeutic_approaches_updated_at
  BEFORE UPDATE ON public.therapeutic_approaches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_therapeutic_approaches_updated_at();

-- 13. Otorgar permisos necesarios
GRANT SELECT ON public.therapeutic_approaches TO authenticated;
GRANT SELECT, UPDATE ON public.professionals TO authenticated;

