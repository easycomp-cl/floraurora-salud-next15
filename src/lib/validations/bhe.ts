import { z } from "zod";

/**
 * Esquema de validación para crear un job de BHE en la cola
 */
export const bheEnqueueSchema = z.object({
  payment_id: z
    .string()
    .min(1, "El ID del pago es obligatorio")
    .max(255, "El ID del pago es demasiado largo"),
  
  appointment_id: z
    .string()
    .optional()
    .nullable(),
  
  professional_id: z
    .number()
    .int("El ID del profesional debe ser un número entero")
    .positive("El ID del profesional debe ser positivo"),
  
  patient_id: z
    .number()
    .int("El ID del paciente debe ser un número entero")
    .positive("El ID del paciente debe ser positivo")
    .optional()
    .nullable(),
  
  patient_rut: z
    .string()
    .regex(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/, "El RUT debe tener formato válido (ej: 12.345.678-9)")
    .optional()
    .nullable(),
  
  amount: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .max(999999999999.99, "El monto es demasiado grande"),
  
  glosa: z
    .string()
    .min(5, "La glosa debe tener al menos 5 caracteres")
    .max(500, "La glosa no puede exceder 500 caracteres"),
  
  issue_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
    .optional()
    .transform((val) => val || new Date().toISOString().split('T')[0]),
  
  // Campos adicionales del profesional
  professional_rut: z
    .string()
    .regex(/^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9kK]{1}$/, "El RUT del profesional debe tener formato válido")
    .optional()
    .nullable(),
  
  professional_address: z
    .string()
    .optional()
    .nullable(),
  
  professional_region: z
    .string()
    .optional()
    .nullable(),
  
  professional_comuna: z
    .string()
    .optional()
    .nullable(),
  
  // Campos adicionales del paciente
  patient_names: z
    .string()
    .optional()
    .nullable(),
  
  patient_address: z
    .string()
    .optional()
    .nullable(),
  
  patient_region: z
    .string()
    .optional()
    .nullable(),
  
  patient_comuna: z
    .string()
    .optional()
    .nullable(),
  
  patient_email: z
    .string()
    .email("El email del paciente debe ser válido")
    .optional()
    .nullable(),
  
  // Campos del servicio
  service_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha del servicio debe tener formato YYYY-MM-DD")
    .optional()
    .nullable(),
  
  service_detail: z
    .string()
    .optional()
    .nullable(),
  
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
});

export type BHEEnqueueData = z.infer<typeof bheEnqueueSchema>;

/**
 * Esquema de validación para actualizar el estado de un job (usado por el worker externo)
 */
export const bheUpdateJobSchema = z.object({
  job_id: z
    .string()
    .uuid("El ID del job debe ser un UUID válido"),
  
  status: z
    .enum(["processing", "done", "failed"], {
      message: "El estado debe ser processing, done o failed",
    }),
  
  result_folio: z
    .string()
    .optional()
    .nullable(),
  
  result_pdf_bucket: z
    .string()
    .optional()
    .nullable(),
  
  result_pdf_path: z
    .string()
    .optional()
    .nullable(),
  
  last_error: z
    .string()
    .optional()
    .nullable(),
  
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable(),
});

export type BHEUpdateJobData = z.infer<typeof bheUpdateJobSchema>;

