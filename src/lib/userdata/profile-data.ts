// Importa las funciones necesarias
import { auth, db, Database } from "@/utils/supabase/client"; // Agregamos Database
import { profileService, Patient } from "@/lib/services/profileService";
import { Professional } from "@/lib/types/appointment"; // Asegúrate de que esta importación sea correcta
import { ProfessionalProfile } from "@/lib/types/profile";

// 1. Interfaz para la información detallada del usuario
export interface DetailedUserData {
  id: number;
  user_id: string;
  rut?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role: number; // 1=admin, 2=patient, 3=professional
  is_active?: boolean;
  birth_date?: string;
  password?: string;
  created_at: string;
  address?: string;
  gender?: string;
  nationality?: string;
}

// Mapeo de roles numéricos a strings
const roleMap: Record<number, 'any' | 'admin' | 'patient' | 'professional'> = {
  0: 'any',
  1: 'admin',
  2: 'patient',
  3: 'professional',
};

// Función auxiliar para mapear el rol
function mapRoleNumberToString(roleNumber: number): 'any' | 'admin' | 'patient' | 'professional' {
  return roleMap[roleNumber] || 'any'; // Por defecto a 'any' si el número no es reconocido
}

// 2. Interfaz para el tipo de datos que retornará la función principal
export interface UserProfileData {
  user: DetailedUserDataMappped | null; // Usaremos DetailedUserDataMappped aquí
  profile: Patient | Professional | ProfessionalProfile | null;
  loading: boolean;
  error: string | null;
}

// Nueva interfaz para DetailedUserData después de mapear el rol
export interface DetailedUserDataMappped extends Omit<DetailedUserData, 'role'> {
  role: 'any' | 'admin' | 'patient' | 'professional';
}

/**
 * Función 1: Obtiene la información básica del usuario de la sesión actual.
 * Retorna el ID del usuario de Supabase Auth o null si no hay sesión.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const { user, error } = await auth.getCurrentUser();

  if (error) {
    console.error("Error al obtener el usuario de la sesión:", error);
    return null;
  }
  if (!user) {
    console.log("No hay sesión de usuario activa.");
    return null;
  }
  return user.id;
}

/**
 * Función 2: Obtiene la información detallada del usuario de la tabla 'users'.
 * Requiere el ID del usuario.
 */
async function getDetailedUserFromDatabase(userId: string): Promise<DetailedUserDataMappped | null> {
  const { data: userData, error } = await db.getUserById(userId);

  if (error) {
    console.error("Error al obtener los datos del usuario de la BD:", error);
    return null;
  }
  if (!userData) {
    console.log("No se encontraron datos en la tabla 'users' para el ID:", userId);
    return null;
  }

  // Mapear el rol numérico a su string equivalente antes de retornar
  const roleString = mapRoleNumberToString(userData.role);
  // Retornamos un objeto que se ajusta a DetailedUserDataMappped
  return { ...userData, role: roleString } as DetailedUserDataMappped;
}

/**
 * Función 3: Obtiene el perfil específico (paciente/profesional) según el rol del usuario.
 * Requiere el objeto DetailedUserDataMappped (con el rol ya mapeado a string).
 */
async function getSpecificProfile(user: DetailedUserDataMappped): Promise<Patient | Professional | ProfessionalProfile | null> {
  let specificProfile: Patient | Professional | ProfessionalProfile | null = null;

  // user.role ya es un string mapeado, podemos usarlo directamente en el switch
  switch (user.role) {
    case 'patient':
      // console.log("user", user);
      // console.log("user.id", user.id);
      specificProfile = await profileService.getPatientProfile(user.id.toString());
      //console.log("specificProfile", specificProfile);
      if (specificProfile) {
        console.log("Perfil de paciente encontrado:", specificProfile);
      } else {
        console.log("No se encontró perfil de paciente para el paciente:", user.id);
      }
      break;
    case 'professional':
      console.log("Obteniendo perfil de profesional para user:", user);
      specificProfile = await profileService.getProfessionalProfile(user.id);
      console.log("specificProfile", specificProfile);

      if (specificProfile) {
        console.log("Perfil de profesional encontrado:", specificProfile);
        // Obtener especialidades si hay un title_id
        if (specificProfile.title_id) {
          const specialties = await profileService.getProfessionalSpecialties(specificProfile.id);
          specificProfile.specialties = specialties;
        }
      } else {
        console.log("No se encontró perfil de profesional para el usuario:", user.id);
      }
      break;
    case 'admin':
      console.log("Usuario es un administrador, no se busca perfil específico de paciente/profesional.");
      break;
    case 'any':
      console.log("Usuario con rol 'any', no se busca perfil específico.");
      break;
    default:
      console.log("Rol de usuario desconocido o no mapeado:", user.role);
      break;
  }
  return specificProfile;
}

/**
 * Función principal: Combina las tres funciones para obtener toda la información del perfil del usuario.
 */
export async function getFullUserProfileData(): Promise<UserProfileData | null> {
  try {
    // Paso 1: Obtener el ID del usuario autenticado
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return null;
    }

    // Paso 2: Obtener los datos detallados del usuario de la base de datos
    const detailedUser = await getDetailedUserFromDatabase(userId);
    if (!detailedUser) {
      return null;
    }

    // Paso 3: Obtener el perfil específico (paciente/profesional)
    const specificProfile = await getSpecificProfile(detailedUser);

    return {
      user: detailedUser,
      profile: specificProfile,
      loading: false,
      error: null,
    };

  } catch (err) {
    console.error("Error inesperado en getFullUserProfileData:", err);
    return null;
  }
}