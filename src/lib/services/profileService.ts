import { supabaseTyped } from '@/utils/supabase/client'; // Usar el cliente tipado con autenticación
import { UserProfile, ProfessionalProfile, ProfessionalTitle, ProfessionalSpecialty } from '@/lib/types/profile';

// Definir una interfaz para Patient basada en la tabla real
export interface Patient {
  id: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  health_insurances_id: number;
  created_at: string;
}

// Definir una interfaz para User basada en la tabla real
export interface User {
  id: number;
  rut?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role: number; // 1=admin, 2=patient, 3=professional (asumiendo)
  is_active?: boolean;
  birth_date?: string;
  password?: string;
  created_at: string;
  address?: string;
  user_id: string; // UUID de Supabase Auth
}


// Interfaz temporal para manejar la estructura real de datos de Supabase
interface ProfessionalSpecialtyQuery {
  specialty_id: number;
  specialties: {
    id: number;
    name: string;
    title_id: number;
    created_at: string;
  } | null;
}

export const profileService = {
  // Obtener perfil de usuario desde la tabla users
  async getUserProfile(id: number): Promise<User | null> {
    const { data, error } = await supabaseTyped
      .from('users')
      .select('*')
      .eq('id', id) 
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data || null;
  },
  async getUserProfileByUuid(userId: string): Promise<User | null> {
    const { data, error } = await supabaseTyped
      .from('users')
      .select('*')
      .eq('user_id', userId) 
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data || null;
  },

  // Obtener perfil de paciente desde la tabla patients
  async getPatientProfile(userId: number): Promise<Patient | null> {
    // Primero obtener el usuario para conseguir su id
    const user = await this.getUserProfile(userId);
    if (!user) return null;

    const { data, error } = await supabaseTyped
      .from('patients')
      .select('*')
      .eq('id', user.id) // Usar el id de la tabla users para la relación
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching patient profile:', error);
      return null;
    }
    
    return data || null;
  },

  // Obtener perfil de profesional desde la tabla professionals
  async getProfessionalProfile(userId: number): Promise<ProfessionalProfile | null> {
    // Primero obtener el usuario para conseguir su id
    const user = await this.getUserProfile(userId);
    console.log("getProfessionalProfile-user", user);
    if (!user) return null;

    const { data, error } = await supabaseTyped
      .from('professionals')
      .select(`
        *,
        title:professional_titles(*)
      `)
      .eq('id', user.id) // Usar el id de la tabla users para la relación
      .single();
    console.log("getProfessionalProfile-data", data);
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching professional profile:', error);
      return null;
    }
    
    return data || null;
  },

  // Obtener títulos profesionales
  async getProfessionalTitles(): Promise<ProfessionalTitle[]> {
    const { data, error } = await supabaseTyped
      .from('professional_titles')
      .select('*')
      .eq('is_active', true)
      .order('title_name');
    
    if (error) {
      console.error('Error fetching professional titles:', error);
      return [];
    }
    
    return data || [];
  },

  // Obtener especialidades disponibles por título
  async getSpecialtiesByTitle(titleId: number): Promise<ProfessionalSpecialty[]> {
    const { data, error } = await supabaseTyped
      .from('specialties')
      .select('*')
      .eq('title_id', titleId)
      .order('name');
    
    if (error) {
      console.error('Error fetching specialties by title:', error);
      return [];
    }
    
    return data || [];
  },

  // Obtener especialidades de un profesional por su id
  async getProfessionalSpecialties(professionalId: number): Promise<ProfessionalSpecialty[]> {
    const { data, error } = await supabaseTyped
      .from('professional_specialties')
      .select(`
        specialty_id,
        specialties(
          id,
          name,
          title_id,
          created_at
        )
      `)
      .eq('professional_id', professionalId);
    
    console.log("getProfessionalSpecialties-data", data);
    console.log("getProfessionalSpecialties-data length:", data?.length);
    if (error) {
      console.error('Error fetching professional specialties:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No specialties found for professional:', professionalId);
      return [];
    }
    
    // Mapear los datos para que coincidan con la interfaz ProfessionalSpecialty
    const specialties = (data as unknown as ProfessionalSpecialtyQuery[])?.map((item, index) => {
      console.log(`Processing item ${index}:`, item);
      const { specialties: specialtyData } = item; // specialties es un objeto individual, no un array
      console.log(`specialtyData for item ${index}:`, specialtyData);
      
      // Validar que el objeto de especialidad exista
      if (!specialtyData || typeof specialtyData !== 'object') {
        console.warn('No specialty found for item:', item);
        return null;
      }
      
      // Validar que tenga al menos la propiedad id
      if (specialtyData.id === undefined || specialtyData.id === null) {
        console.warn('Specialty data missing required id property:', specialtyData);
        return null;
      }
      
      return {
        id: specialtyData.id,
        name: specialtyData.name || '',
        title_id: specialtyData.title_id || null,
        created_at: specialtyData.created_at || new Date().toISOString()
      };
    }).filter((specialty): specialty is ProfessionalSpecialty => specialty !== null) || [];
    
    console.log("Mapped specialties:", specialties);
    return specialties;
  },

  // Actualizar especialidades de un profesional
  async updateProfessionalSpecialties(professionalId: number, specialtyIds: number[]): Promise<void> {
    // Primero eliminar todas las especialidades existentes
    const { error: deleteError } = await supabaseTyped
      .from('professional_specialties')
      .delete()
      .eq('professional_id', professionalId);
    
    if (deleteError) {
      console.error('Error deleting existing specialties:', deleteError);
      throw deleteError;
    }
    
    // Luego insertar las nuevas especialidades
    if (specialtyIds.length > 0) {
      const specialtyData = specialtyIds.map(specialtyId => ({
        professional_id: professionalId,
        specialty_id: specialtyId
      }));
      
      const { error: insertError } = await supabaseTyped
        .from('professional_specialties')
        .insert(specialtyData);
      
      if (insertError) {
        console.error('Error inserting new specialties:', insertError);
        throw insertError;
      }
    }
  },

  async isProfileComplete(user: UserProfile): Promise<boolean> {
    if (!user) return false;

    // Verificar campos básicos requeridos de la tabla users
    if (!user.name || !user.last_name || !user.email) return false;

    // Verificar el rol (1=admin, 2=patient, 3=professional)
    switch (user.role) {
      case 1: // admin
        // Para el admin, solo se requiere name, last_name y email
        return true;
      case 2: // patient
        const patientProfile = await this.getPatientProfile(user.id);
        return !!patientProfile && 
               !!patientProfile.emergency_contact_name &&
               !!patientProfile.emergency_contact_phone &&
               !!patientProfile.health_insurances_id;
      case 3: // professional
        const professionalProfile = await this.getProfessionalProfile(user.id);
        return !!professionalProfile && 
               !!professionalProfile.title_id &&
               !!professionalProfile.profile_description;
      default:
        return false;
    }
  },


  async createPatientProfile(userId: string, profileData: Omit<Patient, 'id' | 'created_at'>): Promise<Patient | null> {

    // Primero obtener el usuario para conseguir su id
    const user = await this.getUserProfileByUuid(userId);
    console.log("AWAIT user", user);
    if (!user) throw new Error('User not found');

    const { data, error } = await supabaseTyped
      .from('patients')
      .insert({
        ...profileData,
        id: user.id // Usar el id de la tabla users para la relación
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating patient profile:', error);
      throw error;
    }
    
    return data;
  },

  async updatePatientProfile(userId: string, profileData: Partial<Patient>): Promise<Patient | null> {
    // Primero obtener el usuario para conseguir su id
    console.log("=== INICIO updatePatientProfile ===");
    console.log("userId recibido:", userId);
    console.log("profileData recibido:", profileData);
    const user = await this.getUserProfileByUuid(userId);
    if (!user) throw new Error('User not found');

    const { data, error } = await supabaseTyped
      .from('patients')
      .update(profileData)
      .eq('id', user.id) // Usar el id de la tabla users para la relación
      .select()
      .single();
    
    if (error) {
      console.error('Error updating patient profile:', error);
      throw error;
    }
    
    return data;
  },

  // Actualizar perfil de profesional
  async updateProfessionalProfile(userId: string, profileData: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | null> {
    // Primero obtener el usuario para conseguir su id
    const user = await this.getUserProfileByUuid(userId);
    if (!user) throw new Error('User not found');

    const { data, error } = await supabaseTyped
      .from('professionals')
      .update(profileData)
      .eq('id', user.id) // Usar el id de la tabla users para la relación
      .select(`
        *,
        title:professional_titles(*)
      `)
      .single();
    
    if (error) {
      console.error('Error updating professional profile:', error);
      throw error;
    }
    
    return data;
  },

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<User | null> {
    console.log("=== INICIO updateUserProfile ===");
    console.log("userId recibido:", userId);
    console.log("profileData recibido:", profileData);
    
    // Verificar autenticación
    const { data: { user: authUser }, error: authError } = await supabaseTyped.auth.getUser();
    
    if (authError || !authUser) {
      console.error('Error de autenticación:', authError);
      throw new Error("Usuario no autenticado");
    }
    
    console.log("Usuario autenticado:", authUser.id);
    
    // Verificar que el user_id coincida con el usuario autenticado
    if (authUser.id !== userId) {
      throw new Error("No tienes permisos para actualizar este perfil");
    }
    
    // Realizar la actualización directamente sin verificar existencia previa
    const { data, error } = await supabaseTyped
      .from('users')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    console.log("Usuario actualizado exitosamente:", data);
    return data;
  },

  async updateUserDetails(userId: string, name: string, last_name: string): Promise<void> {
    const { error } = await supabaseTyped
      .from('users')
      .update({ name, last_name })
      .eq('user_id', userId); // Usar user_id (UUID de Supabase Auth)
    
    if (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  },
};
