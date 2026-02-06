"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { AdminOverview } from "@/components/acc-to-page/dashboard/AdminOverview";
import { ProfessionalOverview } from "@/components/acc-to-page/dashboard/ProfessionalOverview";
import { PatientOverview } from "@/components/acc-to-page/dashboard/PatientOverview";

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const [role, setRole] = useState<number | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async () => {
      if (!user) {
        if (isMounted) {
          setRole(null);
          setIsRoleLoading(false);
        }
        return;
      }

      setIsRoleLoading(true);
      try {
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) return;
        
        if (profile) {
          setRole(profile.role ?? null);
        } else {
          // Si no hay perfil, intentar crear el usuario básico
          console.log("⚠️ No se encontró perfil del usuario, intentando crear usuario básico...");
          try {
            const { UserService } = await import("@/lib/services/userService");
            const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario";
            const nameParts = fullName.split(" ");
            const firstName = nameParts[0] || "Usuario";
            const lastName = nameParts.slice(1).join(" ") || "";
            
            const result = await UserService.createUser({
              user_id: user.id,
              email: user.email || "",
              name: firstName,
              last_name: lastName,
              role: 2, // Rol por defecto: paciente
              is_active: true,
            });
            
            if (result.success && result.data) {
              setRole(result.data.role ?? 2);
            } else {
              setRole(2); // Usar rol por defecto
            }
          } catch (createError) {
            console.error("Error al crear usuario básico:", createError);
            setRole(2); // Usar rol por defecto en caso de error
          }
        }
      } catch (error) {
        console.error("Error obteniendo el rol del usuario:", error);
        if (isMounted) {
          // En caso de error, usar rol por defecto (paciente)
          setRole(2);
        }
      } finally {
        if (isMounted) setIsRoleLoading(false);
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

  // quickActions se mantiene para referencia pero no se usa actualmente
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        { href: "/dashboard/sessions", label: "Mis Citas" },
        { href: "/dashboard/profile", label: "Actualizar perfil" },
      ];
    }

    return [
      { href: "/dashboard/appointments", label: "Agendar o revisar citas" },
      { href: "/dashboard/profile", label: "Completar datos personales" },
      { href: "/messages", label: "Mensajes" },
    ];
  }, [isAdmin, isProfessional]);

  if (isLoading || isRoleLoading) {
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

  if (isPatient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PatientOverview />
        </div>
      </div>
    );
  }

  // Si no tiene un rol válido, mostrar mensaje de acceso denegado
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
