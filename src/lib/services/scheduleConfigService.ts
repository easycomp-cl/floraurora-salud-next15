import { createAdminServer } from "@/utils/supabase/server";

export interface ScheduleHoursConfig {
  startHour: string; // Formato HH:MM (ej: "08:00")
  endHour: string; // Formato HH:MM (ej: "23:00")
}

/**
 * Obtiene las configuraciones de horas permitidas para crear horarios desde la base de datos
 * Si no se encuentran, retorna valores por defecto
 */
export async function getScheduleHoursConfig(): Promise<ScheduleHoursConfig> {
  const supabase = createAdminServer();

  const configKeys = [
    "schedule_start_hour",
    "schedule_end_hour",
  ];

  const { data: configurations, error } = await supabase
    .from("system_configurations")
    .select("config_key, config_value, data_type, is_active")
    .in("config_key", configKeys)
    .eq("is_active", true);

  if (error) {
    console.warn("[scheduleConfigService] Error obteniendo configuraciones:", error);
  }

  // Valores por defecto
  const defaults: ScheduleHoursConfig = {
    startHour: "08:00",
    endHour: "23:00",
  };

  if (!configurations || configurations.length === 0) {
    return defaults;
  }

  // Convertir configuraciones a objeto
  const configMap = new Map<string, string>();
  
  configurations.forEach((config) => {
    if (config.data_type === "string" && config.is_active) {
      configMap.set(config.config_key, config.config_value);
    }
  });

  return {
    startHour: configMap.get("schedule_start_hour") ?? defaults.startHour,
    endHour: configMap.get("schedule_end_hour") ?? defaults.endHour,
  };
}

/**
 * Genera un array de slots de tiempo desde startHour hasta endHour (incluyendo 00:00 si es necesario)
 * @param startHour - Hora inicial (ej: "08:00")
 * @param endHour - Hora final (ej: "23:00")
 * @returns Array de horas en formato HH:MM
 */
export function generateTimeSlots(startHour: string, endHour: string): string[] {
  const slots: string[] = [];
  
  // Convertir horas a minutos para facilitar el cálculo
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const startMinutes = timeToMinutes(startHour);
  const endMinutes = timeToMinutes(endHour);
  
  // Si endHour es 00:00, significa que va hasta medianoche (1440 minutos)
  const actualEndMinutes = endMinutes === 0 ? 1440 : endMinutes;
  
  // Generar slots cada hora desde startHour hasta endHour
  for (let minutes = startMinutes; minutes <= actualEndMinutes; minutes += 60) {
    const time = minutesToTime(minutes);
    slots.push(time);
    
    // Si llegamos a 1440 minutos (00:00), agregarlo y terminar
    if (minutes === 1440) {
      break;
    }
  }
  
  return slots;
}
