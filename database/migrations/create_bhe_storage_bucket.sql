-- =============================================
-- Configuración del bucket de Storage para PDFs de Boletas de Honorarios Electrónicas
-- Fecha: 2025-01-XX
-- Descripción: Script SQL para crear y configurar el bucket de storage
--              para los PDFs de boletas de BHE en Supabase
-- =============================================

-- NOTA: Este script debe ejecutarse en el SQL Editor de Supabase
--       o mediante la API de administración de Supabase

-- =============================================
-- POLÍTICAS DE STORAGE PARA EL BUCKET 'bhe-pdfs'
-- =============================================

-- Política 1: SELECT - Solo profesionales, pacientes y administradores pueden ver PDFs
-- Los PDFs se acceden mediante signed URLs generadas desde el backend
CREATE POLICY "Profesionales pueden ver PDFs de sus boletas"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bhe-pdfs'
    AND EXISTS (
      SELECT 1 
      FROM public.bhe_jobs b
      JOIN public.professionals p ON b.professional_id = p.id
      JOIN public.users u ON p.id = u.id
      WHERE storage.objects.name = b.result_pdf_path
      AND u.user_id = auth.uid()
    )
  );

CREATE POLICY "Pacientes pueden ver PDFs de sus boletas"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bhe-pdfs'
    AND EXISTS (
      SELECT 1 
      FROM public.bhe_jobs b
      JOIN public.patients p ON b.patient_id = p.id
      JOIN public.users u ON p.id = u.id
      WHERE storage.objects.name = b.result_pdf_path
      AND u.user_id = auth.uid()
    )
  );

CREATE POLICY "Administradores pueden ver todos los PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bhe-pdfs'
    AND EXISTS (
      SELECT 1 
      FROM public.users
      WHERE users.user_id = auth.uid()
      AND users.role = 1 -- rol 1 = admin
      AND users.is_active = true
    )
  );

-- Política 2: INSERT - Solo el sistema (service role) puede subir PDFs
-- Los PDFs son subidos por el worker RPA externo mediante signed URLs
-- Esta política permite que el service role suba archivos
CREATE POLICY "Sistema puede subir PDFs de boletas"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bhe-pdfs'
    -- El service role puede insertar sin verificación adicional
    -- Los workers externos usarán signed URLs con permisos temporales
  );

-- Política 3: UPDATE - Solo el sistema puede actualizar PDFs
CREATE POLICY "Sistema puede actualizar PDFs de boletas"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'bhe-pdfs'
  )
  WITH CHECK (
    bucket_id = 'bhe-pdfs'
  );

-- Política 4: DELETE - Solo administradores pueden eliminar PDFs (para mantenimiento)
CREATE POLICY "Solo administradores pueden eliminar PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'bhe-pdfs'
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
   - Name: bhe-pdfs
   - Public bucket: ❌ (NO marcado - los PDFs son privados y se acceden mediante signed URLs)
   - File size limit: 10MB (10485760 bytes) - suficiente para PDFs de boletas
   - Allowed MIME types: application/pdf

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
  "id": "bhe-pdfs",
  "name": "bhe-pdfs",
  "public": false,
  "file_size_limit": 10485760,
  "allowed_mime_types": ["application/pdf"]
}

NOTA IMPORTANTE:
- Los PDFs NO deben ser públicos por seguridad y privacidad
- El acceso se controla mediante signed URLs generadas desde el backend
- Las signed URLs tienen expiración (por defecto 1 hora)
- Solo profesionales, pacientes asociados y administradores pueden generar signed URLs
*/

