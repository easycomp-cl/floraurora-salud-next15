"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { useSearchParams, useRouter } from "next/navigation";
import AppointmentScheduler from "@/components/appointments/AppointmentScheduler";
import { profileService } from "@/lib/services/profileService";

export default function AppointmentsPage() {
  const { isAuthenticated, isLoading, user } = useAuthState();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPatient, setIsPatient] = useState<boolean | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRole = async () => {
      if (!user) {
        if (isMounted) {
          setIsPatient(null);
          setRoleError(null);
          setIsRoleLoading(false);
        }
        return;
      }

      try {
        setIsRoleLoading(true);
        setRoleError(null);
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) return;

        const role = profile?.role ?? null;
        const patient = role === 2;
        setIsPatient(patient);

        if (!patient) {
          setRoleError("Solo los pacientes pueden agendar nuevas citas.");
        }
      } catch (error) {
        console.error("Error obteniendo el rol del usuario:", error);
        if (isMounted) {
          setIsPatient(false);
          setRoleError(
            "No pudimos verificar tu rol. Por favor, intenta nuevamente más tarde."
          );
        }
      } finally {
        if (isMounted) {
          setIsRoleLoading(false);
        }
      }
    };

    loadRole();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Manejar mensajes de pago desde la URL (para compatibilidad con redirecciones antiguas)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "cancelled" || payment === "error" || payment === "rejected") {
      // Redirigir a la página de error dedicada
      const reason = searchParams.get("reason");
      const params = new URLSearchParams({ reason: payment });
      if (reason) params.set("reason", reason);
      router.replace(`/dashboard/appointments/payment-error?${params.toString()}`);
    }
  }, [searchParams, router]);

  if (isLoading || isRoleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  // No redirigir inmediatamente si hay usuario pero no hay sesión (puede estar refrescándose)
  // Usar router.push en lugar de redirect para dar tiempo al refresh del token
  if (!isAuthenticated && !user) {
    router.push("/login");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirigiendo...</div>
      </div>
    );
  }

  // Si hay usuario pero no hay sesión todavía, esperar un poco más
  if (!isAuthenticated && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando sesión...</div>
      </div>
    );
  }

  if (!isPatient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              Acceso restringido
            </h1>
            <p className="text-gray-600 mb-6">
              {roleError ?? "Esta sección está disponible únicamente para pacientes."}
            </p>
            <a
              href="/dashboard/sessions"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver mis citas
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agendar Cita
          </h1>
          <p className="text-xl text-gray-600">
            Selecciona un profesional, servicio y horario disponible
          </p>
        </div>

        <AppointmentScheduler />
      </div>
    </div>
  );
}
