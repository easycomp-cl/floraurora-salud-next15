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
  meet_event_id: string | null;
};

export type AppointmentWithUsers = RawAppointmentRow & {
  patient: BasicUserInfo | null;
  professional: BasicUserInfo | null;
  meeting_url: string | null;
  amount: number | null;
  invoice_url: string | null;
  bhe_pdf_path?: string | null;
  bhe_job_id?: string | null;
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
      'id, patient_id, professional_id, scheduled_at, duration_minutes, status, payment_status, note, area, service, meet_link, meet_event_id'
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

  // Consultar BHE jobs para obtener PDFs asociados
  const { data: bheJobsData } = await supabase
    .from("bhe_jobs")
    .select("id, appointment_id, result_pdf_path, status")
    .in("appointment_id", rows.map((row) => row.id))
    .eq("status", "done")
    .not("result_pdf_path", "is", null);

  // Crear un mapa de BHE jobs por appointment_id
  const bheJobsMap = new Map<string, { pdf_path: string; job_id: string }>();
  
  (bheJobsData ?? []).forEach((bheJob) => {
    if (bheJob.appointment_id && bheJob.result_pdf_path && !bheJobsMap.has(bheJob.appointment_id)) {
      bheJobsMap.set(bheJob.appointment_id, {
        pdf_path: bheJob.result_pdf_path as string,
        job_id: bheJob.id as string,
      });
    }
  });

  return rows.map((row) => {
    const payment = paymentsMap.get(String(row.id));
    const bheJob = bheJobsMap.get(row.id);
    
    return {
      ...row,
      patient: row.patient_id ? usersMap.get(row.patient_id) ?? null : null,
      professional: row.professional_id ? usersMap.get(row.professional_id) ?? null : null,
      meeting_url: row.meet_link ?? null,
      amount: payment?.amount ?? null,
      invoice_url: payment?.receipt_url ?? null,
      bhe_pdf_path: bheJob?.pdf_path ?? null,
      bhe_job_id: bheJob?.job_id ?? null,
    };
  });
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

  // Obtener profesionales que ofrecen un servicio específico (por nombre de especialidad)
  async getProfessionalsByService(serviceName: string, areaFilter?: number): Promise<Professional[]> {
    try {
      // Primero obtener el ID del área si se proporciona
      const areaId: number | undefined = areaFilter;
      
      // Buscar profesionales que tengan la especialidad con el nombre especificado
      const { data: professionalSpecialties, error: psError } = await supabase
        .from('professional_specialties')
        .select(`
          professional_id,
          specialties!inner(
            id,
            name,
            title_id
          )
        `)
        .ilike('specialties.name', `%${serviceName}%`)
        .eq('specialties.is_active', true);

      if (psError) {
        console.error('Error fetching professionals by service:', psError);
        throw psError;
      }

      if (!professionalSpecialties || professionalSpecialties.length === 0) {
        return [];
      }

      // Obtener IDs únicos de profesionales
      const professionalIds = Array.from(
        new Set(
          (professionalSpecialties as Array<{ 
            professional_id?: unknown; 
            specialties?: { id?: unknown; name?: unknown; title_id?: unknown } | { id?: unknown; name?: unknown; title_id?: unknown }[] | null 
          }>)
            .map((ps) => {
              // Si hay filtro de área, verificar que la especialidad pertenezca a esa área
              if (areaId && ps.specialties) {
                // specialties puede ser un objeto único o un array
                const specialty = Array.isArray(ps.specialties) ? ps.specialties[0] : ps.specialties;
                if (specialty && Number(specialty.title_id) !== areaId) {
                  return null;
                }
              }
              return ps.professional_id ? Number(ps.professional_id) : null;
            })
            .filter((id): id is number => id !== null)
        )
      );

      if (professionalIds.length === 0) {
        return [];
      }

      // Obtener los profesionales completos
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
            phone_number,
            avatar_url,
            gender
          )
        `)
        .in('id', professionalIds)
        .eq('is_active', true)
        .eq('users.is_active', true);

      // Si hay filtro de área, aplicarlo también aquí
      if (areaId) {
        query.eq('title_id', areaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Obtener las especialidades para cada profesional (igual que en getProfessionals)
      const professionalsWithSpecialties = await Promise.all(
        (data || []).map(async (prof: { id: unknown; profile_description: unknown; professional_titles: unknown; users: unknown }) => {
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

          const users = prof.users as { name?: unknown; last_name?: unknown; email?: unknown; phone_number?: unknown; avatar_url?: unknown; gender?: unknown };
          const professionalTitles = prof.professional_titles as { title_name?: unknown; id?: unknown };
          const profData = prof as { resume_url?: unknown; is_active?: unknown; created_at?: unknown };

          return {
            id: Number(prof.id),
            user_id: String(prof.id),
            name: String(users?.name || ''),
            last_name: String(users?.last_name || ''),
            email: String(users?.email || ''),
            phone_number: String(users?.phone_number || ''),
            title_name: String(professionalTitles?.title_name || ''),
            title_id: Number(professionalTitles?.id || 0),
            profile_description: String(prof.profile_description || ''),
            resume_url: String(profData?.resume_url || ''),
            avatar_url: users?.avatar_url ? String(users.avatar_url) : undefined,
            gender: users?.gender ? String(users.gender) : undefined,
            specialties: specialties,
            is_active: Boolean(profData?.is_active),
            created_at: String(profData?.created_at || new Date().toISOString())
          };
        })
      );
      
      return professionalsWithSpecialties.sort((a, b) => `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`));
    } catch (error) {
      console.error('Error fetching professionals by service:', error);
      throw error;
    }
  },

  // Obtener un profesional específico por ID
  async getProfessionalById(professionalId: number): Promise<Professional | null> {
    try {
      const { data, error } = await supabase
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
            phone_number,
            avatar_url,
            gender
          )
        `)
        .eq('id', professionalId)
        .eq('is_active', true)
        .eq('users.is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No encontrado
        }
        throw error;
      }

      if (!data) {
        return null;
      }

      // Obtener especialidades del profesional
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from('professional_specialties')
        .select(`
          specialties(
            name
          )
        `)
        .eq('professional_id', professionalId);

      if (specialtiesError) {
        console.warn(`Error fetching specialties for professional ${professionalId}:`, specialtiesError);
      }

      const specialties = specialtiesData?.map((ps: { specialties: unknown }) => {
        const specialty = ps.specialties as { name?: unknown } | null;
        return specialty?.name ? String(specialty.name) : null;
      }).filter((name): name is string => Boolean(name)) || [];

      const users = data.users as { name?: unknown; last_name?: unknown; email?: unknown; phone_number?: unknown; avatar_url?: unknown; gender?: unknown };
      const professionalTitles = data.professional_titles as { title_name?: unknown; id?: unknown };
      const profData = data as { resume_url?: unknown; is_active?: unknown; created_at?: unknown };

      return {
        id: Number(data.id),
        user_id: String(data.id),
        name: String(users?.name || ''),
        last_name: String(users?.last_name || ''),
        email: String(users?.email || ''),
        phone_number: String(users?.phone_number || ''),
        title_name: String(professionalTitles?.title_name || ''),
        title_id: Number(professionalTitles?.id || 0),
        profile_description: String(data.profile_description || ''),
        resume_url: String(profData?.resume_url || ''),
        avatar_url: users?.avatar_url ? String(users.avatar_url) : undefined,
        gender: users?.gender ? String(users.gender) : undefined,
        specialties: specialties,
        is_active: Boolean(profData?.is_active),
        created_at: String(profData?.created_at || new Date().toISOString())
      };
    } catch (error) {
      console.error('Error fetching professional by id:', error);
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
          approach_id,
          professional_titles!inner(
            id,
            title_name
          ),
          therapeutic_approaches(
            id,
            name,
            description
          ),
          users!inner(
            name,
            last_name,
            email,
            phone_number,
            avatar_url,
            gender,
            user_id
          )
        `)
        .eq('title_id', areaFilter || 0)
        .eq('is_active', true)
        .eq('users.is_active', true);

      const { data, error } = await query;
      if (error) throw error;

      // Obtener las especialidades y datos académicos para cada profesional
      const professionalsWithSpecialties = await Promise.all(
        (data || []).map(async (prof: { 
          id: unknown; 
          profile_description: unknown; 
          approach_id: unknown;
          professional_titles: unknown; 
          therapeutic_approaches: unknown;
          users: unknown 
        }) => {
          const professionalId = Number(prof.id);
          const users = prof.users as { 
            name?: unknown; 
            last_name?: unknown; 
            email?: unknown; 
            phone_number?: unknown; 
            avatar_url?: unknown; 
            gender?: unknown;
            user_id?: unknown;
          };
          const userUuid = users?.user_id ? String(users.user_id) : null;

          // Consultar especialidades del profesional
          const { data: specialtiesData, error: specialtiesError } = await supabase
            .from('professional_specialties')
            .select(`
              specialties(
                name
              )
            `)
            .eq('professional_id', professionalId);

          if (specialtiesError) {
            console.warn(`Error fetching specialties for professional ${professionalId}:`, specialtiesError);
          }

          const specialties = specialtiesData?.map((ps: { specialties: unknown }) => {
            const specialty = ps.specialties as { name?: unknown } | null;
            return specialty?.name ? String(specialty.name) : null;
          }).filter((name): name is string => Boolean(name)) || [];

          // Obtener enfoque terapéutico
          const therapeuticApproaches = prof.therapeutic_approaches;
          let approach: { 
            id: number; 
            name: string; 
            description: string | null 
          } | undefined = undefined;
          
          if (therapeuticApproaches) {
            // Puede ser un objeto único o un array dependiendo de la relación
            const approachData = Array.isArray(therapeuticApproaches) 
              ? therapeuticApproaches[0] 
              : therapeuticApproaches;
            
            if (approachData && typeof approachData === 'object') {
              const approachObj = approachData as { 
                id?: unknown; 
                name?: unknown; 
                description?: unknown | null 
              };
              if (approachObj.id && approachObj.name) {
                approach = {
                  id: Number(approachObj.id),
                  name: String(approachObj.name),
                  description: approachObj.description ? String(approachObj.description) : null,
                };
              }
            }
          }
          
          // Obtener datos académicos desde professional_requests usando el ID del profesional
          // Usamos un endpoint API público porque professional_requests tiene RLS que bloquea acceso directo
          let academicData: {
            university?: string;
            profession?: string;
            study_year_start?: string;
            study_year_end?: string;
            extra_studies?: string;
            degree_copy_url?: string | null;
            professional_certificate_url?: string | null;
            additional_certificates_urls?: string[] | null;
          } = {};

          try {
            // Llamar al endpoint API público que usa admin client para bypass RLS
            const response = await fetch(
              `/api/public/professional-academic-data/${professionalId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              if (result.data) {
                academicData = result.data;
              }
            }
          } catch (academicError) {
            // Silently fail - academic data is optional
          }

          const professionalTitles = prof.professional_titles as { title_name?: unknown; id?: unknown };
          const profData = prof as { resume_url?: unknown; is_active?: unknown; created_at?: unknown };

          return {
            id: professionalId,
            user_id: String(professionalId), // Usar el id del profesional como user_id temporalmente
            name: String(users?.name || ''),
            last_name: String(users?.last_name || ''),
            email: String(users?.email || ''),
            phone_number: String(users?.phone_number || ''),
            title_name: String(professionalTitles?.title_name || ''),
            title_id: Number(professionalTitles?.id || 0),
            profile_description: String(prof.profile_description || ''),
            resume_url: String(profData?.resume_url || ''),
            avatar_url: users?.avatar_url ? String(users.avatar_url) : undefined,
            gender: users?.gender ? String(users.gender) : undefined,
            specialties: specialties,
            is_active: Boolean(profData?.is_active),
            created_at: String(profData?.created_at || new Date().toISOString()),
            approach_id: prof.approach_id ? Number(prof.approach_id) : null,
            approach: approach ? {
              id: Number(approach.id || 0),
              name: String(approach.name || ''),
              description: approach.description ? String(approach.description) : null,
            } : undefined,
            ...academicData,
          };
        })
      );
      return professionalsWithSpecialties.sort((a, b) => `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`));
    } catch (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }
  },

  // Obtener servicios por profesional basados en sus especialidades
  async getServicesByProfessional(professionalId: number): Promise<Service[]> {
    try {
      // Obtener las especialidades del profesional con sus precios y datos de la especialidad
      const { data: professionalSpecialties, error: profSpecialtiesError } = await supabase
        .from('professional_specialties')
        .select(`
          specialty_id,
          professional_amount,
          specialties(
            id,
            name,
            title_id,
            description,
            minimum_amount,
            maximum_amount,
            duration_minutes,
            is_active,
            created_at
          )
        `)
        .eq('professional_id', professionalId);

      if (profSpecialtiesError) {
        console.error('Error al obtener especialidades del profesional:', profSpecialtiesError);
        return [];
      }

      if (!professionalSpecialties || professionalSpecialties.length === 0) {
        return [];
      }

      // Crear servicios basados en las especialidades del profesional
      
      // Interfaces para tipado seguro
      interface SpecialtyData {
        id: number;
        name: string;
        description: string | null;
        duration_minutes: number | null;
        minimum_amount: number | null;
        maximum_amount: number | null;
        created_at: string;
        is_active: boolean;
      }
      
      // Type guard para verificar si es un objeto único
      function isSpecialtyData(obj: SpecialtyData | SpecialtyData[] | null): obj is SpecialtyData {
        return obj !== null && !Array.isArray(obj) && typeof obj === 'object' && 'id' in obj;
      }
      
      const services: Service[] = [];
      
      for (const ps of professionalSpecialties) {
        // Manejar el caso donde specialties puede ser un objeto único o un array
        const specialtyRaw = ps.specialties;
        
        if (!isSpecialtyData(specialtyRaw)) {
          continue;
        }
        
        const specialty = specialtyRaw;
        
        // Filtrar solo especialidades activas
        if (specialty.is_active === false) {
          continue;
        }

        // Determinar el precio a usar:
        // 1. Si tiene professional_amount, usarlo
        // 2. Si no, usar minimum_amount de la especialidad
        // 3. Si no hay ninguno, usar 35000 como valor por defecto
        let price = 35000; // Valor por defecto
        if (ps.professional_amount !== null && ps.professional_amount !== undefined) {
          price = Number(ps.professional_amount);
        } else if (specialty.minimum_amount !== null && specialty.minimum_amount !== undefined) {
          price = Number(specialty.minimum_amount);
        }

        // Usar duration_minutes de la especialidad o 55 por defecto
        const duration = specialty.duration_minutes ?? 55;

        const service: Service = {
          id: Number(specialty.id),
          name: `Consulta de ${specialty.name}`,
          description: specialty.description || `Sesión de terapia especializada en ${specialty.name} de ${duration} minutos`,
          duration_minutes: duration,
          price: price,
          professional_id: professionalId,
          is_active: true,
          created_at: specialty.created_at || new Date().toISOString()
        };
        
        services.push(service);
      }
      
      return services;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Obtener el tiempo mínimo de anticipación desde las configuraciones (default: 5 horas)
  async getMinAdvanceBookingHours(): Promise<number> {
    try {
      const { data: config } = await supabase
        .from("system_configurations")
        .select("config_value")
        .eq("config_key", "min_advance_booking_hours")
        .eq("is_active", true)
        .single();

      return config ? parseInt(config.config_value, 10) : 5; // Default: 5 horas
    } catch (error) {
      console.warn('Error obteniendo configuración de tiempo mínimo de anticipación, usando default (5 horas):', error);
      return 5; // Default: 5 horas
    }
  },

  // Verificar si un horario es válido (no ha pasado y cumple con el tiempo mínimo de anticipación)
  async isTimeSlotValid(date: string, time: string): Promise<boolean> {
    try {
      const now = new Date();
      const appointmentDateTime = new Date(`${date}T${time}:00`);
      
      // Verificar que el horario no haya pasado
      if (appointmentDateTime <= now) {
        return false;
      }

      // Obtener el tiempo mínimo de anticipación
      const minHours = await this.getMinAdvanceBookingHours();
      const minAdvanceTime = minHours * 60 * 60 * 1000; // Convertir a milisegundos
      
      // Verificar que haya al menos el tiempo mínimo de anticipación
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      if (timeDifference < minAdvanceTime) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validando horario:', error);
      return false;
    }
  },

  // Obtener horarios disponibles por profesional y fecha basados en disponibilidad real
  async getAvailableTimeSlots(
    professionalId: number, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      // Crear fecha en zona horaria local para evitar problemas de UTC
      const selectedDate = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDate.getDay();

      // Verificar que la fecha no sea más de 2 semanas en el futuro
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo fechas
      const twoWeeksFromNow = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
      
      if (selectedDate < today || selectedDate > twoWeeksFromNow) {
        return [];
      }

      // Obtener el tiempo mínimo de anticipación una sola vez
      const minHours = await this.getMinAdvanceBookingHours();
      const minAdvanceTime = minHours * 60 * 60 * 1000; // Convertir a milisegundos
      const now = new Date();

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
      
      // Buscar excepciones para la fecha específica
      const dateOverrides = overrides.filter(override => override.for_date === date);
      
      // Buscar bloques de tiempo que afecten esta fecha
      const dateBlockedSlots = blockedSlots.filter(blocked => {
        const blockedDate = new Date(blocked.starts_at).toISOString().split('T')[0];
        return blockedDate === date;
      });

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
      } else if (dayRules.length > 0) {
        // Usar reglas semanales
        availableSlots = dayRules.map(rule => ({
          start_time: rule.start_time,
          end_time: rule.end_time
        }));
      }

      // Generar slots de 1 hora basados en la disponibilidad
      const timeSlots: TimeSlot[] = [];
      
      for (const slot of availableSlots) {
        const slots = this.generateTimeSlots(slot.start_time, slot.end_time, 60);
        
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
          
          // Verificar que el horario no haya pasado y cumpla con el tiempo mínimo de anticipación
          const appointmentDateTime = new Date(`${date}T${timeSlot.start_time}:00`);
          const timeDifference = appointmentDateTime.getTime() - now.getTime();
          const isValidTime = appointmentDateTime > now && timeDifference >= minAdvanceTime;
          
          if (!isBlocked && !isBooked && isValidTime) {
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
          }
        }
      }

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
        } else if (dayRules.length > 0) {
          // Si hay reglas semanales para este día, está disponible
          isDateAvailable = true;
        }
        
        if (isDateAvailable) {
          availableDates.push(dateString);
        }
      }
      
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

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentRecord)
        .select()
        .single();

      if (error) {
        console.error('Error al crear cita:', error);
        throw error;
      }

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
      // Primero validar que el horario no haya pasado y cumpla con el tiempo mínimo de anticipación
      const isValidTime = await this.isTimeSlotValid(date, time);
      if (!isValidTime) {
        return false;
      }

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
