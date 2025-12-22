"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { appointmentService, type AppointmentWithUsers } from "@/lib/services/appointmentService";
import JoinMeetingButton from "@/components/appointments/JoinMeetingButton";
import MeetingTimer from "@/components/appointments/MeetingTimer";
import ClinicalEvolutionForm from "@/components/clinical-records/ClinicalEvolutionForm";
import { ArrowLeft, Calendar, Clock, User, Mail, Phone, FileText, AlertCircle } from "lucide-react";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthState();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentWithUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);
  const [hasIntakeRecord, setHasIntakeRecord] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const loadAppointment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener perfil del usuario para verificar rol
        const profileResponse = await fetch("/api/profiles/me");
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setUserRole(profile.role);
        }

        const data = await appointmentService.getAppointmentById(appointmentId);
        if (!data) {
          setError("Cita no encontrada");
        } else {
          setAppointment(data);
        }
      } catch (err) {
        console.error("Error cargando cita:", err);
        setError("Error al cargar la cita");
      } finally {
        setIsLoading(false);
      }
    };

    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId, isAuthenticated, user, router]);

  // Verificar si existe ficha de ingreso
  useEffect(() => {
    const isProfessional = userRole === 3;
    if (isProfessional && appointment && appointment.patient_id && appointment.professional_id) {
      const checkIntakeRecord = async () => {
        try {
          // Importar dinámicamente para evitar problemas con SSR
          const { default: supabase } = await import("@/utils/supabase/client");
          
          // Verificar directamente en Supabase si existe una ficha de ingreso
          const { data: intakeRecord, error } = await supabase
            .from("patient_intake_records")
            .select("id")
            .eq("patient_id", appointment.patient_id)
            .eq("professional_id", appointment.professional_id)
            .maybeSingle();
          
          // Si hay un registro o el error es "no encontrado" (PGRST116), registrar el resultado
          if (intakeRecord || (error && error.code === "PGRST116")) {
            setHasIntakeRecord(!!intakeRecord);
          }
        } catch (error) {
          console.error("Error verificando ficha de ingreso:", error);
        }
      };
      checkIntakeRecord();
    }
  }, [userRole, appointment]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error || "Cita no encontrada"}</p>
        </div>
      </div>
    );
  }

  const scheduledDate = appointment.scheduled_at ? new Date(appointment.scheduled_at) : null;
  const isProfessional = userRole === 3;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Detalle de la Cita
          </h1>
          <p className="text-gray-600">ID: {appointment.id}</p>
        </div>

        {/* Información de la cita */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium text-gray-900">
                {scheduledDate
                  ? scheduledDate.toLocaleDateString("es-CL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })
                  : "Sin fecha"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Hora</p>
              <p className="font-medium text-gray-900">
                {scheduledDate
                  ? scheduledDate.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Sin hora"}
              </p>
            </div>
          </div>
        </div>

        {/* Información del paciente/profesional */}
        {isProfessional && appointment.patient && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Información del Paciente
              </h2>
              {appointment.patient_id && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/clinical-records/${appointment.patient_id}`)
                  }
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Ver Ficha Clínica Completa
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">
                  {appointment.patient.name} {appointment.patient.last_name}
                </span>
              </div>
              {appointment.patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{appointment.patient.email}</span>
                </div>
              )}
              {appointment.patient.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{appointment.patient.phone_number}</span>
                </div>
              )}
            </div>
            {hasIntakeRecord === false && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Ficha de ingreso pendiente
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Se recomienda completar la ficha de ingreso antes de la primera sesión.
                    </p>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/clinical-records/${appointment.patient_id}`)
                      }
                      className="text-xs text-yellow-800 underline mt-1 hover:text-yellow-900"
                    >
                      Completar ficha de ingreso
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isProfessional && appointment.professional && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Profesional
            </h2>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {appointment.professional.name} {appointment.professional.last_name}
              </span>
            </div>
          </div>
        )}

        {/* Información del servicio */}
        {appointment.service && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Servicio</p>
            <p className="font-medium text-gray-900">{appointment.service}</p>
          </div>
        )}

        {/* Timer y botón de unirse */}
        {appointment.scheduled_at && appointment.duration_minutes && (
          <div className="border-t pt-4 space-y-4">
            <MeetingTimer
              scheduledAt={appointment.scheduled_at}
              durationMinutes={appointment.duration_minutes}
            />
            <JoinMeetingButton
              meetLink={appointment.meeting_url || appointment.meet_link}
              scheduledAt={appointment.scheduled_at}
              durationMinutes={appointment.duration_minutes}
              appointmentId={String(appointment.id)}
            />
          </div>
        )}

        {/* Ficha clínica (solo para profesionales) */}
        {isProfessional &&
          appointment.scheduled_at &&
          appointment.duration_minutes && (
            <div className="border-t pt-4">
              <ClinicalEvolutionForm
                appointmentId={String(appointment.id)}
                scheduledAt={appointment.scheduled_at}
                durationMinutes={appointment.duration_minutes}
              />
            </div>
          )}
      </div>
    </div>
  );
}

