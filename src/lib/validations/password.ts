import { z } from "zod";

// Esquema para reset de contraseña
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña no puede exceder 72 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  confirmPassword: z
    .string()
    .min(6, "La confirmación de contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
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

export type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;

// Esquema para cambio de contraseña (cuando el usuario ya está autenticado)
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "La contraseña actual debe tener al menos 6 caracteres"),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña no puede exceder 72 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  confirmPassword: z
    .string()
    .min(6, "La confirmación de contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

