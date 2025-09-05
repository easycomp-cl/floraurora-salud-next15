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
  user_id: string; // UUID de Supabase Auth
  created_at: string;
};
