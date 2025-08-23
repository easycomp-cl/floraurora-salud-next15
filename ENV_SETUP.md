# Configuración de Variables de Entorno

## Problema Identificado

Si tienes la sesión iniciada pero no puedes ver las páginas, es probable que haya un problema con la configuración de las variables de entorno de Supabase.

## Solución

### 1. Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui
```

### 2. Obtener las credenciales de Supabase

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API
3. Copia la "Project URL" y pégala en `NEXT_PUBLIC_SUPABASE_URL`
4. Copia la "anon public" key y pégala en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Verificar la configuración

- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo después de crear el archivo
- Verifica que no haya espacios extra en las variables

### 4. Verificar en el navegador

- Abre las herramientas de desarrollador (F12)
- Ve a la consola
- Deberías ver logs de autenticación sin errores
- El componente AuthDebug debería mostrar información de las variables de entorno

### 5. Problemas comunes

- **Variables no definidas**: Verifica que el archivo `.env.local` esté en la ubicación correcta
- **Credenciales incorrectas**: Verifica que las credenciales de Supabase sean correctas
- **Cache del navegador**: Limpia el cache y las cookies del navegador
- **Servidor no reiniciado**: Reinicia el servidor de desarrollo después de cambiar las variables

### 6. Verificación adicional

Si el problema persiste, verifica:

1. Que Supabase esté funcionando correctamente
2. Que las políticas de seguridad de la base de datos permitan acceso
3. Que el proveedor de autenticación (Google, email) esté habilitado en Supabase

## Comandos útiles

```bash
# Reiniciar el servidor de desarrollo
npm run dev

# Verificar variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```
