// Tipos para la configuración de disponibilidad de profesionales

export interface AvailabilityRule {
  id?: number;
  professional_id: number;
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time: string; // Formato HH:MM
  end_time: string; // Formato HH:MM
  created_at?: string;
}

export interface AvailabilityOverride {
  id?: number;
  professional_id: number;
  for_date: string; // Formato YYYY-MM-DD
  start_time: string; // Formato HH:MM
  end_time: string; // Formato HH:MM
  is_available: boolean; // true: ventana disponible, false: ventana bloqueada
  created_at?: string;
}

export interface BlockedSlot {
  id?: number;
  professional_id: number;
  starts_at: string; // Formato ISO string con timezone
  ends_at: string; // Formato ISO string con timezone
  reason?: string;
  created_at?: string;
}

// Tipos para formularios
export interface WeeklyScheduleForm {
  weekday: number;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  id?: string; // ID temporal para el formulario
  start_time: string;
  end_time: string;
}

export interface BlockedSlotForm {
  starts_at: string; // Formato ISO string
  ends_at: string; // Formato ISO string
  reason: string;
}

export interface DateOverrideForm {
  for_date: string; // Formato YYYY-MM-DD
  timeSlots: TimeSlot[];
  is_available: boolean;
}

// Tipos para la vista de disponibilidad
export interface AvailabilityView {
  weeklyRules: AvailabilityRule[];
  overrides: AvailabilityOverride[];
  blockedSlots: BlockedSlot[];
}

// Constantes para los días de la semana
export const WEEKDAYS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

// Horarios predefinidos comunes - Solo horas completas de 08:00 a 00:00
export const COMMON_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00', '00:00'
];
