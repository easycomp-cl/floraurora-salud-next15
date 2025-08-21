export interface Professional {
  id: string;
  name: string;
  title: string;
  specialty: string;
  avatar_url?: string;
  bio?: string;
  rating?: number;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  professional_id: string;
  is_active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  professional_id: string;
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
