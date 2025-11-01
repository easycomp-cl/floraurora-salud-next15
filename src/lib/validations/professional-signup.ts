import { z } from "zod";

// Función para validar RUT chileno
const validateRUT = (rut: string): boolean => {
  const cleanRut = rut.replace(/[.-]/g, "");
  
  if (!/^\d{7,8}[\dkK]$/i.test(cleanRut)) {
    return false;
  }

  const rutBody = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const calculatedDV = remainder === 0 ? "0" : remainder === 1 ? "K" : (11 - remainder).toString();

  return dv === calculatedDV;
};

// Función para validar teléfono chileno
const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  return /^([2-9]\d{7,8}|569\d{8})$/.test(cleanPhone);
};

// Función para validar fecha de nacimiento (debe ser mayor de 18 años)
const validateBirthDate = (date: string): boolean => {
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};

// ETAPA 1: Datos Personales
export const personalDataSchema = z.object({
  first_name: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(2, "⚠️ Los nombres deben tener al menos 2 caracteres")
    .max(50, "⚠️ Los nombres no pueden exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "⚠️ Solo se permiten letras y espacios"),
  
  last_name_p: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(2, "⚠️ El apellido paterno debe tener al menos 2 caracteres")
    .max(50, "⚠️ El apellido paterno no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "⚠️ Solo se permiten letras y espacios"),
  
  last_name_m: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(2, "⚠️ El apellido materno debe tener al menos 2 caracteres")
    .max(50, "⚠️ El apellido materno no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "⚠️ Solo se permiten letras y espacios"),
  
  rut: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .refine(validateRUT, "⚠️ RUT inválido. Usa el formato: 12.345.678-9"),
  
  birth_date: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .refine(validateBirthDate, "⚠️ Debes ser mayor de 18 años para registrarte"),
  
  email: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .email("⚠️ Ingresa un email válido (ejemplo: usuario@dominio.com)"),
  
  phone_number: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .refine(validatePhone, "⚠️ Ingresa un teléfono válido (ej: +56912345678 o 912345678)"),
});

// ETAPA 2: Datos Académicos
export const academicDataSchema = z.object({
  university: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(2, "⚠️ Ingresa el nombre completo de tu universidad")
    .max(100, "⚠️ El nombre de la universidad no puede exceder 100 caracteres"),
  
  profession: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(2, "⚠️ Ingresa tu profesión o carrera")
    .max(100, "⚠️ El nombre de la profesión no puede exceder 100 caracteres"),
  
  study_year_start: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .regex(/^\d{4}$/, "⚠️ Ingresa el año en formato YYYY (ej: 2015)")
    .refine((year) => {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      return yearNum >= 1950 && yearNum <= currentYear;
    }, "⚠️ El año debe estar entre 1950 y el año actual"),
  
  study_year_end: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .regex(/^\d{4}$/, "⚠️ Ingresa el año en formato YYYY (ej: 2020)")
    .refine((year) => {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      return yearNum >= 1950 && yearNum <= currentYear;
    }, "⚠️ El año debe estar entre 1950 y el año actual"),
  
  extra_studies: z
    .string()
    .max(500, "⚠️ Los estudios adicionales no pueden exceder 500 caracteres")
    .optional()
    .default(""),
  
  superintendence_number: z
    .string()
    .min(1, "⚠️ Este campo es obligatorio")
    .min(3, "⚠️ El número de inscripción debe tener al menos 3 caracteres")
    .max(20, "⚠️ El número de inscripción no puede exceder 20 caracteres")
    .regex(/^[A-Za-z0-9]+$/, "⚠️ Solo se permiten letras y números"),
});

// ETAPA 3: Archivos Requeridos
export const documentsSchema = z.object({
  degree_copy: z
    .instanceof(File)
    .refine((file) => file.size > 0, "⚠️ Debes subir una copia de tu título universitario")
    .refine((file) => file.size <= 5 * 1024 * 1024, "⚠️ El archivo no puede exceder 5MB")
    .refine(
      (file) => ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "⚠️ Solo se permiten archivos PDF, PNG, JPG o JPEG"
    ),
  
  id_copy: z
    .instanceof(File)
    .refine((file) => file.size > 0, "⚠️ Debes subir una copia de tu cédula de identidad")
    .refine((file) => file.size <= 5 * 1024 * 1024, "⚠️ El archivo no puede exceder 5MB")
    .refine(
      (file) => ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "⚠️ Solo se permiten archivos PDF, PNG, JPG o JPEG"
    )
    .optional(),
  
  professional_certificate: z
    .instanceof(File)
    .refine((file) => file.size > 0, "⚠️ Debes subir tu certificado profesional")
    .refine((file) => file.size <= 5 * 1024 * 1024, "⚠️ El archivo no puede exceder 5MB")
    .refine(
      (file) => ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "⚠️ Solo se permiten archivos PDF, PNG, JPG o JPEG"
    )
    .optional(),
  
  additional_certificates: z
    .array(z.instanceof(File))
    .max(5, "⚠️ Puedes subir máximo 5 certificados adicionales")
    .refine(
      (files) => files.every(file => file.size <= 5 * 1024 * 1024),
      "⚠️ Cada archivo no puede exceder 5MB"
    )
    .refine(
      (files) => files.every(file => 
        ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type)
      ),
      "⚠️ Solo se permiten archivos PDF, PNG, JPG o JPEG"
    )
    .optional()
    .default([]),
});

// ETAPA 4: Plan de Pago
export const paymentPlanSchema = z.object({
  plan_type: z
    .enum(["light", "monthly"])
    .refine((val) => val !== undefined, {
      message: "⚠️ Debes seleccionar un plan de pago"
    }),
  accept_terms: z
    .boolean()
    .refine((val) => val === true, {
      message: "⚠️ Debes aceptar los términos y condiciones para continuar"
    }),
});

// Esquema completo
export const professionalSignupSchema = z.object({
  personalData: personalDataSchema,
  academicData: academicDataSchema,
  documents: documentsSchema,
  paymentPlan: paymentPlanSchema,
});

// Tipos TypeScript
export type PersonalDataFormData = z.infer<typeof personalDataSchema>;
export type AcademicDataFormData = z.infer<typeof academicDataSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type PaymentPlanFormData = z.infer<typeof paymentPlanSchema>;
export type ProfessionalSignupFormData = z.infer<typeof professionalSignupSchema>;

// Función para formatear RUT mientras el usuario escribe
export const formatRUT = (value: string): string => {
  const cleanValue = value.replace(/[^0-9kK-]/g, "");
  
  if (cleanValue.length === 0) return "";
  
  if (cleanValue.includes('-')) {
    const [digits, dv] = cleanValue.split('-');
    const formattedDigits = formatRUTDigits(digits);
    return `${formattedDigits}-${dv}`;
  }
  
  const digits = cleanValue.slice(0, 8);
  return formatRUTDigits(digits);
};

const formatRUTDigits = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, -3)}.${digits.slice(-3)}`;
  return `${digits.slice(0, -6)}.${digits.slice(-6, -3)}.${digits.slice(-3)}`;
};

// Función para formatear teléfono mientras el usuario escribe
export const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/[^\d+]/g, "");
  
  if (cleanValue.length === 0) return "";
  
  if (cleanValue.startsWith("+569")) {
    const digits = cleanValue.slice(4);
    if (digits.length <= 4) return `+569 ${digits}`;
    if (digits.length <= 8) return `+569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `+569 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  
  if (cleanValue.startsWith("569")) {
    const digits = cleanValue.slice(3);
    if (digits.length <= 4) return `569 ${digits}`;
    if (digits.length <= 8) return `569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `569 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  
  if (cleanValue.length <= 4) return cleanValue;
  if (cleanValue.length <= 8) return `${cleanValue.slice(0, 4)} ${cleanValue.slice(4)}`;
  return `${cleanValue.slice(0, 4)} ${cleanValue.slice(4, 8)}`;
};
