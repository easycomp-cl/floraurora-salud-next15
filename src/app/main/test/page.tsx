"use client";

import React from "react";
import GoogleOAuthButton from "@/components/google/GoogleOAuthButton";
import WorkingGoogleOAuthButton from "@/components/google/WorkingGoogleOAuthButton";
import { supabase } from "@/utils/supabase/client";

export default function TestPage() {
  const handleSimpleGoogleAuth = async () => {
    try {
      console.log("🔐 Iniciando autenticación simple con Google...");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("❌ Error:", error);
        return;
      }

      if (data?.url) {
        console.log("✅ Redirigiendo a:", data.url);
        console.log(
          "📋 El usuario será verificado/creado automáticamente en el callback"
        );
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("💥 Error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧪 Página de Pruebas - FlorAurora Salud
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Botón Simple de Google OAuth */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔐 Google OAuth Simple
            </h2>
            <p className="text-gray-600 mb-4">
              Botón de prueba simple sin configuraciones adicionales
            </p>
            <button
              onClick={handleSimpleGoogleAuth}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              🚀 Probar Google OAuth Simple
            </button>
          </div>

          {/* Botón WorkingGoogleOAuthButton */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔐 Google OAuth Funcional
            </h2>
            <p className="text-gray-600 mb-4">
              Botón con configuración completa y manejo de estados
            </p>
            <WorkingGoogleOAuthButton />
          </div>

          {/* Botón GoogleOAuthButton (Mock) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔐 Google OAuth Mock
            </h2>
            <p className="text-gray-600 mb-4">
              Simulación de autenticación (no va a Google real)
            </p>
            <GoogleOAuthButton />
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            📋 Instrucciones de Prueba
          </h3>
          <ol className="text-blue-700 space-y-1 list-decimal list-inside">
            <li>
              Usa el <strong>Botón Simple</strong> primero (más básico)
            </li>
            <li>
              Si falla, usa el <strong>Botón Funcional</strong>
            </li>
            <li>
              El <strong>Botón Mock</strong> es solo para pruebas locales
            </li>
            <li>Revisa la consola para ver los logs</li>
          </ol>
        </div>

        <div className="mt-6 bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            ✅ Funcionalidad Implementada
          </h3>
          <ul className="text-green-700 space-y-1 list-disc list-inside">
            <li>
              <strong>Verificación automática:</strong> Se verifica si el
              usuario existe en la tabla users
            </li>
            <li>
              <strong>Creación automática:</strong> Si no existe, se crea
              automáticamente
            </li>
            <li>
              <strong>Mapeo de datos:</strong> Se extraen nombre, apellido y
              email de Google
            </li>
            <li>
              <strong>Rol por defecto:</strong> Se asigna rol 2 (según tu
              esquema)
            </li>
            <li>
              <strong>Logs detallados:</strong> Se registra todo el proceso en
              la consola
            </li>
          </ul>
        </div>

        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Campos Requeridos vs Opcionales
          </h3>
          <div className="text-yellow-700 text-sm">
            <p className="mb-2">
              <strong>Se crean automáticamente:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                user_id, email, name, last_name, role, is_active, created_at
              </li>
            </ul>
            <p className="mt-2">
              <strong>Se completan después:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>rut, phone_number, birth_date, address</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
