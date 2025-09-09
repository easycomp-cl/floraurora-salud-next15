"use client";

import { useAuthState } from "@/lib/hooks/useAuthState";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, session, isLoading, isAuthenticated } = useAuthState();

  useEffect(() => {
    // console.log("📊 Dashboard: Estado de autenticación:", {
    //   loading,
    //   isAuthenticated,
    //   hasUser: !!user,
    //   hasSession: !!session,
    //   userEmail: user?.email,
    // });
  }, [user, session, isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Denegado
          </h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Dashboard de FlorAurora Salud
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Información del usuario */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Información del Usuario
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>ID:</strong> {user?.id}
                </p>
                <p>
                  <strong>Rol:</strong>{" "}
                  {user?.user_metadata?.role || "No especificado"}
                </p>
                <p>
                  <strong>Proveedor:</strong>{" "}
                  {user?.app_metadata?.provider || "email"}
                </p>
              </div>
            </div>

            {/* Estado de la sesión */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                Estado de la Sesión
              </h2>
              <div className="space-y-2">
                <p>
                  <strong>Autenticado:</strong> {isAuthenticated ? "Sí" : "No"}
                </p>
                <p>
                  <strong>Token de acceso:</strong>{" "}
                  {session?.access_token ? "Presente" : "Ausente"}
                </p>
                <p>
                  <strong>Token de refresco:</strong>{" "}
                  {session?.refresh_token ? "Presente" : "Ausente"}
                </p>
                <p>
                  <strong>Expira:</strong>{" "}
                  {session?.expires_at
                    ? new Date(session.expires_at * 1000).toLocaleString()
                    : "No especificado"}
                </p>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                Acciones Rápidas
              </h2>
              <div className="space-y-3">
                <a
                  href="/dashboard/appointments"
                  className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-center"
                >
                  Ver Citas
                </a>
                <a
                  href="/dashboard/sessions"
                  className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-center"
                >
                  Ver Sesiones
                </a>
                <a
                  href="/dashboard/profile"
                  className="block w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 text-center"
                >
                  Editar Perfil
                </a>
              </div>
            </div>
          </div>

          {/* Debug adicional */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Información de Debug
            </h3>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(
                {
                  user: user
                    ? {
                        id: user.id,
                        email: user.email,
                        metadata: user.user_metadata,
                        appMetadata: user.app_metadata,
                      }
                    : null,
                  session: session
                    ? {
                        access_token: !!session.access_token,
                        refresh_token: !!session.refresh_token,
                        expires_at: session.expires_at,
                        user_id: session.user?.id,
                      }
                    : null,
                  isAuthenticated,
                  isLoading,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
