import supabase from '@/utils/supabase/client';
import type { Professional, Service, TimeSlot } from '@/lib/types/appointment';
import type { BlockedSlot } from '@/lib/types/availability';
import { DateTime } from 'luxon';
import { AvailabilityService } from './availabilityService';

type RawAppointmentRow = {
  id: string; // El ID es de tipo text con formato "APT-00000060"
  patient_id: number | null;
  professional_id: number | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  payment_status: string | null;
  note: string | null;
  area: string | null;
  service: string | null;
  meet_link: string | null;
};

export type AppointmentWithUsers = RawAppointmentRow & {
  patient: BasicUserInfo | null;
  professional: BasicUserInfo | null;
  meeting_url: string | null;
  amount: number | null;
  invoice_url: string | null;
};

export type BasicUserInfo = {
  id: number;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
};

const mapUserRecord = (user: Record<string, unknown>): BasicUserInfo => ({
  id: Number(user.id),
  name: (user.name as string) ?? null,
  last_name: (user.last_name as string) ?? null,
  email: (user.email as string) ?? null,
  phone_number: (user.phone_number as string) ?? null,
});

const fetchUsersMap = async (userIds: number[]) => {
  if (userIds.length === 0) {
    return new Map<number, BasicUserInfo>();
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, last_name, email, phone_number')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching users for appointments:', error);
    throw error;
  }

  const records = (data ?? []).map(mapUserRecord);
  return new Map(records.map((user) => [user.id, user]));
};

type PaymentRow = {
  appointment_id: string;
  amount: number | null;
  receipt_url: string | null;
};

type CreatedPayment = {
  id: string;
  appointment_id: string;
  amount: number | null;
  receipt_url: string | null;
  provider_payment_id: string | null;
  created_at?: string;
};

const fetchPaymentsMap = async (appointmentIds: (string | number)[]) => {
  if (appointmentIds.length === 0) {
    return new Map<string, PaymentRow>();
  }

  const ids = Array.from(
    new Set(appointmentIds.map((id) => String(id)))
  );

  const { data, error } = await supabase
    .from('payments')
    .select('appointment_id, amount, receipt_url')
    .in('appointment_id', ids);

  if (error) {
    console.error('Error fetching payments for appointments:', error);
    return new Map<string, PaymentRow>();
  }

  const payments = (data ?? []) as PaymentRow[];
  return new Map(payments.map((payment) => [String(payment.appointment_id), payment]));
};

const fetchAppointmentsWithUsers = async (filters: {
  patientId?: number;
  professionalId?: number;
  appointmentId?: string | number;
} = {}): Promise<AppointmentWithUsers[]> => {
  let query = supabase
    .from('appointments')
    .select(
      'id, patient_id, professional_id, scheduled_at, duration_minutes, status, payment_status, note, area, service, meet_link'
    )
    .order('scheduled_at', { ascending: false });

  if (typeof filters.patientId === 'number') {
    query = query.eq('patient_id', filters.patientId);
  }

  if (typeof filters.professionalId === 'number') {
    query = query.eq('professional_id', filters.professionalId);
  }

  if (filters.appointmentId !== undefined && filters.appointmentId !== null) {
    query = query.eq('id', filters.appointmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  const rows = (data ?? []) as RawAppointmentRow[];

  if (rows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.patient_id, row.professional_id])
        .filter((id): id is number => typeof id === 'number')
    )
  );

  const usersMap = await fetchUsersMap(userIds);
  const paymentsMap = await fetchPaymentsMap(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    patient: row.patient_id ? usersMap.get(row.patient_id) ?? null : null,
    professional: row.professional_id ? usersMap.get(row.professional_id) ?? null : null,
    meeting_url: row.meet_link ?? null,
    amount: paymentsMap.get(String(row.id))?.amount ?? null,
    invoice_url: paymentsMap.get(String(row.id))?.receipt_url ?? null,
  }));
};

export const appointmentService = {
  async getAppointmentsForPatient(patientId: number): Promise<AppointmentWithUsers[]> {
    if (typeof patientId !== 'number') {
      return [];
    }
    return fetchAppointmentsWithUsers({ patientId });
  },

  async getAppointmentsForProfessional(professionalId: number): Promise<AppointmentWithUsers[]> {
    if (typeof professionalId !== 'number') {
      return [];
    }
    return fetchAppointmentsWithUsers({ professionalId });
  },

  async getAllAppointments(): Promise<AppointmentWithUsers[]> {
    return fetchAppointmentsWithUsers();
  },

  async getAppointmentById(appointmentId: string | number): Promise<AppointmentWithUsers | null> {
    if (appointmentId === undefined || appointmentId === null || appointmentId === '') {
      return null;
    }
    const [appointment] = await fetchAppointmentsWithUsers({ appointmentId });
    return appointment ?? null;
  },

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
      
      // Primero obtener todas las especialidades disponibles (solo las activas)
      const { data: allSpecialties, error: specialtiesError } = await supabase
        .from('specialties')
        .select('*')
        .eq('is_active', true)
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
    const slotStart = DateTime.fromISO(`${date}T${startTime}`, { zone: 'America/Santiago' }).toUTC();
    const slotEnd = DateTime.fromISO(`${date}T${endTime}`, { zone: 'America/Santiago' }).toUTC();
    
    return blockedSlots.some(blocked => {
      const blockedStart = DateTime.fromISO(blocked.starts_at).toUTC();
      const blockedEnd = DateTime.fromISO(blocked.ends_at).toUTC();
      
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
    patient_id: number;
    notes?: string;
    service_name?: string;
    area?: string;
    duration_minutes?: number;
    requires_confirmation?: boolean;
  }) {
    try {
      const scheduledAt = DateTime.fromISO(
        `${appointmentData.date}T${appointmentData.time}`,
        { zone: 'America/Santiago' }
      ).toUTC();

      if (!scheduledAt.isValid) {
        throw new Error('Fecha u hora inválida para la zona horaria de Chile');
      }
      const requiresConfirmation = Boolean(appointmentData.requires_confirmation);
      
      const appointmentRecord = {
        patient_id: appointmentData.patient_id,
        professional_id: appointmentData.professional_id,
        scheduled_at: scheduledAt.toISO(),
        duration_minutes: appointmentData.duration_minutes ?? 55,
        status: requiresConfirmation ? 'pending_confirmation' : 'confirmed',
        payment_status: 'pending',
        note: appointmentData.notes || null,
        area: appointmentData.area || 'Psicología',
        service: appointmentData.service_name || 'Consulta Individual'
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

  async createTestPayment(paymentData: {
    appointmentId: string;
    patientId: number;
    professionalId?: number | null;
    amount: number;
    currency?: string;
  }): Promise<CreatedPayment | null> {
    try {
      const providerPaymentId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `test-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

      const paymentRecord = {
        appointment_id: String(paymentData.appointmentId),
        patient_id: paymentData.patientId,
        professional_id: paymentData.professionalId ?? null,
        provider: 'test_provider',
        provider_payment_id: providerPaymentId,
        provider_payment_status: 'succeeded',
        amount: paymentData.amount,
        currency: paymentData.currency ?? 'CLP',
        receipt_url: `https://payments.example.com/receipt/${providerPaymentId}`,
        raw_response: {
          simulated: true,
          approved_at: new Date().toISOString(),
        },
        metadata: {
          source: 'test_payment_flow',
        },
      };

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(paymentRecord)
        .select('id, appointment_id, amount, receipt_url, provider_payment_id, created_at')
        .single<CreatedPayment>();

      if (paymentError) {
        console.error('Error creando pago simulado:', paymentError);
        throw paymentError;
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ payment_status: 'succeeded' })
        .eq('id', paymentRecord.appointment_id);

      if (updateError) {
        console.error(
          'Pago registrado pero hubo un problema al actualizar el estado de la cita:',
          updateError
        );
      }

      return payment;
    } catch (error) {
      console.error('Error simulando pago:', error);
      throw error;
    }
  },

  // Obtener citas existentes para un profesional en una fecha específica
  async getExistingAppointments(professionalId: number, date: string): Promise<{ time: string }[]> {
    try {
      const startOfDay = DateTime.fromISO(date, { zone: 'America/Santiago' }).startOf('day').toUTC();
      const endOfDay = startOfDay.plus({ days: 1 }).minus({ milliseconds: 1 });
      
      const { data, error } = await supabase
        .from('appointments')
        .select('scheduled_at')
        .eq('professional_id', professionalId)
        .gte('scheduled_at', startOfDay.toISO())
        .lte('scheduled_at', endOfDay.toISO())
        .in('status', ['confirmed', 'pending_confirmation']); // Considerar citas sin confirmar aún

      if (error) {
        console.error('Error al obtener citas existentes:', error);
        return [];
      }

      console.log(`Citas existentes para ${date}:`, data);
      
      // Extraer solo la hora de scheduled_at
      return (data || []).map((appointment) => {
        const scheduledAt = DateTime.fromISO(String(appointment.scheduled_at)).setZone('America/Santiago');
        return { time: scheduledAt.toFormat('HH:mm') };
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
    return DateTime.fromFormat(time, 'HH:mm', { zone: 'America/Santiago' })
      .plus({ hours: 1 })
      .toFormat('HH:mm');
  }
};
