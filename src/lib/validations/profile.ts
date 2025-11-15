import { z } from "zod";

// Función para validar RUT chileno
const validateRUT = (rut: string): boolean => {
  // Limpiar el RUT (quitar puntos y guiones)
  const cleanRut = rut.replace(/[.-]/g, "");
  
  // Verificar que tenga el formato correcto (8-9 dígitos + dígito verificador)
  if (!/^\d{7,8}[\dkK]$/i.test(cleanRut)) {
    return false;
  }

  const rutBody = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();

  // Calcular dígito verificador
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

// Función para validar teléfono chileno (incluyendo formato WhatsApp)
const validatePhone = (phone: string): boolean => {
  // Limpiar el teléfono (quitar espacios, guiones, paréntesis, +)
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  
  // Verificar que sea un número chileno válido:
  // - 8-9 dígitos (formato local): 12345678 o 123456789
  // - 11 dígitos con código de país: 56912345678
  // - 12 dígitos con código de país y +: 56912345678
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

// Esquema base para usuario
export const userProfileSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios"),
  
  last_name: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras y espacios"),
  
  phone_number: z
    .string()
    .min(1, "El teléfono es obligatorio")
    .refine(validatePhone, "El teléfono debe ser un número chileno válido (8-9 dígitos o formato WhatsApp: +569 1234 5678)"),
  
  address: z
    .string()
    .min(10, "La dirección debe tener al menos 10 caracteres")
    .max(200, "La dirección no puede exceder 200 caracteres"),
  
  birth_date: z
    .string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine(validateBirthDate, "Debes ser mayor de 18 años"),
  
  gender: z
    .string()
    .min(1, "El género es obligatorio"),
  
  nationality: z
    .string()
    .min(1, "La nacionalidad es obligatoria"),
  
  rut: z
    .string()
    .min(1, "El RUT es obligatorio")
    .refine(validateRUT, "El RUT no es válido. Formato: 12.345.678-9"),
});

// Esquema para perfil de paciente
export const patientProfileSchema = z.object({
  emergency_contact_name: z
    .string()
    .min(2, "El nombre del contacto de emergencia debe tener al menos 2 caracteres")
    .max(50, "El nombre del contacto de emergencia no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras y espacios"),
  
  emergency_contact_phone: z
    .string()
    .min(1, "El teléfono de contacto de emergencia es obligatorio")
    .refine((phone) => {
      // Contar solo los dígitos en el teléfono
      const digitsOnly = phone.replace(/\D/g, "");
      return digitsOnly.length >= 8;
    }, "El teléfono debe tener al menos 8 dígitos")
    .max(12, "El teléfono no puede exceder 12 caracteres (formato: +569 1234 5678)")
    .regex(/^[\d\s\+\-\(\)]+$/, "El teléfono solo puede contener números, espacios, +, - y paréntesis"),
  
  health_insurances_id: z
    .number()
    .optional()
    .or(z.literal(0)),
});

// Esquema para perfil profesional
export const professionalProfileSchema = z.object({
  title_id: z
    .number()
    .min(1, "Debes seleccionar una profesión"),
  
  profile_description: z
    .string()
    .min(20, "La descripción del perfil debe tener al menos 20 caracteres")
    .max(1000, "La descripción no puede exceder 1000 caracteres"),
  
  resume_url: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

// Esquema completo para validación del formulario
export const profileFormSchema = z.object({
  // Campos base del usuario
  name: userProfileSchema.shape.name,
  last_name: userProfileSchema.shape.last_name,
  phone_number: userProfileSchema.shape.phone_number,
  address: userProfileSchema.shape.address,
  birth_date: userProfileSchema.shape.birth_date,
  gender: userProfileSchema.shape.gender,
  nationality: userProfileSchema.shape.nationality,
  rut: userProfileSchema.shape.rut,
  
  // Perfil específico según el rol
  patientProfile: patientProfileSchema.optional(),
  professionalProfile: professionalProfileSchema.optional(),
});

// Tipos TypeScript derivados de los esquemas
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type PatientProfileFormData = z.infer<typeof patientProfileSchema>;
export type ProfessionalProfileFormData = z.infer<typeof professionalProfileSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;

// Función para formatear RUT mientras el usuario escribe
export const formatRUT = (value: string): string => {
  // Remover caracteres no numéricos excepto K y guión
  const cleanValue = value.replace(/[^0-9kK-]/g, "");
  
  if (cleanValue.length === 0) return "";
  
  // Si ya tiene guión, separar la parte numérica del dígito verificador
  if (cleanValue.includes('-')) {
    const [digits, dv] = cleanValue.split('-');
    const formattedDigits = formatRUTDigits(digits);
    return `${formattedDigits}-${dv}`;
  }
  
  // Si no tiene guión, formatear solo los dígitos
  const digits = cleanValue.slice(0, 8);
  return formatRUTDigits(digits);
};

// Función auxiliar para formatear solo los dígitos del RUT
const formatRUTDigits = (digits: string): string => {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, -3)}.${digits.slice(-3)}`;
  return `${digits.slice(0, -6)}.${digits.slice(-6, -3)}.${digits.slice(-3)}`;
};

// Función para formatear teléfono mientras el usuario escribe
export const formatPhone = (value: string): string => {
  // Limpiar el valor manteniendo solo números y +
  const cleanValue = value.replace(/[^\d+]/g, "");
  
  if (cleanValue.length === 0) return "";
  
  // Si empieza con +569 (formato WhatsApp)
  if (cleanValue.startsWith("+569")) {
    const digits = cleanValue.slice(4); // Quitar +569
    if (digits.length <= 4) return `+569 ${digits}`;
    if (digits.length <= 8) return `+569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `+569 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  
  // Si empieza con 569 (formato WhatsApp sin +)
  if (cleanValue.startsWith("569")) {
    const digits = cleanValue.slice(3); // Quitar 569
    if (digits.length <= 4) return `569 ${digits}`;
    if (digits.length <= 8) return `569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `569 ${digits.slice(0, 4)} ${digits.slice(4, 8)}`;
  }
  
  // Formato local (8-9 dígitos)
  if (cleanValue.length <= 4) return cleanValue;
  if (cleanValue.length <= 8) return `${cleanValue.slice(0, 4)} ${cleanValue.slice(4)}`;
  return `${cleanValue.slice(0, 4)} ${cleanValue.slice(4, 8)}`;
};
