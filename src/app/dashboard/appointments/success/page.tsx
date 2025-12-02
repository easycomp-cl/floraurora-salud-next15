"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  appointmentService,
  type AppointmentWithUsers,
} from "@/lib/services/appointmentService";
import JoinMeetingButton from "@/components/appointments/JoinMeetingButton";

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number") {
    return "Sin información";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (isoDate: string) => {
  return new Date(isoDate).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

const formatTime = (isoDate: string) => {
  return new Date(isoDate).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AppointmentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  // const requiresConfirmationParam = searchParams.get("requiresConfirmation"); // No usado actualmente
  const [appointment, setAppointment] = useState<AppointmentWithUsers | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAppointment = async () => {
      if (!appointmentId) {
        setError("No se encontró el identificador de la cita.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await appointmentService.getAppointmentById(appointmentId);
        if (!isMounted) return;

        if (!data) {
          setError("No pudimos encontrar los detalles de la cita.");
        } else {
          setAppointment(data);

          // Si el monto no está disponible en el appointment, intentar obtenerlo del pago
          if (!data.amount && appointmentId) {
            try {
              const paymentResponse = await fetch(
                `/api/payments/get-by-appointment?appointmentId=${encodeURIComponent(appointmentId)}`
              );
              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                if (paymentData.amount) {
                  setPaymentAmount(paymentData.amount);
                }
              }
            } catch (paymentErr) {
              console.warn("No se pudo obtener el monto del pago:", paymentErr);
            }
          }
        }
      } catch (err) {
        console.error("Error loading appointment success data:", err);
        if (isMounted) {
          setError(
            "Ocurrió un problema al recuperar la información de tu cita."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAppointment();

    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  // requiresConfirmation calculado pero no usado actualmente
  // const requiresConfirmation = useMemo(() => {
  //   if (requiresConfirmationParam !== null) {
  //     return requiresConfirmationParam === "true";
  //   }
  //   if (!appointment?.scheduled_at) return true;
  //   const scheduledDate = new Date(appointment.scheduled_at);
  //   return scheduledDate.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
  // }, [appointment?.scheduled_at, requiresConfirmationParam]);

  const hoursUntilAppointment = useMemo(() => {
    if (!appointment?.scheduled_at) return null;
    const scheduledDate = new Date(appointment.scheduled_at);
    const hours = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hours;
  }, [appointment?.scheduled_at]);

  const confirmationMessage = useMemo(() => {
    if (hoursUntilAppointment === null) {
      return "Te enviaremos un correo con un enlace para confirmar tu asistencia 24 horas antes de la cita.";
    }

    if (hoursUntilAppointment >= 24) {
      return "Te enviaremos un correo con un enlace para confirmar tu asistencia 24 horas antes de la cita.";
    } else {
      return "Como tu cita es en menos de 24 horas, queda confirmada automáticamente y no será necesario confirmar asistencia.";
    }
  }, [hoursUntilAppointment]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Preparando el resumen de tu cita...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-red-200 rounded-lg shadow-sm p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-red-600">
            Algo salió mal
          </h1>
          <p className="text-gray-600">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Volver
            </button>
            <Link
              href="/dashboard/sessions"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Ver mis citas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const scheduledDate = appointment.scheduled_at
    ? new Date(appointment.scheduled_at)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Pago realizado con éxito!
              </h1>
              <p className="text-gray-600 mt-1">
                Hemos enviado un correo con el detalle de tu cita y la
                confirmación del pago.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Pago aprobado
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Profesional
              </h2>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900">
                  {appointment.professional
                    ? `${appointment.professional.name ?? ""} ${appointment.professional.last_name ?? ""}`.trim() ||
                      appointment.professional.email
                    : "Por asignar"}
                </p>
                {appointment.professional?.email && (
                  <p className="text-sm text-gray-500">
                    {appointment.professional.email}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Servicio</h2>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900">
                  {appointment.service ?? "Consulta"}
                </p>
                {appointment.area && (
                  <p className="text-sm text-gray-500">
                    Área: {appointment.area}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Fecha</h2>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900">
                  {appointment.scheduled_at
                    ? formatDate(appointment.scheduled_at)
                    : "Por confirmar"}
                </p>
                <p className="text-sm text-gray-500">
                  {appointment.scheduled_at
                    ? formatTime(appointment.scheduled_at)
                    : ""}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Monto pagado
              </h2>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900">
                  {formatCurrency(paymentAmount ?? appointment.amount)}
                </p>
                <p className="text-sm text-gray-500">Moneda: CLP</p>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                ID de Cita
              </h2>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <p className="font-medium text-gray-900 font-mono">
                  {appointment.id || appointmentId || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Identificador único de tu cita
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-blue-900">
              Próximos pasos
            </h2>
            <p className="text-blue-800">
              En breve recibirás un correo con todos los detalles de la cita y
              el comprobante de pago.
            </p>
            <p className="text-blue-800">{confirmationMessage}</p>
            {scheduledDate &&
              scheduledDate.getTime() - Date.now() >= 2 * 60 * 60 * 1000 && (
                <p className="text-sm text-blue-700">
                  Te recomendamos añadir este evento a tu calendario y revisar
                  tu correo por si necesitas reprogramar.
                </p>
              )}
          </div>

          <div className="space-y-3">
            {appointment.meeting_url &&
              appointment.scheduled_at &&
              appointment.duration_minutes && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-green-800">
                      Enlace para la videollamada
                    </p>
                    <p className="text-sm text-green-700">
                      El botón estará disponible 5 minutos antes de la hora
                      programada.
                    </p>
                  </div>
                  <JoinMeetingButton
                    meetLink={appointment.meeting_url}
                    scheduledAt={appointment.scheduled_at}
                    durationMinutes={appointment.duration_minutes}
                    appointmentId={String(appointment.id)}
                  />
                </div>
              )}
            {appointment.invoice_url && (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-purple-800">
                    Comprobante de pago
                  </p>
                  <p className="text-sm text-purple-700">
                    Puedes descargar la boleta o factura para tus registros.
                  </p>
                </div>
                <a
                  href={appointment.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                >
                  Descargar comprobante
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              ¿Necesitas gestionar tu cita?
            </p>
            <p className="text-sm text-gray-600">
              Puedes revisar tus próximas sesiones o actualizar tus datos desde
              el dashboard.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors text-center"
            >
              Ir al dashboard
            </Link>
            <Link
              href="/dashboard/sessions"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-center"
            >
              Ver mis citas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
