# Validaciones de Perfil de Usuario

Este documento describe las validaciones implementadas en el formulario de perfil de usuario usando Zod.

## Validaciones Implementadas

### Campos Obligatorios

Todos los campos marcados con (\*) son obligatorios y deben ser completados antes de guardar:

- **Nombre**: Mínimo 2 caracteres, máximo 50, solo letras y espacios
- **Apellido**: Mínimo 2 caracteres, máximo 50, solo letras y espacios
- **Teléfono**: Número chileno válido (8-9 dígitos)
- **Dirección**: Mínimo 10 caracteres, máximo 200
- **Fecha de Nacimiento**: Debe ser mayor de 18 años
- **Género**: Selección obligatoria
- **Nacionalidad**: Selección obligatoria
- **RUT**: Formato chileno válido con dígito verificador

### Validaciones Específicas

#### RUT Chileno

- Formato: 12.345.678-9
- Validación del dígito verificador
- Formateo automático mientras el usuario escribe (incluye guión)
- Acepta RUT con K como dígito verificador

#### Teléfono

- Formato chileno: 8-9 dígitos o formato WhatsApp (+569 1234 5678)
- Formateo automático:
  - Local: 1234 5678
  - WhatsApp: +569 1234 5678
- Limpieza automática de espacios, guiones y paréntesis

#### Dirección

- Mínimo 10 caracteres para asegurar información completa
- Máximo 200 caracteres
- Placeholder sugerido: "Calle 123, Comuna, Región"

#### Fecha de Nacimiento

- Validación de edad mínima: 18 años
- Cálculo preciso considerando mes y día

### Perfil de Paciente

#### Campos Obligatorios

- **Nombre de Contacto de Emergencia**: Mínimo 2 caracteres, solo letras
- **Teléfono de Contacto de Emergencia**: Mismo formato que teléfono principal

#### Campos Opcionales

- **ID de Seguro de Salud**: Número opcional

### Perfil Profesional

#### Campos Obligatorios

- **Profesión**: Selección obligatoria de la lista de títulos
- **Descripción del Perfil**: Mínimo 20 caracteres, máximo 1000
- **Especialidades**: Al menos una especialidad debe ser seleccionada

#### Campos Opcionales

- **URL del CV**: Debe ser una URL válida si se proporciona

## Funcionalidades de UX

### Formateo en Tiempo Real

- **RUT**: Se formatea automáticamente con puntos y guión mientras se escribe (12.345.678-9)
- **Teléfono**: Se formatea automáticamente:
  - Formato local: 1234 5678
  - Formato WhatsApp: +569 1234 5678

### Indicadores Visuales

- Campos con error muestran borde rojo
- Mensajes de error específicos debajo de cada campo
- Asterisco (\*) en campos obligatorios
- Indicador "(\* Campos obligatorios)" en el encabezado del formulario

### Limpieza de Errores

- Los errores se limpian automáticamente cuando el usuario empieza a escribir
- Los errores se limpian al cancelar la edición
- Los errores se limpian al guardar exitosamente

## Esquemas de Validación

Los esquemas están definidos en `src/lib/validations/profile.ts`:

- `userProfileSchema`: Validaciones para datos básicos del usuario
- `patientProfileSchema`: Validaciones específicas para pacientes
- `professionalProfileSchema`: Validaciones específicas para profesionales
- `profileFormSchema`: Esquema completo que combina todas las validaciones

## Uso

```typescript
import { profileFormSchema } from "@/lib/validations/profile";

// Validar datos del formulario
try {
  const validatedData = profileFormSchema.parse(formData);
  // Los datos son válidos
} catch (error) {
  if (error instanceof ZodError) {
    // Manejar errores de validación
    error.issues.forEach((issue) => {
      console.log(`${issue.path.join(".")}: ${issue.message}`);
    });
  }
}
```

## Mensajes de Error

Los mensajes de error son específicos y descriptivos:

- "El nombre debe tener al menos 2 caracteres"
- "El RUT no es válido. Formato: 12.345.678-9"
- "El teléfono debe ser un número chileno válido (8-9 dígitos o formato WhatsApp: +569 1234 5678)"
- "La dirección debe tener al menos 10 caracteres"
- "Debes ser mayor de 18 años"
- "Debes seleccionar al menos una especialidad"

## Consideraciones Técnicas

- Las validaciones se ejecutan tanto en tiempo real como al guardar
- Los datos se formatean automáticamente para mejorar la experiencia del usuario
- Los errores se muestran de forma contextual y no invasiva
- El formulario previene el envío si hay errores de validación
