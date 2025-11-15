-- Permitir user_id NULL en professional_requests
-- Fecha: 2025-11-14
-- Descripción: Permite que user_id sea NULL cuando se crea una solicitud profesional,
-- ya que el usuario se crea solo cuando el administrador aprueba la solicitud.

-- Modificar la columna user_id para permitir valores NULL
DO $$
BEGIN
  -- Verificar si la columna existe y tiene restricción NOT NULL
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professional_requests' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Eliminar la restricción NOT NULL
    ALTER TABLE public.professional_requests
    ALTER COLUMN user_id DROP NOT NULL;
    
    -- Agregar comentario explicativo
    COMMENT ON COLUMN public.professional_requests.user_id IS 
    'ID del usuario en auth.users. Puede ser NULL hasta que el administrador apruebe la solicitud y se cree el usuario.';
    
    RAISE NOTICE 'Columna user_id modificada para permitir valores NULL';
  ELSE
    RAISE NOTICE 'La columna user_id ya permite valores NULL o no existe';
  END IF;
END $$;

