# Botones de Google OAuth - FlorAurora Salud

## Descripción

Este proyecto incluye varios componentes de botones de Google OAuth que siguen las mejores prácticas de Google para el diseño de botones de autenticación.

## Componentes Disponibles

### 1. `GoogleSignInButton` (Avanzado)

**Archivo:** `src/components/google/GoogleSignInButton.tsx`

**Características:**

- ✅ Logo oficial de Google con colores correctos
- ✅ Estado de carga con spinner animado
- ✅ Manejo automático del estado de loading
- ✅ Diseño responsive y accesible
- ✅ Transiciones suaves y efectos hover
- ✅ Focus ring para accesibilidad

**Uso:**

```tsx
import GoogleSignInButton from "@/components/google/GoogleSignInButton";

const MyComponent = () => {
  const handleGoogleSignIn = async () => {
    // Tu lógica de autenticación aquí
  };

  return (
    <GoogleSignInButton
      onClick={handleGoogleSignIn}
      className="max-w-sm mx-auto"
    />
  );
};
```

**Props:**

- `onClick`: Función async que maneja la autenticación
- `disabled`: Boolean para deshabilitar el botón
- `className`: Clases CSS adicionales

### 2. `GoogleOAuthButton` (Simple)

**Archivo:** `src/components/google/GoogleOAuthButton.tsx`

**Características:**

- ✅ Logo oficial de Google
- ✅ Texto personalizable
- ✅ Callbacks de éxito y error
- ✅ Diseño más compacto
- ✅ Ideal para formularios de login/signup

**Uso:**

```tsx
import GoogleOAuthButton from "@/components/google/GoogleOAuthButton";

const LoginForm = () => {
  const handleSuccess = () => {
    console.log("Autenticación exitosa");
  };

  const handleError = (error: string) => {
    console.error("Error:", error);
  };

  return (
    <GoogleOAuthButton
      text="Iniciar sesión con Google"
      onSuccess={handleSuccess}
      onError={handleError}
      className="mt-4"
    />
  );
};
```

**Props:**

- `text`: Texto personalizable del botón
- `className`: Clases CSS adicionales
- `onSuccess`: Callback cuando la autenticación es exitosa
- `onError`: Callback cuando hay un error

### 3. `SignInWithGoogleButton` (Wrapper)

**Archivo:** `src/components/google/SignInWithGoogleButton.tsx`

**Características:**

- ✅ Wrapper del botón avanzado
- ✅ Lógica de autenticación integrada
- ✅ Manejo de errores con alertas
- ✅ Logging detallado para depuración

**Uso:**

```tsx
import SignInWithGoogleButton from "@/components/google/SignInWithGoogleButton";

const MyPage = () => {
  return (
    <div>
      <h1>Iniciar Sesión</h1>
      <SignInWithGoogleButton />
    </div>
  );
};
```

## Características del Logo de Google

### Colores Oficiales

- **Azul (#4285F4)**: Parte superior izquierda
- **Verde (#34A853)**: Parte inferior derecha
- **Amarillo (#FBBC05)**: Parte inferior izquierda
- **Rojo (#EA4335)**: Parte superior derecha

### Tamaños Recomendados

- **Pequeño**: `w-4 h-4` (16x16px)
- **Mediano**: `w-5 h-5` (20x20px) - **Recomendado**
- **Grande**: `w-6 h-6` (24x24px)

## Mejores Prácticas

### 1. **Accesibilidad**

- ✅ Incluir `aria-label="Google logo"`
- ✅ Usar `focus:ring` para indicar focus
- ✅ Contraste adecuado de colores

### 2. **Diseño**

- ✅ Mantener proporciones del logo
- ✅ Usar colores oficiales de Google
- ✅ Espaciado consistente entre logo y texto

### 3. **UX**

- ✅ Estado de carga visible
- ✅ Feedback visual en hover/focus
- ✅ Transiciones suaves

### 4. **Responsive**

- ✅ Botón de ancho completo en mobile
- ✅ Tamaño apropiado para diferentes pantallas
- ✅ Espaciado adaptativo

## Personalización

### Cambiar Colores del Tema

```tsx
// En el botón
className = "bg-blue-50 border-blue-200 hover:bg-blue-100";
```

### Cambiar Tamaño

```tsx
// Logo más grande
<svg className="w-6 h-6" ...>

// Botón más alto
className="h-14 px-8 py-4"
```

### Cambiar Texto

```tsx
// En GoogleOAuthButton
<GoogleOAuthButton text="Registrarse con Google" />

// En GoogleSignInButton (modificar el componente)
<span>Iniciar sesión con Google</span>
```

## Integración con Supabase

Todos los botones están configurados para trabajar con Supabase Auth:

```tsx
// La función clientSignInWithGoogle maneja:
// 1. Inicio de OAuth con Google
// 2. Redirección al callback
// 3. Manejo de errores
// 4. Logging para depuración
```

## Troubleshooting

### El botón no responde

- Verifica que la función `onClick` sea async
- Revisa la consola para errores
- Asegúrate de que Supabase esté configurado

### El logo no se muestra

- Verifica que el SVG esté correctamente importado
- Revisa que las clases CSS no estén sobrescribiendo el tamaño
- Asegúrate de que el viewBox esté correcto

### Errores de autenticación

- Verifica las variables de entorno de Supabase
- Revisa la configuración de OAuth en Supabase
- Comprueba que las URLs de redirección estén configuradas

## Próximos Pasos

1. **Personaliza los colores** según tu tema
2. **Ajusta el tamaño** según tus necesidades
3. **Modifica el texto** para tu idioma
4. **Agrega animaciones** adicionales si lo deseas
5. **Implementa en otras páginas** de tu aplicación
