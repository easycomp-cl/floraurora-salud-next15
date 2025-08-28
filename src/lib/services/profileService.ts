import supabase from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile, Profile } from '@/lib/types/profile';
import { Professional } from '@/lib/types/appointment'; // Importa la interfaz Professional

// Definir una interfaz para Patient (asumiendo campos, ajustar según la base de datos real)
export interface Patient {
  id: string;
  user_id: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone_number: string;
  address: string;
  // Añadir otros campos relevantes para pacientes
}

export const profileService = {
  async getPatientProfile(userId: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 es "No rows found"
      console.error('Error fetching patient profile:', error);
      return null;
    }
    return data || null;
  },

  async getProfessionalProfile(userId: string): Promise<Professional | null> {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', userId) // Asumiendo que el ID del profesional es el user_id
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching professional profile:', error);
      return null;
    }
    return data || null;
  },

  async isProfileComplete(user: (User & UserProfile)): Promise<boolean> {
    if (!user || user.loading) return false; // Si el usuario no está cargado, no está completo

    // Siempre se requiere full_name y email de la tabla users
    if (!user.full_name || !user.email) return false;

    switch (user.role) {
      case 'admin':
        // Para el admin, solo se requiere el full_name y email
        return true;
      case 'patient':
        const patientProfile = await this.getPatientProfile(user.id);
        return !!patientProfile && 
               !!patientProfile.date_of_birth &&
               !!patientProfile.gender &&
               !!patientProfile.phone_number &&
               !!patientProfile.address; // Verificar campos específicos de paciente
      case 'professional':
        const professionalProfile = await this.getProfessionalProfile(user.id);
        return !!professionalProfile &&
               !!professionalProfile.name &&
               !!professionalProfile.title &&
               !!professionalProfile.specialty &&
               !!professionalProfile.bio; // Verificar campos específicos de profesional
      default:
        return false;
    }
  },

  async updatePatientProfile(userId: string, profileData: Partial<Patient>): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      console.error('Error updating patient profile:', error);
      throw error;
    }
    return data;
  },

  async updateProfessionalProfile(userId: string, profileData: Partial<Professional>): Promise<Professional | null> {
    const { data, error } = await supabase
      .from('professionals')
      .update(profileData)
      .eq('id', userId) // Asumiendo que el ID del profesional es el user_id
      .select()
      .single();
    if (error) {
      console.error('Error updating professional profile:', error);
      throw error;
    }
    return data;
  },

  async updateUserDetails(userId: string, full_name: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ full_name: full_name })
      .eq('id', userId);
    if (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  },
};
