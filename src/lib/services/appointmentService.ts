import supabase from '@/utils/supabase/client';
import type { Professional, Service, TimeSlot } from '@/lib/types/appointment';

export const appointmentService = {
  // Obtener todos los profesionales activos
  async getProfessionals(): Promise<Professional[]> {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching professionals:', error);
      throw error;
    }
  },

  // Obtener servicios por profesional
  async getServicesByProfessional(professionalId: string): Promise<Service[]> {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  // Obtener horarios disponibles por profesional y fecha
  async getAvailableTimeSlots(
    professionalId: string, 
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('date', date)
        .eq('is_available', true)
        .eq('is_booked', false)
        .order('start_time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  },

  // Crear una nueva cita
  async createAppointment(appointmentData: {
    professional_id: string;
    service_id: string;
    date: string;
    time: string;
    user_id: string;
    notes?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Marcar horario como reservado
  async bookTimeSlot(timeSlotId: string) {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ is_booked: true })
        .eq('id', timeSlotId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error booking time slot:', error);
      throw error;
    }
  }
};
