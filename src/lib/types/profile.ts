export type Profile = {
  id: number;
  rut?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role: number; // 1=admin, 2=patient, 3=professional
  is_active?: boolean;
  birth_date?: string;
  address?: string;
  gender?: string;
  nationality?: string;
  user_id: string; // UUID de Supabase Auth
  created_at: string;
  // Campos de paciente si aplica
  patient_id?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  health_insurances_id?: number;
};

// Interfaz para datos de paciente basada en la tabla real
export interface PatientProfile {
  id: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  health_insurances_id: number;
  created_at: string;
}

export type UserProfile = {
  id: number;
  rut?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role: number; // 1=admin, 2=patient, 3=professional
  is_active?: boolean;
  birth_date?: string;
  address?: string;
  region?: number;
  municipality?: number;
  gender?: string;
  nationality?: string;
  user_id: string; // UUID de Supabase Auth
  created_at: string;
};

// Interfaz para títulos profesionales
export interface ProfessionalTitle {
  id: number;
  title_name: string;
  is_active: boolean;
  created_at: string;
}

// Interfaz para especialidades profesionales
export interface ProfessionalSpecialty {
  id: number;
  name: string;
  title_id: number | null;
  created_at: string;
  professional_amount?: number | null; // Precio asignado por el profesional
  minimum_amount?: number | null; // Precio mínimo permitido desde specialties
  maximum_amount?: number | null; // Precio máximo permitido desde specialties
}

// Interfaz para enfoques terapéuticos
export interface TherapeuticApproach {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz para profesionales basada en la tabla real
export interface ProfessionalProfile {
  id: number;
  title_id: number | null;
  approach_id: number | null; // Enfoque terapéutico (relación 1:1)
  profile_description: string | null;
  resume_url: string | null;
  created_at: string;
  // Campos relacionados que se obtienen por JOIN
  title?: ProfessionalTitle;
  specialties?: ProfessionalSpecialty[];
  approach?: TherapeuticApproach;
}