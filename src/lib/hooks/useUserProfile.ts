import { useState, useEffect } from "react";
import { useAuthState } from "./useAuthState";
import { UserService } from "@/lib/services/userService";

interface UserProfile {
  id: number;
  name?: string;
  last_name?: string;
  email?: string;
  role: number; // 1=admin, 2=patient, 3=professional
  is_active?: boolean;
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuthState();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserProfile();
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const result = await UserService.getUserById(user!.id);
      
      if (result.success && result.data) {
        setUserProfile(result.data as unknown as UserProfile);
      } else {
        // Crear perfil temporal basado en los datos de Supabase
        const tempProfile: UserProfile = {
          id: 0, // Temporal
          name: user!.user_metadata?.name || user!.email?.split('@')[0] || 'Usuario',
          email: user!.email || '',
          role: 2, // Por defecto paciente
          is_active: true
        };
        setUserProfile(tempProfile);
      }
    } catch (error) {
      console.error("Error al cargar perfil de usuario:", error);
      // Crear perfil temporal en caso de error
      const tempProfile: UserProfile = {
        id: 0,
        name: user!.user_metadata?.name || user!.email?.split('@')[0] || 'Usuario',
        email: user!.email || '',
        role: 2, // Por defecto paciente
        is_active: true
      };
      setUserProfile(tempProfile);
    } finally {
      setLoading(false);
    }
  };

  const isProfessional = userProfile?.role === 3;
  const isAdmin = userProfile?.role === 1;
  const isPatient = userProfile?.role === 2;

  return {
    userProfile,
    loading,
    isProfessional,
    isAdmin,
    isPatient,
    refreshProfile: loadUserProfile,
  };
}
