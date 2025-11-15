"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import { appointmentService } from "@/lib/services/appointmentService";
import { profileService } from "@/lib/services/profileService";
import type { AppointmentWithUsers } from "@/lib/services/appointmentService";

type UserRole = 1 | 2 | 3 | null;

export default function SessionsPage() {
  const { isAuthenticated, isLoading, user } = useAuthState();
  const [role, setRole] = useState<UserRole>(null);
  const [appointments, setAppointments] = useState<AppointmentWithUsers[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      if (!user) return;

      try {
        setLoadingAppointments(true);
        setError(null);

        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) return;

        if (!profile) {
          setRole(null);
          setAppointments([]);
          setError(
            "No pudimos encontrar tu perfil. Por favor, completa tus datos antes de continuar."
          );
          return;
        }

        setRole(profile.role as UserRole);

        if (profile.role === 1) {
          setAppointments([]);
          return;
        }

        const fetchedAppointments =
          profile.role === 2
            ? await appointmentService.getAppointmentsForPatient(profile.id)
            : await appointmentService.getAppointmentsForProfessional(profile.id);

        if (!isMounted) return;

        setAppointments(fetchedAppointments);
      } catch (err) {
        console.error("Error cargando citas:", err);
        if (isMounted) {
          setError(
            "Ocurrió un error al cargar tus citas. Intenta nuevamente en unos minutos."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingAppointments(false);
        }
      }
    };

    if (isAuthenticated && user) {
      loadAppointments();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const tableMode = role === 3 ? "professional" : "patient";

  const handleAppointmentUpdate = async () => {
    // Recargar las citas cuando se actualice una
    if (!user) return;

    try {
      setLoadingAppointments(true);
      setError(null);

      const profile = await profileService.getUserProfileByUuid(user.id);
      if (!profile) return;

      if (profile.role === 1) {
        setAppointments([]);
        return;
      }

      const fetchedAppointments =
        profile.role === 2
          ? await appointmentService.getAppointmentsForPatient(profile.id)
          : await appointmentService.getAppointmentsForProfessional(profile.id);

      setAppointments(fetchedAppointments);
    } catch (err) {
      console.error("Error recargando citas:", err);
      setError("Error al recargar las citas");
    } finally {
      setLoadingAppointments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Sesiones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza y gestiona las citas confirmadas en FlorAurora Salud.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {role === 1 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Esta vista está pensada para pacientes y profesionales
          </h2>
          <p className="text-gray-600 mb-4">
            Utiliza el panel de administración para gestionar todas las citas del
            sistema.
          </p>
          <a
            href="/admin/appointments"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir a Administrar Citas
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AppointmentsTable
            data={appointments}
            mode={tableMode}
            isLoading={loadingAppointments}
            emptyMessage={
              role === 3
                ? "Aún no tienes citas asignadas como profesional."
                : "Aún no has agendado ninguna cita."
            }
            onAppointmentUpdate={handleAppointmentUpdate}
          />
        </div>
      )}
    </div>
  );
}
