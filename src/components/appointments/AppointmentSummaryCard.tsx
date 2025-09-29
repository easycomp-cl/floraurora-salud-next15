"use client";
import { AppointmentSummary } from "@/lib/types/appointment";
import { User, Clock, Calendar, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentSummaryCardProps {
  summary: AppointmentSummary;
  onConfirm: () => void;
  canConfirm: boolean;
}

export default function AppointmentSummaryCard({
  summary,
  onConfirm,
  canConfirm,
}: AppointmentSummaryCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min.`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMinutes}min.`;
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", {
      locale: es,
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Formato HH:MM
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Resumen de Cita
      </h2>

      {!summary.professional ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Selecciona un profesional para comenzar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profesional */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Profesional
            </h3>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900">
                {summary.professional.name}
              </p>
              <p className="text-sm text-blue-700">
                {summary.professional.title_name || "Profesional"}
              </p>
            </div>
          </div>

          {/* Servicio */}
          {summary.service && (
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Servicio
              </h3>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="font-medium text-green-900">
                  {summary.service.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-green-700">
                    {formatDuration(summary.duration_minutes)}
                  </span>
                  <span className="font-semibold text-green-900">
                    {formatPrice(summary.total_price)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fecha y Hora */}
          {summary.date && summary.time && (
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Fecha y Hora
              </h3>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="font-medium text-purple-900">
                  {formatDate(summary.date)}
                </p>
                <p className="text-sm text-purple-700">
                  {formatTime(summary.time)}
                </p>
              </div>
            </div>
          )}

          {/* Resumen de Precio */}
          {summary.service && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Duración:</span>
                <span className="font-medium">
                  {formatDuration(summary.duration_minutes)}
                </span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span>Total:</span>
                <span className="text-green-600">
                  {formatPrice(summary.total_price)}
                </span>
              </div>
            </div>
          )}

          {/* Botón de Confirmar */}
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
              ${
                canConfirm
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {canConfirm ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmar Cita</span>
              </>
            ) : (
              <span>Completa la selección</span>
            )}
          </button>

          {/* Nota informativa */}
          <div className="text-xs text-gray-500 text-center">
            <p>Al confirmar, se reservará tu horario y recibirás</p>
            <p>una confirmación por email y WhatsApp.</p>
          </div>
        </div>
      )}
    </div>
  );
}
