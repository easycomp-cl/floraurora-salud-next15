"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, XCircle, RefreshCw, ArrowLeft } from "lucide-react";

/**
 * Página de error/rechazo de pago
 * Muestra información cuando un pago falla, es rechazado o es cancelado
 */
export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  const reason = searchParams.get("reason");
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const [errorInfo, setErrorInfo] = useState<{
    title: string;
    description: string;
    icon: "error" | "warning" | "info";
    canRetry: boolean;
  } | null>(null);

  useEffect(() => {
    // Determinar el tipo de error basado en el reason
    let errorData: typeof errorInfo = null;

    switch (reason) {
      case "aborted":
        errorData = {
          title: "Transacción cancelada",
          description:
            "La transacción fue cancelada o ya había sido procesada anteriormente. Si realizaste el pago, verifica tu estado de cuenta.",
          icon: "warning",
          canRetry: true,
        };
        break;

      case "-1":
        errorData = {
          title: "Pago rechazado",
          description:
            "Tu tarjeta fue rechazada. Por favor, verifica los datos de tu tarjeta, el saldo disponible, o intenta con otra tarjeta.",
          icon: "error",
          canRetry: true,
        };
        break;

      case "rejected":
        errorData = {
          title: "Pago rechazado",
          description:
            status === "FAILED"
              ? "El pago no pudo ser procesado. Por favor, verifica los datos de tu tarjeta e intenta nuevamente."
              : "El pago fue rechazado. Por favor, verifica tus datos e intenta nuevamente.",
          icon: "error",
          canRetry: true,
        };
        break;

      case "cancelled":
        errorData = {
          title: "Pago cancelado",
          description:
            "Cancelaste el proceso de pago. Puedes intentar nuevamente cuando estés listo.",
          icon: "warning",
          canRetry: true,
        };
        break;

      case "invalid_response":
        errorData = {
          title: "Error en la respuesta del pago",
          description:
            "Hubo un problema al procesar la respuesta del sistema de pago. Por favor, intenta nuevamente.",
          icon: "error",
          canRetry: true,
        };
        break;

      case "appointment_not_found":
        errorData = {
          title: "No se encontró la cita",
          description:
            "No pudimos encontrar la información de tu cita. Por favor, contacta con soporte para verificar el estado de tu pago.",
          icon: "error",
          canRetry: false,
        };
        break;

      case "error":
      default:
        errorData = {
          title: "Error al procesar el pago",
          description:
            message || "Ocurrió un error inesperado durante el proceso de pago. Por favor, intenta nuevamente.",
          icon: "error",
          canRetry: true,
        };
        break;
    }

    setErrorInfo(errorData);
  }, [reason, status, message]);

  const handleRetry = () => {
    if (appointmentId) {
      // Si hay un appointmentId, redirigir a la página de appointments
      router.push("/dashboard/appointments");
    } else {
      // Si no hay appointmentId, volver a la página de appointments
      router.push("/dashboard/appointments");
    }
  };

  if (!errorInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Cargando información del error...</p>
        </div>
      </div>
    );
  }

  const IconComponent =
    errorInfo.icon === "error"
      ? XCircle
      : errorInfo.icon === "warning"
      ? AlertCircle
      : AlertCircle;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-6">
          {/* Icono y título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div
                className={`rounded-full p-4 ${
                  errorInfo.icon === "error"
                    ? "bg-red-100"
                    : errorInfo.icon === "warning"
                    ? "bg-yellow-100"
                    : "bg-blue-100"
                }`}
              >
                <IconComponent
                  className={`w-12 h-12 ${
                    errorInfo.icon === "error"
                      ? "text-red-600"
                      : errorInfo.icon === "warning"
                      ? "text-yellow-600"
                      : "text-blue-600"
                  }`}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{errorInfo.title}</h1>
            <p className="text-lg text-gray-600">{errorInfo.description}</p>
          </div>

          {/* Información adicional */}
          {(reason || status) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {reason && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Código de Error:
                  </span>
                  <span className="text-sm text-gray-900">{reason}</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Estado:
                  </span>
                  <span className="text-sm text-gray-900">{status}</span>
                </div>
              )}
            </div>
          )}

          {/* Mensaje de ayuda */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-blue-900">
              ¿Qué puedes hacer?
            </h2>
            <ul className="space-y-2 text-blue-800 list-disc list-inside">
              <li>Verifica que los datos de tu tarjeta sean correctos</li>
              <li>Asegúrate de tener saldo suficiente o crédito disponible</li>
              <li>Intenta con otra tarjeta si el problema persiste</li>
              <li>Contacta a tu banco si el problema continúa</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3">
            {errorInfo.canRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Intentar nuevamente</span>
              </button>
            )}
            <Link
              href="/dashboard/appointments"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a agendar</span>
            </Link>
            <Link
              href="/dashboard/sessions"
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Ver mis citas
            </Link>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-600">
            Si el problema persiste, por favor{" "}
            <Link
              href="/contact"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              contáctanos
            </Link>{" "}
            y te ayudaremos a resolverlo.
          </p>
        </div>
      </div>
    </div>
  );
}

