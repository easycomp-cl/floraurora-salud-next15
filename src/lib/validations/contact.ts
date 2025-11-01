import { z } from "zod";

export const contactFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
  
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Ingresa un email válido"),
  
  phone: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .max(15, "El teléfono no puede exceder 15 caracteres")
    .regex(/^\+?[0-9\s-]+$/, "Ingresa un número de teléfono válido"),
  
  subject: z
    .string()
    .min(1, "Debes seleccionar un asunto"),
  
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(1000, "El mensaje no puede exceder 1000 caracteres"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

