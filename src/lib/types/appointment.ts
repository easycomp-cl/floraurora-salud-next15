export interface Professional {
  id: number;
  user_id: string;
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  title_name?: string;
  title_id?: number;
  profile_description?: string;
  resume_url?: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
}

export interface Specialty {
  id: number;
  name: string;
  title_id: number;
  created_at: string;
}

export interface ProfessionalTitle {
  id: number;
  title_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  professional_id: number;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  professional_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_booked: boolean;
  created_at: string;
}

export interface AppointmentSummary {
  professional: Professional | null;
  service: Service | null;
  date: string | null;
  time: string | null;
  total_price: number;
  duration_minutes: number;
}

export interface AppointmentFormData {
  professional_id: string;
  service_id: string;
  date: string;
  time: string;
  notes?: string;
}
