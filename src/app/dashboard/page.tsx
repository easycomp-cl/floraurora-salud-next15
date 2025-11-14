"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { AdminOverview } from "@/components/acc-to-page/dashboard/AdminOverview";
import { ProfessionalOverview } from "@/components/acc-to-page/dashboard/ProfessionalOverview";

export default function DashboardPage() {
  const { user, session, isLoading, isAuthenticated } = useAuthState();
  const [role, setRole] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!user) {
        if (isMounted) setRole(null);
        return;
      }

      try {
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) return;
        setRole(profile?.role ?? null);
      } catch (error) {
        console.error("Error obteniendo el rol del usuario:", error);
        if (isMounted) setRole(null);
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const { isAdmin, isProfessional, isPatient } = useMemo(() => {
    return {
      isAdmin: role === 1,
      isPatient: role === 2,
      isProfessional: role === 3,
    };
  }, [role]);

  const quickActions = useMemo(() => {
    if (isAdmin) {
      return [
        { href: "/admin/users", label: "Gestionar usuarios" },
        { href: "/admin/professionals", label: "Gestionar profesionales" },
        { href: "/admin/reports", label: "Ver reportes" },
        { href: "/admin/settings", label: "Configuración general" },
      ];
    }

    if (isProfessional) {
      return [
        { href: "/dashboard/appointments", label: "Mis citas" },
        { href: "/dashboard/sessions", label: "Mis sesiones" },
        { href: "/dashboard/profile", label: "Actualizar perfil" },
      ];
    }

    return [
      { href: "/dashboard/appointments", label: "Agendar o revisar citas" },
      { href: "/dashboard/profile", label: "Completar datos personales" },
      { href: "/messages", label: "Mensajes" },
    ];
  }, [isAdmin, isProfessional]);

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
            Acceso denegado
          </h1>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminOverview />
        </div>
      </div>
    );
  }

  if (isProfessional) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProfessionalOverview />
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

          <div className="mb-6">
            <div className="w-full">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-purple-900 mb-4">
                  Acciones rápidas
                </h2>
                <div className="flex flex-col md:flex-row gap-4">
                  {quickActions.map((action) => (
                    <a
                      key={action.href}
                      href={action.href}
                      className="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700 text-center"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Información del usuario
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>ID:</strong> {user?.id}
                </p>
                <p>
                  <strong>Rol:</strong>{" "}
                  {isProfessional
                    ? "Profesional"
                    : isPatient
                      ? "Paciente"
                      : "No especificado"}
                </p>
                <p>
                  <strong>Proveedor:</strong>{" "}
                  {user?.app_metadata?.provider || "email"}
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                Estado de la sesión
              </h2>
              <div className="space-y-2 text-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
