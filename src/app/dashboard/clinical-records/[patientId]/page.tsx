"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { History, Shield, ArrowLeft, Loader2 } from "lucide-react";
import ClinicalHistoryView from "@/components/clinical-records/ClinicalHistoryView";
import PatientDataDisplay from "@/components/clinical-records/PatientDataDisplay";
import ClinicalEvolutionForm from "@/components/clinical-records/ClinicalEvolutionForm";
import { appointmentService } from "@/lib/services/appointmentService";
import type { AppointmentWithUsers } from "@/lib/services/appointmentService";

type TabType = "history" | "audit";

export default function ClinicalRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthState();
  const patientId = params.patientId as string;
  const appointmentId = searchParams.get("appointmentId");
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [userRole, setUserRole] = useState<number | null>(null);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentWithUsers | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false);

  useEffect(() => {
    // Esperar a que termine la carga de autenticación antes de verificar
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        // Usar profileService en lugar de fetch para evitar problemas con cookies
        const { profileService } = await import("@/lib/services/profileService");
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (profile) {
          setUserRole(profile.role);
          setProfessionalId(profile.id);
        }
      } catch (error) {
        console.error("Error obteniendo perfil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [isAuthenticated, user, router, authLoading]);

  // Cargar datos de la cita si hay appointmentId
  useEffect(() => {
    if (appointmentId && professionalId) {
      const loadAppointment = async () => {
        try {
          setIsLoadingAppointment(true);
          const data = await appointmentService.getAppointmentById(appointmentId);
          if (data) {
            setAppointment(data);
          }
        } catch (error) {
          console.error("Error cargando cita:", error);
        } finally {
          setIsLoadingAppointment(false);
        }
      };
      loadAppointment();
    }
  }, [appointmentId, professionalId]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 1;
  const isProfessional = userRole === 3;

  if (!isAdmin && !isProfessional) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            No tienes permisos para acceder a las fichas clínicas
          </p>
        </div>
      </div>
    );
  }

  const patientIdNum = parseInt(patientId, 10);
  if (isNaN(patientIdNum)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">ID de paciente inválido</p>
        </div>
      </div>
    );
  }

  if (!professionalId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            No se pudo obtener el ID del profesional
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Ficha Clínica Digital
        </h1>
        <p className="text-gray-600 mt-2">
          Gestión de fichas clínicas del paciente
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("history")}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <History className="h-4 w-4" />
            Historial Clínico
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("audit")}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === "audit"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <Shield className="h-4 w-4" />
              Auditoría
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "history" && (
          <>
            {/* Si hay appointmentId, mostrar datos del paciente y formulario de sesión */}
            {appointmentId ? (
              isLoadingAppointment ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                </div>
              ) : !appointment ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">Cita no encontrada</p>
                </div>
              ) : !appointment.scheduled_at || !appointment.duration_minutes ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-700">
                    La cita no tiene fecha y hora programadas. No se puede crear una ficha de evolución.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Datos del paciente (solo lectura) */}
                  <PatientDataDisplay
                    patientId={patientIdNum}
                    professionalId={professionalId}
                  />

                  {/* Formulario de evolución de la sesión */}
                  <ClinicalEvolutionForm
                    appointmentId={appointmentId}
                    scheduledAt={appointment.scheduled_at}
                    durationMinutes={appointment.duration_minutes}
                    onSuccess={() => {
                      // Recargar la página o actualizar el historial
                      router.refresh();
                    }}
                  />
                </div>
              )
            ) : (
              /* Si no hay appointmentId, mostrar historial clínico completo */
              <ClinicalHistoryView
                patientId={patientIdNum}
                professionalId={professionalId}
              />
            )}
          </>
        )}

        {activeTab === "audit" && isAdmin && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Logs de Auditoría
              </h2>
            </div>
            <p className="text-gray-600">
              Los logs de auditoría muestran todos los accesos y modificaciones
              realizadas en las fichas clínicas. Esta funcionalidad está disponible
              solo para administradores.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Para ver los logs específicos de un registro, acceda desde la API de
              auditoría o desde el panel de administración.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

