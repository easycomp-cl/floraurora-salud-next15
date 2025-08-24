"use client";
import React, { useEffect, useState } from "react";
import { useGoogleAuth } from "@/lib/hooks/useGoogleAuth";
import { GoogleUserData } from "@/lib/services/googleAuthService";

interface GoogleAuthHandlerProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
  onUserExists?: (userData: any) => void;
}

/**
 * Componente que maneja el flujo completo de autenticación de Google
 * Incluye registro de nuevos usuarios y manejo de usuarios existentes
 */
const GoogleAuthHandler: React.FC<GoogleAuthHandlerProps> = ({
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
    updateUser,
    clearError,
    resetState,
  } = useGoogleAuth();

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    rut: "",
    phone_number: "",
    birth_date: "",
    address: "",
  });

  // Simular datos de Google (en un caso real, esto vendría del callback de OAuth)
  const simulateGoogleCallback = async () => {
    // Datos simulados que Google proporcionaría
    const mockGoogleData: GoogleUserData = {
      sub: "google_123456789",
      name: "Juan Carlos Pérez",
      given_name: "Juan Carlos",
      family_name: "Pérez",
      email: "juan.perez@gmail.com",
      email_verified: true,
    };

    await handleGoogleUserData(mockGoogleData);
  };

  /**
   * Maneja los datos del usuario de Google
   */
  const handleGoogleUserData = async (googleUserData: GoogleUserData) => {
    try {
      console.log("🔄 Procesando datos de Google:", googleUserData);

      // 1. Verificar si el usuario ya existe
      const userExists = await checkUserExists(googleUserData.email);

      if (userExists) {
        console.log("👤 Usuario existente encontrado");
        if (onUserExists) {
          onUserExists(googleUserData);
        }
        return;
      }

      // 2. Registrar nuevo usuario
      console.log("📝 Registrando nuevo usuario...");
      const success = await registerGoogleUser(googleUserData);

      if (success) {
        console.log("✅ Usuario registrado exitosamente");
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
    }
  };

  /**
   * Actualiza los datos adicionales del usuario
   */
  const handleUpdateUser = async () => {
    if (!user) return;

    const updates: any = {
      created_at: new Date().toISOString(),
    };

    // Solo agregar campos que tengan valor
    if (formData.rut) updates.rut = formData.rut;
    if (formData.phone_number) updates.phone_number = formData.phone_number;
    if (formData.birth_date) updates.birth_date = formData.birth_date;
    if (formData.address) updates.address = formData.address;

    const success = await updateUser(user.id, updates);

    if (success) {
      setShowUpdateForm(false);
      if (onSuccess) {
        onSuccess(user);
      }
    }
  };

  /**
   * Maneja cambios en el formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Limpiar errores cuando cambien
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Autenticación con Google
      </h2>

      {/* Botón para simular callback de Google */}
      <button
        onClick={simulateGoogleCallback}
        disabled={isLoading}
        className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Procesando..." : "Simular Login con Google"}
      </button>

      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Mostrar datos del usuario si se registró exitosamente */}
      {user && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-semibold mb-2">
            Usuario registrado exitosamente:
          </h3>
          <p>
            <strong>ID:</strong> {user.id}
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

      {/* Formulario para datos adicionales */}
      {user && !showUpdateForm && (
        <button
          onClick={() => setShowUpdateForm(true)}
          className="w-full mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Completar Perfil
        </button>
      )}

      {showUpdateForm && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">
            Completar información del perfil
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12.345.678-9"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle Principal 123, Ciudad"
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleUpdateUser}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Guardando..." : "Guardar"}
              </button>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón para resetear estado */}
      <button
        onClick={resetState}
        className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
      >
        Resetear Estado
      </button>
    </div>
  );
};

export default GoogleAuthHandler;
