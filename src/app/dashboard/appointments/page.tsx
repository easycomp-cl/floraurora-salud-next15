"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import { redirect } from "next/navigation";
import AppointmentScheduler from "@/components/appointments/AppointmentScheduler";

export default function AgendarCitaPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Agendar Cita Psicológica
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
