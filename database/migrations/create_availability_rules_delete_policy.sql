-- =============================================
-- Política RLS (Row Level Security) para DELETE en availability_rules
-- Fecha: 2025-01-XX
-- Descripción: Permite a profesionales eliminar sus propios horarios y a administradores eliminar cualquier horario
-- =============================================

-- Verificar si RLS está habilitado en la tabla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'availability_rules'
  ) THEN
    RAISE EXCEPTION 'La tabla availability_rules no existe';
  END IF;
END $$;

-- Habilitar RLS si no está habilitado
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICA DE ELIMINACIÓN (DELETE)
-- =============================================

-- Eliminar política existente si existe (para evitar errores al ejecutar múltiples veces)
DROP POLICY IF EXISTS "professionals_can_delete_own_availability_rules" ON public.availability_rules;
DROP POLICY IF EXISTS "admins_can_delete_any_availability_rules" ON public.availability_rules;

-- Política 1: Los profesionales pueden eliminar sus propios horarios
-- Verifica que el professional_id de la regla coincida con el id del usuario autenticado
CREATE POLICY "professionals_can_delete_own_availability_rules"
  ON public.availability_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.id = availability_rules.professional_id
      AND users.role = 3 -- rol 3 = professional
      AND users.is_active = true
    )
  );

-- Política 2: Los administradores pueden eliminar cualquier horario
CREATE POLICY "admins_can_delete_any_availability_rules"
  ON public.availability_rules
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
-- NOTAS IMPORTANTES
-- =============================================
-- 
-- 1. Las políticas permiten que:
--    - Los profesionales (role = 3) eliminen solo sus propios horarios
--    - Los administradores (role = 1) eliminen cualquier horario
--
-- 2. La verificación se hace comparando:
--    - auth.uid() con users.user_id (UUID del usuario autenticado)
--    - users.id con availability_rules.professional_id (ID numérico del profesional)
--
-- 3. Solo usuarios activos pueden eliminar horarios
--
-- 4. Si necesitas agregar políticas para UPDATE, puedes seguir el mismo patrón
--
-- =============================================

