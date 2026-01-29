import supabase from "@/utils/supabase/client";
import { appointmentService } from "./appointmentService";

// Tipos para encuestas de satisfacción
export interface SatisfactionSurvey {
  id: string;
  appointment_id: string;
  patient_id: number;
  professional_id: number;
  professional_empathy_rating: number;
  professional_punctuality_rating: number;
  professional_satisfaction_rating: number;
  platform_booking_rating: number;
  platform_payment_rating: number;
  platform_experience_rating: number;
  what_you_valued?: string | null;
  what_to_improve?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSatisfactionSurveyData {
  appointment_id: string;
  patient_id: number;
  professional_id: number;
  professional_empathy_rating: number;
  professional_punctuality_rating: number;
  professional_satisfaction_rating: number;
  platform_booking_rating: number;
  platform_payment_rating: number;
  platform_experience_rating: number;
  what_you_valued?: string;
  what_to_improve?: string;
}

export interface UpdateSatisfactionSurveyData {
  professional_empathy_rating?: number;
  professional_punctuality_rating?: number;
  professional_satisfaction_rating?: number;
  platform_booking_rating?: number;
  platform_payment_rating?: number;
  platform_experience_rating?: number;
  what_you_valued?: string;
  what_to_improve?: string;
}

export interface AppointmentSurveyStatus {
  appointment_id: string;
  scheduled_at: string;
  canRate: boolean;
  hasRated: boolean;
  daysSinceAppointment: number;
  hoursSinceAppointment: number;
  isWithin72Hours: boolean;
  isWithin7Days: boolean;
}

export const satisfactionSurveyService = {
  /**
   * Obtiene una encuesta de satisfacción por ID de cita
   */
  async getSurveyByAppointmentId(
    appointmentId: string
  ): Promise<SatisfactionSurvey | null> {
    const { data, error } = await supabase
      .from("satisfaction_surveys")
      .select("*")
      .eq("appointment_id", appointmentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error obteniendo encuesta de satisfacción:", error);
      throw error;
    }

    return data as SatisfactionSurvey;
  },

  /**
   * Obtiene todas las encuestas de un paciente
   */
  async getSurveysByPatientId(
    patientId: number
  ): Promise<SatisfactionSurvey[]> {
    const { data, error } = await supabase
      .from("satisfaction_surveys")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo encuestas de satisfacción:", error);
      throw error;
    }

    return (data || []) as SatisfactionSurvey[];
  },

  /**
   * Crea una nueva encuesta de satisfacción
   */
  async createSurvey(
    data: CreateSatisfactionSurveyData
  ): Promise<SatisfactionSurvey> {
    const { data: survey, error } = await supabase
      .from("satisfaction_surveys")
      .insert({
        appointment_id: data.appointment_id,
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        professional_empathy_rating: data.professional_empathy_rating,
        professional_punctuality_rating: data.professional_punctuality_rating,
        professional_satisfaction_rating: data.professional_satisfaction_rating,
        platform_booking_rating: data.platform_booking_rating,
        platform_payment_rating: data.platform_payment_rating,
        platform_experience_rating: data.platform_experience_rating,
        what_you_valued: data.what_you_valued || null,
        what_to_improve: data.what_to_improve || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando encuesta de satisfacción:", error);
      throw error;
    }

    return survey as SatisfactionSurvey;
  },

  /**
   * Actualiza una encuesta de satisfacción existente
   */
  async updateSurvey(
    appointmentId: string,
    data: UpdateSatisfactionSurveyData
  ): Promise<SatisfactionSurvey> {
    const updateData: Record<string, unknown> = {};
    if (data.professional_empathy_rating !== undefined) {
      updateData.professional_empathy_rating = data.professional_empathy_rating;
    }
    if (data.professional_punctuality_rating !== undefined) {
      updateData.professional_punctuality_rating = data.professional_punctuality_rating;
    }
    if (data.professional_satisfaction_rating !== undefined) {
      updateData.professional_satisfaction_rating = data.professional_satisfaction_rating;
    }
    if (data.platform_booking_rating !== undefined) {
      updateData.platform_booking_rating = data.platform_booking_rating;
    }
    if (data.platform_payment_rating !== undefined) {
      updateData.platform_payment_rating = data.platform_payment_rating;
    }
    if (data.platform_experience_rating !== undefined) {
      updateData.platform_experience_rating = data.platform_experience_rating;
    }
    if (data.what_you_valued !== undefined) {
      updateData.what_you_valued = data.what_you_valued || null;
    }
    if (data.what_to_improve !== undefined) {
      updateData.what_to_improve = data.what_to_improve || null;
    }

    const { data: survey, error } = await supabase
      .from("satisfaction_surveys")
      .update(updateData)
      .eq("appointment_id", appointmentId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando encuesta de satisfacción:", error);
      throw error;
    }

    return survey as SatisfactionSurvey;
  },

  /**
   * Verifica el estado de una cita para saber si puede ser calificada
   */
  async getAppointmentSurveyStatus(
    appointmentId: string,
    scheduledAt: string
  ): Promise<AppointmentSurveyStatus> {
    const now = new Date();
    const appointmentDate = new Date(scheduledAt);
    const diffMs = now.getTime() - appointmentDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    const isWithin72Hours = diffHours >= 0 && diffHours <= 72;
    const isWithin7Days = diffDays >= 0 && diffDays <= 7;

    // Verificar si ya existe una encuesta
    const existingSurvey = await this.getSurveyByAppointmentId(appointmentId);
    const hasRated = !!existingSurvey;

    // Solo puede calificar si:
    // 1. La cita ya pasó (diffHours >= 0)
    // 2. No ha pasado más de 7 días
    // 3. No ha calificado aún
    const canRate = diffHours >= 0 && isWithin7Days && !hasRated;

    return {
      appointment_id: appointmentId,
      scheduled_at: scheduledAt,
      canRate,
      hasRated,
      daysSinceAppointment: Math.floor(diffDays),
      hoursSinceAppointment: Math.floor(diffHours),
      isWithin72Hours,
      isWithin7Days,
    };
  },

  /**
   * Obtiene citas completadas que pueden ser calificadas
   * Retorna las citas que están dentro de las 72 horas y aún no han sido calificadas
   */
  async getAppointmentsEligibleForSurvey(
    patientId: number
  ): Promise<Array<{ appointment_id: string; scheduled_at: string; status: AppointmentSurveyStatus }>> {
    try {
      // Obtener todas las citas del paciente usando el servicio
      const allAppointments = await appointmentService.getAppointmentsForPatient(patientId);
      
      // Filtrar solo las citas completadas
      const completedAppointments = allAppointments.filter(
        apt => apt.status === "completed"
      );

      if (completedAppointments.length === 0) {
        return [];
      }

      // Verificar el estado de cada cita
      const eligibleAppointments = [];
      for (const apt of completedAppointments) {
        const status = await this.getAppointmentSurveyStatus(
          apt.id,
          apt.scheduled_at
        );
        
        // Solo incluir citas que están dentro de las 72 horas y no han sido calificadas
        if (status.isWithin72Hours && !status.hasRated) {
          eligibleAppointments.push({
            appointment_id: apt.id,
            scheduled_at: apt.scheduled_at,
            status,
          });
        }
      }

      return eligibleAppointments;
    } catch (error) {
      console.error("Error obteniendo citas para encuesta:", error);
      throw error;
    }
  },
};
