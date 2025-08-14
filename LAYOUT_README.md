# Estructura del Layout - FlorAurora Salud

## Descripción General

Este proyecto tiene una estructura de layout organizada que permite una fácil personalización del navbar y footer.

## Estructura de Carpetas

```
src/app/
├── layout.tsx              # Layout principal (incluye Navbar y Footer)
├── page.tsx                # Página de redirección
├── (auth)/                 # Grupo de rutas de autenticación
│   ├── layout.tsx          # Layout específico para auth
│   ├── login/
│   ├── signup/
│   └── auth/callback/
└── (main)/                 # Grupo de rutas principales
    ├── layout.tsx          # Layout específico para páginas principales
    └── page.tsx            # Página principal de la aplicación
```

## Componentes de Layout

### 1. Navbar (`src/components/layout/Navbar.tsx`)

**Características:**

- Logo con enlace a la página principal
- Navegación principal
- Estado de autenticación dinámico
- Enlaces condicionales según el usuario

**Para personalizar:**

- Cambia el logo y colores en las clases de Tailwind
- Modifica los enlaces de navegación
- Ajusta el comportamiento según el estado de autenticación

### 2. Footer (`src/components/layout/Footer.tsx`)

**Características:**

- Información de la empresa
- Enlaces rápidos
- Información de contacto
- Enlaces legales

**Para personalizar:**

- Actualiza la información de contacto
- Modifica los enlaces rápidos
- Cambia los colores y estilos
- Agrega redes sociales

## Cómo Personalizar

### Cambiar Colores del Tema

1. **Navbar:** Modifica las clases en `Navbar.tsx`

   ```tsx
   // Cambiar de bg-white a tu color preferido
   <nav className="bg-white shadow-sm border-b border-gray-200">
   ```

2. **Footer:** Modifica las clases en `Footer.tsx`
   ```tsx
   // Cambiar de bg-gray-800 a tu color preferido
   <footer className="bg-gray-800 text-white">
   ```

### Agregar Nuevos Enlaces

1. **En el Navbar:**

   ```tsx
   <Link href="/nueva-pagina" className="text-gray-600 hover:text-gray-900">
     Nueva Página
   </Link>
   ```

2. **En el Footer:**
   ```tsx
   <li>
     <a href="/nueva-pagina" className="text-gray-300 hover:text-white">
       Nueva Página
     </a>
   </li>
   ```

### Modificar el Logo

1. **Cambiar el texto del logo:**

   ```tsx
   <span className="text-xl font-bold text-gray-900">Tu Nuevo Nombre</span>
   ```

2. **Cambiar el ícono:**
   ```tsx
   <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
     <span className="text-white font-bold text-sm">TN</span>
   </div>
   ```

## Estructura de Rutas

### Rutas de Autenticación (`/auth/*`)

- Usan el layout de autenticación (centrado, fondo degradado)
- Incluyen login, signup, y callback de OAuth

### Rutas Principales (`/main/*`)

- Usan el layout principal con navbar y footer
- Incluyen la página principal y futuras páginas del dashboard

## Responsive Design

El layout está diseñado para ser responsive:

- **Mobile:** Navegación colapsada, footer en columna
- **Desktop:** Navegación horizontal, footer en grid

## Personalización Avanzada

### Agregar Nuevas Secciones

1. Crea un nuevo grupo de rutas:

   ```
   src/app/(dashboard)/
   ├── layout.tsx
   └── page.tsx
   ```

2. Aplica un layout específico para esa sección

### Modificar el Layout Principal

El layout principal en `src/app/layout.tsx` es donde puedes:

- Agregar providers globales
- Configurar estilos globales
- Agregar scripts de analytics
- Configurar metadatos

## Notas Importantes

- **Estado de Autenticación:** El navbar y footer usan el hook `useAuth` para mostrar contenido condicional
- **Rutas:** Todas las rutas están configuradas para usar Next.js 13+ App Router
- **Estilos:** Usa Tailwind CSS para todos los estilos
- **Componentes:** Todos los componentes son del lado del cliente (`"use client"`)

## Próximos Pasos

1. Personaliza los colores del tema
2. Actualiza la información de contacto
3. Agrega tu logo personalizado
4. Modifica los enlaces de navegación
5. Agrega nuevas secciones según necesites
