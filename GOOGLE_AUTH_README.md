# Sistema de Autenticación de Google para FlorAurora Salud

Este sistema permite registrar usuarios de Google en la plataforma de psicología, mapeando los datos proporcionados por Google a la tabla `Users` de Supabase.

## 🏗️ Arquitectura del Sistema

### 1. Servicio Principal (`GoogleAuthService`)

- **Ubicación**: `src/lib/services/googleAuthService.ts`
- **Responsabilidad**: Maneja toda la lógica de negocio para usuarios de Google
- **Funciones principales**:
  - `registerGoogleUser()`: Registra nuevos usuarios
  - `checkGoogleUserExists()`: Verifica si un usuario ya existe
  - `updateGoogleUser()`: Actualiza datos del usuario
  - `signInGoogleUser()`: Maneja el inicio de sesión

### 2. Hook Personalizado (`useGoogleAuth`)

- **Ubicación**: `src/lib/hooks/useGoogleAuth.ts`
- **Responsabilidad**: Proporciona estado y funciones para componentes React
- **Estados**:
  - `isLoading`: Indica si hay una operación en curso
  - `error`: Mensaje de error si algo falla
  - `user`: Datos del usuario actual

### 3. Componente de Ejemplo (`GoogleAuthHandler`)

- **Ubicación**: `src/components/google/GoogleAuthHandler.tsx`
- **Responsabilidad**: Demuestra el uso completo del sistema
- **Características**:
  - Simula el callback de Google OAuth
  - Maneja el flujo de registro
  - Permite completar datos adicionales del perfil

## 🔄 Flujo de Autenticación

### Paso 1: Usuario hace clic en "Continuar con Google"

```typescript
// En tu componente de login
import GoogleOAuthButton from "@/components/google/GoogleOAuthButton";

<GoogleOAuthButton
  onSuccess={() => console.log("OAuth iniciado")}
  onError={(error) => console.error("Error:", error)}
/>;
```

### Paso 2: Google redirige al usuario de vuelta a tu app

```typescript
// En tu callback route (ej: /auth/callback)
import { GoogleAuthService } from "@/lib/services/googleAuthService";

// Obtener datos del usuario de Google (esto viene en el callback)
const googleUserData = {
  sub: "google_123456789",
  name: "Juan Carlos Pérez",
  given_name: "Juan Carlos",
  family_name: "Pérez",
  email: "juan.perez@gmail.com",
  email_verified: true,
};

// Verificar si el usuario ya existe
const { exists, data: existingUser } =
  await GoogleAuthService.checkGoogleUserExists(googleUserData.sub);

if (exists) {
  // Usuario existente - iniciar sesión
  console.log("Usuario existente:", existingUser);
} else {
  // Usuario nuevo - registrar
  const result = await GoogleAuthService.registerGoogleUser(googleUserData);
  if (result.success) {
    console.log("Usuario registrado:", result.data);
  }
}
```

### Paso 3: Completar datos adicionales (opcional)

```typescript
// Usar el hook en tu componente
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";

const { updateUser, isLoading } = useGoogleAuth();

const handleUpdateProfile = async () => {
  const success = await updateUser(googleId, {
    rut: "12.345.678-9",
    phone_number: "+56 9 1234 5678",
    birth_date: "1990-01-01",
    address: "Calle Principal 123, Ciudad",
  });

  if (success) {
    console.log("Perfil actualizado");
  }
};
```

## 📊 Mapeo de Datos

### Datos que Google Proporciona → Campos en la Tabla Users

| Google Data      | Campo Users  | Descripción                                    |
| ---------------- | ------------ | ---------------------------------------------- |
| `sub`            | `id`         | ID único de Google (usado como clave primaria) |
| `given_name`     | `name`       | Nombre del usuario                             |
| `family_name`    | `last_name`  | Apellido del usuario                           |
| `email`          | `email`      | Email del usuario                              |
| `email_verified` | -            | No se almacena, pero se verifica               |
| -                | `role`       | Se establece en 1 (paciente) por defecto       |
| -                | `is_active`  | Se establece en `true` por defecto             |
| -                | `created_at` | Timestamp de creación automático               |

### Campos que Requieren Completar Manualmente

- `rut`: Número de identificación nacional
- `phone_number`: Número de teléfono
- `birth_date`: Fecha de nacimiento
- `address`: Dirección del usuario

## 🚀 Uso en Producción

### 1. Configurar Google OAuth en Supabase

- Ve a Authentication > Providers > Google
- Habilita Google OAuth
- Configura tu Client ID y Client Secret de Google

### 2. Configurar Callback URLs

- En Google Console: `https://tu-dominio.com/auth/callback`
- En Supabase: `https://tu-dominio.com/auth/callback`

### 3. Implementar el Callback Route

```typescript
// app/auth/callback/route.ts
import { GoogleAuthService } from "@/lib/services/googleAuthService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Intercambiar código por token y obtener datos del usuario
    // Luego usar GoogleAuthService.registerGoogleUser()
  }

  // Redirigir al dashboard o página de perfil
  return Response.redirect("/dashboard");
}
```

## 🧪 Testing

### Usar el Componente de Ejemplo

```typescript
import GoogleAuthHandler from "@/components/google/GoogleAuthHandler";

// En tu página de testing
<GoogleAuthHandler
  onSuccess={(user) => console.log("Éxito:", user)}
  onError={(error) => console.error("Error:", error)}
  onUserExists={(user) => console.log("Usuario existe:", user)}
/>;
```

### Simular Diferentes Escenarios

1. **Usuario nuevo**: El componente simula el registro completo
2. **Usuario existente**: Verifica la lógica de usuarios duplicados
3. **Actualización de perfil**: Permite completar datos adicionales
4. **Manejo de errores**: Simula fallos en la base de datos

## 🔧 Personalización

### Cambiar el Rol por Defecto

```typescript
// En GoogleAuthService.ts, línea ~80
const userData: CreateUserData = {
  // ... otros campos
  role: 2, // Cambiar de 1 (paciente) a 2 (psicólogo) o 3 (admin)
  // ... resto de campos
};
```

### Agregar Validaciones

```typescript
// En GoogleAuthService.ts, método registerGoogleUser
if (!googleUserData.email_verified) {
  return {
    success: false,
    error: new Error("Email no verificado por Google"),
    data: null,
  };
}
```

### Personalizar Campos Requeridos

```typescript
// En CreateUserData interface
export interface CreateUserData {
  // ... campos existentes
  custom_field?: string; // Agregar campos personalizados
}
```

## 🚨 Consideraciones de Seguridad

1. **Verificación de Email**: Solo aceptar usuarios con email verificado
2. **Validación de Datos**: Sanitizar y validar todos los datos de entrada
3. **Rate Limiting**: Implementar límites de intentos de registro
4. **Logs de Auditoría**: Registrar todas las operaciones de autenticación

## 📝 Notas Importantes

- El sistema genera contraseñas temporales seguras para usuarios de Google
- Los usuarios de Google no necesitan recordar contraseñas
- El sistema maneja automáticamente la limpieza si falla la creación en la tabla Users
- Todos los errores son capturados y manejados apropiadamente
- El sistema es compatible con la autenticación existente de email/password

## 🤝 Contribución

Para contribuir al sistema:

1. Mantén la consistencia con el patrón de arquitectura existente
2. Agrega tests para nuevas funcionalidades
3. Documenta cambios en este README
4. Sigue las convenciones de TypeScript del proyecto
