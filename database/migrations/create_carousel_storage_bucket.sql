-- =============================================
-- Configuración del bucket de Storage para imágenes del carrusel
-- Fecha: 2025-01-XX
-- Descripción: Script SQL para crear y configurar el bucket de storage
--              para las imágenes del carrusel en Supabase
-- =============================================

-- NOTA: Este script debe ejecutarse en el SQL Editor de Supabase
--       o mediante la API de administración de Supabase

-- 1. Crear el bucket 'carousel-images' si no existe
-- NOTA: La creación de buckets normalmente se hace desde el dashboard de Supabase
--       o mediante la API REST. Este es un ejemplo de cómo debería hacerse:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'carousel-images',
--   'carousel-images',
--   true, -- Público para que las imágenes sean accesibles sin autenticación
--   5242880, -- 5MB límite de tamaño
--   ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- =============================================
-- POLÍTICAS DE STORAGE PARA EL BUCKET
-- =============================================

-- Política 1: SELECT - Cualquiera puede ver las imágenes del carrusel (público)
CREATE POLICY "Cualquiera puede ver imágenes del carrusel"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'carousel-images');

-- Política 2: INSERT - Solo los administradores pueden subir imágenes
CREATE POLICY "Solo administradores pueden subir imágenes del carrusel"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 3: UPDATE - Solo los administradores pueden actualizar imágenes
CREATE POLICY "Solo administradores pueden actualizar imágenes del carrusel"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  )
  WITH CHECK (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 4: DELETE - Solo los administradores pueden eliminar imágenes
CREATE POLICY "Solo administradores pueden eliminar imágenes del carrusel"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'carousel-images'
    AND EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- =============================================
-- INSTRUCCIONES PARA CREAR EL BUCKET MANUALMENTE
-- =============================================

/*
PASOS PARA CREAR EL BUCKET DESDE EL DASHBOARD DE SUPABASE:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a Storage en el menú lateral
3. Haz clic en "New bucket"
4. Configura el bucket con los siguientes valores:
   - Name: carousel-images
   - Public bucket: ✅ (marcado - para que las imágenes sean públicas)
   - File size limit: 5MB (5242880 bytes)
   - Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp, image/gif

5. Después de crear el bucket, ejecuta las políticas de storage de este archivo
   en el SQL Editor de Supabase.

ALTERNATIVAMENTE, puedes crear el bucket usando la API REST de Supabase:

POST https://<your-project-ref>.supabase.co/storage/v1/bucket
Headers:
  Authorization: Bearer <service_role_key>
  apikey: <service_role_key>
  Content-Type: application/json

Body:
{
  "id": "carousel-images",
  "name": "carousel-images",
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]
}
*/

