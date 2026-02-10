import { z } from "zod";

/**
 * Esquema reutilizable para validar contraseñas con los criterios:
 * - mínimo 6 caracteres
 * - al menos 1 mayúscula
 * - al menos 1 número
 * - no solo números y no solo letras
 */
export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(72, "La contraseña no puede exceder 72 caracteres")
  .refine((val) => /[A-Z]/.test(val), "Debe contener al menos una mayúscula")
  .refine((val) => /\d/.test(val), "Debe contener al menos un número")
  .refine((val) => !/^\d+$/.test(val), "No puede contener solo números")
  .refine((val) => !/^[a-zA-Z]+$/.test(val), "No puede contener solo letras");

// Esquema para reset de contraseña
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(6, "La confirmación de contraseña debe tener al menos 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Esquema para solicitar reset de contraseña (por email)
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido"),
});

export type RequestPasswordResetFormData = z.infer<
  typeof requestPasswordResetSchema
>;

// Esquema para cambio de contraseña (cuando el usuario ya está autenticado)
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "La contraseña actual debe tener al menos 6 caracteres"),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(6, "La confirmación de contraseña debe tener al menos 6 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
