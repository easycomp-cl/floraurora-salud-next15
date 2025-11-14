-- Eliminar la columna has_paid_monthly si existe
-- La lógica ahora se basa únicamente en monthly_plan_expires_at

-- Verificar si la columna existe antes de eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'has_paid_monthly'
  ) THEN
    ALTER TABLE public.professionals DROP COLUMN has_paid_monthly;
    RAISE NOTICE 'Columna has_paid_monthly eliminada exitosamente';
  ELSE
    RAISE NOTICE 'La columna has_paid_monthly no existe, no se requiere eliminación';
  END IF;
END $$;

