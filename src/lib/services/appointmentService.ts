import supabase from '@/utils/supabase/client';
import type { Professional, Service, TimeSlot } from '@/lib/types/appointment';
import type { BlockedSlot } from '@/lib/types/availability';
import { AvailabilityService } from './availabilityService';

export const appointmentService = {
  // Obtener todas las áreas disponibles (professional_titles)
  async getAreas(): Promise<{ id: number; title_name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('professional_titles')
        .select('id, title_name')
        .eq('is_active', true)
        .order('title_name');

      if (error) throw error;
      
      console.log("getAreas-data", data);
      // Transformar los datos para asegurar los tipos correctos
      return (data || []).map((area: { id: unknown; title_name: unknown }) => ({
        id: Number(area.id),
        title_name: String(area.title_name)
      }));
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  },

  // Obtener todos los profesionales activos con sus especialidades y títulos
  async getProfessionals(areaFilter?: number): Promise<Professional[]> {
    try {
      const query = supabase
        .from('professionals')
        .select(`
          id,
          profile_description,
          professional_titles!inner(
            id,
            title_name
          ),
          users!inner(
            name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq('title_id', areaFilter || 0)
        .eq('is_active', true)
        .eq('users.is_active', true);

console.log("getProfessionals-query", query);
      const { data, error } = await query;
console.log("getProfessionals-data", data);
      if (error) throw error;

      // Obtener las especialidades para cada profesional
      const professionalsWithSpecialties = await Promise.all(
        (data || []).map(async (prof: { id: unknown; profile_description: unknown; professional_titles: unknown; users: unknown }) => {
          // Consultar especialidades del profesional
          const { data: specialtiesData, error: specialtiesError } = await supabase
            .from('professional_specialties')
            .select(`
              specialties(
                name
              )
            `)
            .eq('professional_id', Number(prof.id));

          if (specialtiesError) {
            console.warn(`Error fetching specialties for professional ${Number(prof.id)}:`, specialtiesError);
          }

          const specialties = specialtiesData?.map((ps: { specialties: unknown }) => {
            const specialty = ps.specialties as { name?: unknown } | null;
            return specialty?.name ? String(specialty.name) : null;
          }).filter((name): name is string => Boolean(name)) || [];

          const users = prof.users as { name?: unknown; last_name?: unknown; email?: unknown; phone_number?: unknown };
          const professionalTitles = prof.professional_titles as { title_name?: unknown; id?: unknown };
          const profData = prof as { resume_url?: unknown; is_active?: unknown; created_at?: unknown };

          return {
            id: Number(prof.id),
            user_id: String(prof.id), // Usar el id del profesional como user_id temporalmente
            name: String(users?.name || ''),
            last_name: String(users?.last_name || ''),
            email: String(users?.email || ''),
            phone_number: String(users?.phone_number || ''),
            title_name: String(professionalTitles?.title_name || ''),
            title_id: Number(professionalTitles?.id || 0),
            profile_description: String(prof.profile_description || ''),
            resume_url: String(profData?.resume_url || ''),
            specialties: specialties,
            is_active: Boolean(profData?.is_active),
            created_at: String(profData?.created_at || new Date().toISOString())
          };
        })
      );
console.log("professionalsWithSpecialties", professionalsWithSpecialties);
      return professionalsWithSpecialties.sort((a, b) => `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`));
    } catch (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }
  },

  // Obtener servicios por profesional basados en sus especialidades
  async getServicesByProfessional(professionalId: number): Promise<Service[]> {
    try {
      console.log(`\n=== CONSULTANDO SERVICIOS PARA PROFESIONAL ${professionalId} ===`);
      
      // Primero obtener todas las especialidades disponibles
      const { data: allSpecialties, error: specialtiesError } = await supabase
        .from('specialties')
        .select('*')
        .order('name');

      if (specialtiesError) {
        console.error('Error al obtener especialidades:', specialtiesError);
        return [];
      }

      console.log('Todas las especialidades disponibles:', allSpecialties);

      // Obtener las especialidades específicas del profesional
      const { data: professionalSpecialties, error: profSpecialtiesError } = await supabase
        .from('professional_specialties')
        .select('specialty_id')
        .eq('professional_id', professionalId);

      if (profSpecialtiesError) {
        console.error('Error al obtener especialidades del profesional:', profSpecialtiesError);
        return [];
      }

      const professionalSpecialtyIds = professionalSpecialties?.map(ps => ps.specialty_id) || [];
      console.log('IDs de especialidades del profesional:', professionalSpecialtyIds);

      // Filtrar las especialidades que pertenecen al profesional
      const professionalSpecialtiesList = allSpecialties?.filter(specialty => 
        professionalSpecialtyIds.includes(specialty.id)
      ) || [];

      console.log('Especialidades del profesional:', professionalSpecialtiesList);

      if (professionalSpecialtiesList.length === 0) {
        console.log('El profesional no tiene especialidades configuradas');
        return [];
      }

      // Crear servicios basados en las especialidades del profesional
      console.log('Creando servicios basados en especialidades del profesional');
      return professionalSpecialtiesList.map((specialty, index) => ({
        id: Number(specialty.id),
        name: `Consulta de ${specialty.name}`,
        description: `Sesión de terapia especializada en ${specialty.name} de 55 minutos`,
        duration_minutes: 55,
        price: 50000 + (index * 10000), // Precio variable por especialidad
        professional_id: professionalId,
        is_active: true,
        created_at: String(specialty.created_at) || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Obtener horarios disponibles por profesional y fecha basados en disponibilidad real
  async getAvailableTimeSlots(
    professionalId: number, 
    date: string
  ): Promise<TimeSlot[]> {
    console.log(`\n=== CONSULTA DE HORARIOS DISPONIBLES ===`);
    console.log(`Profesional ID: ${professionalId}`);
    console.log(`Fecha: ${date}`);

    try {
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const selectedDate = new Date(date + 'T00:00:00');
      console.log("getAvailableTimeSlots-selectedDate", selectedDate);
      const dayOfWeek = selectedDate.getDay();
      
console.log("getAvailableTimeSlots-dayOfWeek", dayOfWeek);

      // Verificar que la fecha no sea más de 2 semanas en el futuro
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
      const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
      
      if (selectedDate < today || selectedDate > twoWeeksFromNow) {
        console.log(`Fecha fuera del rango permitido: ${selectedDate} (hoy: ${today}, límite: ${twoWeeksFromNow})`);
        return [];
      }

      // Obtener la configuración de disponibilidad del profesional y citas existentes
      const [weeklyRules, overrides, blockedSlots, existingAppointments] = await Promise.all([
        AvailabilityService.getAvailabilityRules(professionalId),
        AvailabilityService.getAvailabilityOverrides(professionalId),
        AvailabilityService.getBlockedSlots(professionalId),
        this.getExistingAppointments(professionalId, date)
      ]);

      // Buscar reglas para el día de la semana
      // JavaScript y BD usan el mismo formato: 0=domingo, 1=lunes, ..., 6=sábado
      const dayRules = weeklyRules.filter(rule => rule.weekday === dayOfWeek);
      
      console.log(`\n=== CONSULTA DE DISPONIBILIDAD ===`);
      console.log(`Fecha: ${date}, Día de la semana: ${dayOfWeek} (0=domingo, 1=lunes, ..., 6=sábado)`);
      console.log('Reglas semanales encontradas:', dayRules);
      console.log('Citas existentes:', existingAppointments);
      
      // Buscar excepciones para la fecha específica
      const dateOverrides = overrides.filter(override => override.for_date === date);
      console.log('Excepciones de fecha encontradas:', dateOverrides);
      
      // Buscar bloques de tiempo que afecten esta fecha
      const dateBlockedSlots = blockedSlots.filter(blocked => {
        const blockedDate = new Date(blocked.starts_at).toISOString().split('T')[0];
        return blockedDate === date;
      });
      console.log('Bloques de tiempo encontrados:', dateBlockedSlots);

      // Si hay excepciones para esta fecha, usar esas en lugar de las reglas semanales
      let availableSlots: { start_time: string; end_time: string }[] = [];
      
      if (dateOverrides.length > 0) {
        // Usar excepciones de fecha
        availableSlots = dateOverrides
          .filter(override => override.is_available)
          .map(override => ({
            start_time: override.start_time,
            end_time: override.end_time
          }));
        console.log('Usando excepciones de fecha:', availableSlots);
      } else if (dayRules.length > 0) {
        // Usar reglas semanales
        availableSlots = dayRules.map(rule => ({
          start_time: rule.start_time,
          end_time: rule.end_time
        }));
        console.log('Usando reglas semanales:', availableSlots);
      } else {
        console.log('No se encontraron reglas ni excepciones para esta fecha');
        // No crear reglas por defecto - solo usar las configuradas en la BD
        console.log('Esta fecha no tiene disponibilidad configurada');
      }

      // Generar slots de 1 hora basados en la disponibilidad
      const timeSlots: TimeSlot[] = [];
      
      console.log('Generando slots para', availableSlots.length, 'ventanas de disponibilidad');
      
      for (const slot of availableSlots) {
        console.log(`Procesando ventana: ${slot.start_time} - ${slot.end_time}`);
        const slots = this.generateTimeSlots(slot.start_time, slot.end_time, 60);
        console.log(`Slots generados:`, slots);
        
        for (const timeSlot of slots) {
          // Verificar si este slot está bloqueado
          const isBlocked = this.isTimeSlotBlocked(
            timeSlot.start_time, 
            timeSlot.end_time, 
            date, 
            dateBlockedSlots
          );
          
          // Verificar si este horario ya está reservado
          const isBooked = this.isTimeSlotBooked(
            timeSlot.start_time,
            existingAppointments
          );
          
          if (!isBlocked && !isBooked) {
            timeSlots.push({
              id: timeSlots.length + 1,
              professional_id: professionalId,
              date: date,
              start_time: timeSlot.start_time,
              end_time: timeSlot.end_time,
              is_available: true,
              is_booked: false,
              created_at: new Date().toISOString()
            });
          } else {
            console.log(`Slot no disponible: ${timeSlot.start_time} - ${timeSlot.end_time} (bloqueado: ${isBlocked}, reservado: ${isBooked})`);
          }
        }
      }
      
      console.log(`Total de slots disponibles generados: ${timeSlots.length}`);

      return timeSlots;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  // Generar slots de tiempo de 1 hora exacta (9:00, 10:00, 11:00, etc.)
  generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): { start_time: string; end_time: string }[] {
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime) === 0 ? 1440 : timeToMinutes(endTime);
    
    console.log(`Generando slots: ${startTime} (${startMinutes} min) hasta ${endTime} (${endMinutes} min)`);
    
    const slots: { start_time: string; end_time: string }[] = [];
    
    // Generar slots de 1 hora exacta (solo horas completas)
    for (let current = startMinutes; current + durationMinutes <= endMinutes; current += durationMinutes) {
      const slotStart = minutesToTime(current);
      const slotEnd = minutesToTime(current + durationMinutes);
      
      // Solo incluir slots que empiecen en horas exactas (minutos = 0)
      const [, minutes] = slotStart.split(':').map(Number);
      if (minutes === 0) {
        slots.push({
          start_time: slotStart,
          end_time: slotEnd
        });
      }
    }
    
    console.log(`Slots generados (${slots.length}):`, slots.map(s => `${s.start_time}-${s.end_time}`));
    return slots;
  },

  // Verificar si un slot de tiempo está bloqueado
  isTimeSlotBlocked(
    startTime: string, 
    endTime: string, 
    date: string, 
    blockedSlots: BlockedSlot[]
  ): boolean {
    const slotStart = new Date(`${date}T${startTime}:00`);
    const slotEnd = new Date(`${date}T${endTime}:00`);
    
    return blockedSlots.some(blocked => {
      const blockedStart = new Date(blocked.starts_at);
      const blockedEnd = new Date(blocked.ends_at);
      
      // Verificar si hay solapamiento
      return slotStart < blockedEnd && slotEnd > blockedStart;
    });
  },

  // Verificar si un slot de tiempo ya está reservado
  isTimeSlotBooked(
    startTime: string,
    existingAppointments: { time: string }[]
  ): boolean {
    return existingAppointments.some(appointment => 
      appointment.time === startTime
    );
  },

  // Obtener fechas disponibles para un profesional en las próximas 2 semanas
  async getAvailableDates(professionalId: number): Promise<string[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
      const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
      
      // Obtener la configuración de disponibilidad del profesional
      const [weeklyRules, overrides] = await Promise.all([
        AvailabilityService.getAvailabilityRules(professionalId),
        AvailabilityService.getAvailabilityOverrides(professionalId)
      ]);

      console.log(`\n=== CALCULANDO FECHAS DISPONIBLES ===`);
      console.log(`Reglas semanales encontradas:`, weeklyRules);
      console.log(`Excepciones encontradas:`, overrides);

      const availableDates: string[] = [];
      
      // Iterar por cada día en las próximas 2 semanas
      for (let date = new Date(today); date <= twoWeeksFromNow; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        
        // JavaScript y BD usan el mismo formato: 0=domingo, 1=lunes, ..., 6=sábado
        const dayRules = weeklyRules.filter(rule => rule.weekday === dayOfWeek);
        
        // Verificar si hay excepciones para esta fecha específica
        const dateOverrides = overrides.filter(override => override.for_date === dateString);
        
        let isDateAvailable = false;
        
        if (dateOverrides.length > 0) {
          // Si hay excepciones, verificar si alguna es de disponibilidad
          isDateAvailable = dateOverrides.some(override => override.is_available);
          console.log(`Fecha ${dateString}: Excepción encontrada - Disponible: ${isDateAvailable}`);
        } else if (dayRules.length > 0) {
          // Si hay reglas semanales para este día, está disponible
          isDateAvailable = true;
          console.log(`Fecha ${dateString}: Regla semanal encontrada - Disponible: ${isDateAvailable}`);
        } else {
          console.log(`Fecha ${dateString}: Sin reglas ni excepciones - No disponible`);
        }
        
        if (isDateAvailable) {
          availableDates.push(dateString);
        }
      }
      
      console.log(`Fechas disponibles calculadas:`, availableDates);
      return availableDates;
    } catch (error) {
      console.error('Error fetching available dates:', error);
      throw error;
    }
  },

  // Crear una cita real en la base de datos
  async createAppointment(appointmentData: {
    professional_id: number;
    service_id: number;
    date: string;
    time: string;
    user_id: string;
    notes?: string;
  }) {
    try {
      // Crear el timestamp combinando fecha y hora
      const scheduledAt = new Date(`${appointmentData.date}T${appointmentData.time}:00.000Z`);
      
      const appointmentRecord = {
        patient_id: parseInt(appointmentData.user_id),
        professional_id: appointmentData.professional_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 55, // Duración por defecto
        status: 'confirmed',
        payment_status: 'pending',
        note: appointmentData.notes || null,
        area: 'Psicología', // Por ahora hardcodeado
        service: 'Consulta Individual' // Por ahora hardcodeado
      };

      console.log('Creando cita:', appointmentRecord);

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentRecord)
        .select()
        .single();

      if (error) {
        console.error('Error al crear cita:', error);
        throw error;
      }

      console.log('Cita creada exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Obtener citas existentes para un profesional en una fecha específica
  async getExistingAppointments(professionalId: number, date: string): Promise<{ time: string }[]> {
    try {
      // Crear rango de fechas para el día completo
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('professional_id', professionalId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .eq('status', 'confirmed'); // Solo citas confirmadas

      if (error) {
        console.error('Error al obtener citas existentes:', error);
        return [];
      }

      console.log(`Citas existentes para ${date}:`, data);
      
      // Extraer solo la hora de scheduled_at
      return (data || []).map(appointment => {
        const scheduledAt = new Date(String(appointment.scheduled_at));
        const timeString = scheduledAt.toTimeString().substring(0, 5); // HH:MM
        return { time: timeString };
      });
    } catch (error) {
      console.error('Error inesperado al obtener citas:', error);
      return [];
    }
  },

  // Verificar disponibilidad de un horario específico
  async checkTimeSlotAvailability(
    professionalId: number, 
    date: string, 
    time: string
  ): Promise<boolean> {
    try {
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const selectedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();
      
      // Obtener configuración de disponibilidad
      const [weeklyRules, overrides, blockedSlots, existingAppointments] = await Promise.all([
        AvailabilityService.getAvailabilityRules(professionalId),
        AvailabilityService.getAvailabilityOverrides(professionalId),
        AvailabilityService.getBlockedSlots(professionalId),
        this.getExistingAppointments(professionalId, date)
      ]);

      // Verificar reglas semanales
      const dayRules = weeklyRules.filter(rule => rule.weekday === dayOfWeek);
      const dateOverrides = overrides.filter(override => override.for_date === date);
      
      let isAvailable = false;
      
      if (dateOverrides.length > 0) {
        // Verificar excepciones de fecha
        isAvailable = dateOverrides.some(override => 
          override.is_available && 
          time >= override.start_time && 
          time < override.end_time
        );
      } else if (dayRules.length > 0) {
        // Verificar reglas semanales
        isAvailable = dayRules.some(rule => 
          time >= rule.start_time && 
          time < rule.end_time
        );
      }

      // Verificar si está bloqueado
      const isBlocked = this.isTimeSlotBlocked(time, this.addOneHour(time), date, blockedSlots);
      
      // Verificar si ya está reservado
      const isBooked = this.isTimeSlotBooked(time, existingAppointments);

      return isAvailable && !isBlocked && !isBooked;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  },

  // Función auxiliar para agregar una hora
  addOneHour(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};
