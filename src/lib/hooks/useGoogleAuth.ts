import { useState, useCallback } from 'react';
import GoogleAuthService, { GoogleUserData, CreateUserData } from '../services/googleAuthService';

interface UseGoogleAuthReturn {
  // Estados
  isLoading: boolean;
  error: string | null;
  user: any | null;
  
  // Funciones
  registerGoogleUser: (googleUserData: GoogleUserData) => Promise<boolean>;
  checkUserExists: (googleId: string) => Promise<boolean>;
  updateUser: (googleId: string, updates: Partial<CreateUserData>) => Promise<boolean>;
  signInGoogleUser: (email: string) => Promise<boolean>;
  clearError: () => void;
  resetState: () => void;
}

/**
 * Hook personalizado para manejar la autenticación de Google
 */
export const useGoogleAuth = (): UseGoogleAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  /**
   * Registra un usuario de Google
   */
  const registerGoogleUser = useCallback(async (googleUserData: GoogleUserData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Iniciando registro de usuario...');
      const result = await GoogleAuthService.registerGoogleUser(googleUserData);
      
      if (result.success && result.data) {
        console.log('✅ Usuario registrado exitosamente:', result.data);
        // Usar userRecord del resultado, no del estado
        setUser(result.data.userRecord);
        return true;
      } else {
        const errorMessage = result.error?.message || 'Error al registrar usuario';
        console.error('❌ Error en registro:', errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      console.error('💥 Error inesperado en registro:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verifica si un usuario de Google ya existe
   */
  const checkUserExists = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Verificando si existe usuario...');
      const result = await GoogleAuthService.checkGoogleUserExists(email);
      
      if (result.error) {
        const errorMessage = result.error.message || 'Error al verificar usuario';
        console.error('❌ Error al verificar usuario:', errorMessage);
        setError(errorMessage);
        return false;
      }
      
      if (result.exists && result.data) {
        console.log('👤 Usuario existente encontrado:', result.data);
        setUser(result.data);
      }
      
      return result.exists;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      console.error('💥 Error inesperado al verificar usuario:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Actualiza los datos de un usuario existente
   */
  const updateUser = useCallback(async (userId: number, updates: Partial<CreateUserData>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📝 Actualizando usuario...');
      const result = await GoogleAuthService.updateGoogleUser(userId, updates);
      
      if (result.success && result.data) {
        console.log('✅ Usuario actualizado exitosamente:', result.data);
        setUser(result.data);
        return true;
      } else {
        const errorMessage = result.error?.message || 'Error al actualizar usuario';
        console.error('❌ Error en actualización:', errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      console.error('💥 Error inesperado en actualización:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Inicia sesión con un usuario de Google existente
   */
  const signInGoogleUser = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Iniciando sesión...');
      const result = await GoogleAuthService.signInGoogleUser(email);
      
      if (result.success && result.data) {
        console.log('✅ Inicio de sesión exitoso:', result.data);
        setUser(result.data);
        return true;
      } else {
        const errorMessage = result.error?.message || 'Error al iniciar sesión';
        console.error('❌ Error en inicio de sesión:', errorMessage);
        setError(errorMessage);
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado';
      console.error('💥 Error inesperado en inicio de sesión:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Resetea el estado del hook
   */
  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setUser(null);
  }, []);

  return {
    // Estados
    isLoading,
    error,
    user,
    
    // Funciones
    registerGoogleUser,
    checkUserExists,
    updateUser,
    signInGoogleUser,
    clearError,
    resetState
  };
};

export default useGoogleAuth;
