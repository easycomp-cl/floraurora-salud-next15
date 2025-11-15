-- =============================================
-- Políticas RLS (Row Level Security) para admin_logs
-- Fecha: 2025-01-XX
-- Descripción: Políticas de seguridad para controlar el acceso a los logs administrativos
-- =============================================

-- Habilitar RLS en la tabla admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS DE LECTURA (SELECT)
-- =============================================

-- Política 1: Los administradores pueden ver todos los logs
CREATE POLICY "Los administradores pueden ver todos los logs"
  ON public.admin_logs
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

-- Política 2: Los usuarios pueden ver sus propios logs (opcional)
-- Descomenta si quieres que los usuarios vean las acciones que ellos realizaron
/*
CREATE POLICY "Los usuarios pueden ver sus propios logs"
  ON public.admin_logs
  FOR SELECT
  TO authenticated
  USING (
    actor_id = (
      SELECT id 
      FROM public.users
      WHERE user_id = auth.uid()
    )
  );
*/

-- =============================================
-- POLÍTICAS DE ESCRITURA (INSERT)
-- =============================================

-- Política 3: Solo los administradores pueden insertar logs
CREATE POLICY "Solo administradores pueden insertar logs"
  ON public.admin_logs
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

-- =============================================
-- POLÍTICAS DE ACTUALIZACIÓN (UPDATE)
-- =============================================

-- Política 4: Los administradores pueden actualizar logs (opcional, generalmente no se deberían modificar)
-- Descomenta solo si necesitas permitir actualizaciones
/*
CREATE POLICY "Los administradores pueden actualizar logs"
  ON public.admin_logs
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
*/

-- =============================================
-- POLÍTICAS DE ELIMINACIÓN (DELETE)
-- =============================================

-- Política 5: Los administradores pueden eliminar logs (opcional, generalmente no se deberían eliminar)
-- Descomenta solo si necesitas permitir eliminaciones (por ejemplo, para limpieza de logs antiguos)
/*
CREATE POLICY "Los administradores pueden eliminar logs antiguos"
  ON public.admin_logs
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
    -- Opcional: Solo permitir eliminar logs más antiguos de X días
    -- AND created_at < NOW() - INTERVAL '90 days'
  );
*/

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- 
-- 1. Las políticas están configuradas para que SOLO los administradores (role = 1) 
--    puedan ver e insertar logs.
--
-- 2. Las políticas de UPDATE y DELETE están comentadas por defecto porque los logs 
--    de auditoría generalmente NO deberían modificarse ni eliminarse para mantener 
--    la integridad del registro de auditoría.
--
-- 3. Si necesitas permitir que usuarios regulares vean sus propios logs, descomenta 
--    la política "Los usuarios pueden ver sus propios logs".
--
-- 4. Si necesitas limpiar logs antiguos periódicamente, puedes descomentar la política 
--    de DELETE y agregar una condición de fecha (ej: logs más antiguos de 90 días).
--
-- 5. Asegúrate de que la función auth.uid() devuelva el UUID del usuario autenticado
--    y que la tabla users tenga una columna user_id que coincida con auth.uid().
--
-- =============================================

