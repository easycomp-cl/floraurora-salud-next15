"use client";
import React, { useState } from "react";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";
import { GoogleUserData } from "@/lib/services/googleAuthService";

interface GoogleOAuthButtonProps {
  onSuccess?: (userData: {
    id: number;
    email: string;
    name: string;
    google_id: string;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
  }) => void;
  onError?: (error: string) => void;
  onUserExists?: (userData: {
    id: number;
    email: string;
    name: string;
    google_id: string;
    profile_picture?: string;
    created_at: string;
    updated_at: string;
  }) => void;
}

/**
 * Botón de Google OAuth que maneja inicio de sesión y registro automático
 */
const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  onUserExists,
}) => {
  const {
    isLoading,
    error,
    user,
    registerGoogleUser,
    checkUserExists,
    clearError,
    resetState,
  } = useGoogleAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Simula el flujo de Google OAuth (en un caso real, esto vendría de Google)
   */
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    clearError();

    try {
      // Simular datos que vendrían de Google OAuth
      const mockGoogleData: GoogleUserData = {
        id: `google_${Date.now()}`, // ID único de Google
        name: "María González",
        email: `maria.gonzalez${Date.now()}@gmail.com`,
        picture: "https://via.placeholder.com/150",
      };

      console.log("🔐 Iniciando sesión con Google OAuth:", mockGoogleData);

      // 1. Verificar si el usuario ya existe
      const userExists = await checkUserExists(mockGoogleData.email);

      if (userExists) {
        console.log("👤 Usuario existente, iniciando sesión...");
        if (onUserExists && user) {
          onUserExists({
            id: user.id,
            email: user.email,
            name: user.name,
            google_id: user.google_id,
            profile_picture: user.profile_picture,
            created_at: user.created_at,
            updated_at: user.updated_at,
          });
        }
        return;
      }

      // 2. Si no existe, registrarlo automáticamente
      console.log("📝 Usuario nuevo, registrando automáticamente...");
      const success = await registerGoogleUser(mockGoogleData);

      if (success) {
        console.log("✅ Usuario registrado e iniciado sesión exitosamente");
        if (onSuccess && user) {
          onSuccess(user);
        }
      } else {
        console.error("❌ Error al registrar usuario");
        if (onError) {
          onError(error || "Error al registrar usuario");
        }
      }
    } catch (err) {
      console.error("💥 Error inesperado:", err);
      if (onError) {
        onError("Error inesperado durante la autenticación");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        🔐 Google OAuth - Inicio de Sesión
      </h2>

      {/* Botón de Google OAuth */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading || isAuthenticating}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading || isAuthenticating ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            {isAuthenticating ? "Autenticando..." : "Procesando..."}
          </>
        ) : (
          <>
            <span className="mr-2">🔐</span>
            Iniciar Sesión con Google
          </>
        )}
      </button>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Mostrar datos del usuario si se autenticó exitosamente */}
      {user && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-semibold mb-2">
            ✅ Usuario autenticado exitosamente:
          </h3>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Google ID:</strong> {user.google_id}
          </p>
          <p>
            <strong>Nombre:</strong> {user.name}
          </p>
          <p>
            <strong>Apellido:</strong> {user.last_name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Rol:</strong> {user.role === 1 ? "Paciente" : "Desconocido"}
          </p>
        </div>
      )}

      {/* Información del flujo */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📋 Flujo de Autenticación
        </h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Usuario hace clic en &quot;Iniciar Sesión con Google&quot;</li>
          <li>Sistema verifica si el usuario ya existe en la base de datos</li>
          <li>
            <strong>Si existe:</strong> Inicia sesión directamente
          </li>
          <li>
            <strong>Si no existe:</strong> Se registra automáticamente
          </li>
          <li>
            Usuario queda autenticado y sus datos se guardan en la tabla users
          </li>
        </ol>
      </div>

      {/* Botón para resetear estado */}
      <button
        onClick={resetState}
        className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        🔄 Resetear Estado
      </button>
    </div>
  );
};

export default GoogleOAuthButton;
