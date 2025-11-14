"use client";

import { useEffect, useState } from "react";
import AppointmentsTable from "@/components/appointments/AppointmentsTable";
import {
  appointmentService,
  type AppointmentWithUsers,
} from "@/lib/services/appointmentService";
import { profileService } from "@/lib/services/profileService";
import { useAuthState } from "@/lib/hooks/useAuthState";

export default function AdminAppointmentsPage() {
  const { user } = useAuthState();
  const [appointments, setAppointments] = useState<AppointmentWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      if (!user) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) {
          return;
        }

        if (!profile || profile.role !== 1) {
          setIsAuthorized(false);
          setError("No tienes permisos para acceder a esta sección.");
          return;
        }

        setIsAuthorized(true);

        const data = await appointmentService.getAllAppointments();

        if (!isMounted) return;

        setAppointments(data);
      } catch (err) {
        console.error("Error cargando citas para admin:", err);
        if (isMounted) {
          setError(
            "Ocurrió un error al cargar las citas. Intenta nuevamente más tarde."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Administración de Citas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Revisa el detalle de todas las citas agendadas en la plataforma.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {isAuthorized ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AppointmentsTable
            data={appointments}
            isLoading={isLoading}
            mode="admin"
            emptyMessage="Aún no se han registrado citas en el sistema."
          />
        </div>
      ) : (
        !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mb-4">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso restringido
            </h2>
            <p className="text-gray-600">
              Debes ser administrador para visualizar esta sección.
            </p>
          </div>
        )
      )}
    </div>
  );
}

