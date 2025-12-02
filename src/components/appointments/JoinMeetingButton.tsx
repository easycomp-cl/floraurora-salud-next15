"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Clock, CheckCircle2, XCircle } from "lucide-react";

interface JoinMeetingButtonProps {
  meetLink: string | null;
  scheduledAt: string; // ISO string
  durationMinutes: number;
  appointmentId: string;
  className?: string;
}

/**
 * Componente que muestra un botón para unirse a la videollamada de Google Meet
 * Solo está activo dentro de la ventana de tiempo válida:
 * - 5 minutos antes de la cita
 * - Hasta 5 minutos después del fin de la cita
 */
export default function JoinMeetingButton({
  meetLink,
  scheduledAt,
  durationMinutes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appointmentId: _appointmentId,
  className = "",
}: JoinMeetingButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    if (!meetLink) {
      setIsActive(false);
      setStatusMessage("Enlace de videollamada no disponible");
      return;
    }

    const checkTimeWindow = () => {
      const now = new Date();
      const startTime = new Date(scheduledAt);
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      // Ventana válida: 5 minutos antes hasta 5 minutos después del fin
      const windowStart = new Date(startTime.getTime() - 5 * 60 * 1000);
      const windowEnd = new Date(endTime.getTime() + 5 * 60 * 1000);

      if (now < windowStart) {
        // Aún no está en la ventana válida
        const minutesUntilStart = Math.ceil(
          (windowStart.getTime() - now.getTime()) / (1000 * 60)
        );
        setIsActive(false);
        if (minutesUntilStart > 24 * 60) {
          // Más de 24 horas: mostrar días
          const days = Math.floor(minutesUntilStart / (24 * 60));
          setStatusMessage(`Disponible en ${days} día${days > 1 ? "s" : ""}`);
        } else if (minutesUntilStart > 60) {
          // Más de 1 hora pero menos de 24 horas: mostrar horas
          const hours = Math.floor(minutesUntilStart / 60);
          setStatusMessage(`Disponible en ${hours} hora${hours > 1 ? "s" : ""}`);
        } else {
          // 60 minutos o menos: mostrar minutos
          setStatusMessage(`Disponible en ${minutesUntilStart} minuto${minutesUntilStart > 1 ? "s" : ""}`);
        }
      } else if (now >= windowStart && now <= windowEnd) {
        // Dentro de la ventana válida
        setIsActive(true);
        if (now < startTime) {
          const minutesUntilStart = Math.ceil(
            (startTime.getTime() - now.getTime()) / (1000 * 60)
          );
          setStatusMessage(`La sesión comenzará en ${minutesUntilStart} minuto${minutesUntilStart > 1 ? "s" : ""}`);
        } else if (now >= startTime && now <= endTime) {
          const minutesRemaining = Math.floor(
            (endTime.getTime() - now.getTime()) / (1000 * 60)
          );
          setStatusMessage(`Sesión en curso - ${minutesRemaining} minuto${minutesRemaining !== 1 ? "s" : ""} restante${minutesRemaining !== 1 ? "s" : ""}`);
        } else {
          // Después del fin pero dentro de la ventana de 5 minutos
          setStatusMessage("Sesión finalizada - Puedes acceder por 5 minutos más");
        }
      } else {
        // Fuera de la ventana válida (ya pasó)
        setIsActive(false);
        setStatusMessage("La ventana de acceso ha expirado");
      }
    };

    // Verificar inmediatamente
    checkTimeWindow();

    // Actualizar cada minuto
    const interval = setInterval(checkTimeWindow, 60000);

    return () => clearInterval(interval);
  }, [meetLink, scheduledAt, durationMinutes]);

  const handleJoinMeeting = () => {
    if (isActive && meetLink) {
      window.open(meetLink, "_blank", "noopener,noreferrer");
    }
  };

  if (!meetLink) {
    return (
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed ${className}`}
      >
        <XCircle className="h-4 w-4" />
        <span className="text-sm">Enlace no disponible</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleJoinMeeting}
        disabled={!isActive}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all
          ${
            isActive
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }
        `}
        title={isActive ? "Unirse a la videollamada" : statusMessage}
      >
        {isActive ? (
          <>
            <ExternalLink className="h-4 w-4" />
            <span>Ir a la cita</span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4" />
            <span>Ir a la cita</span>
          </>
        )}
      </button>
      {statusMessage && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          {isActive ? (
            <CheckCircle2 className="h-3 w-3 text-green-600" />
          ) : (
            <Clock className="h-3 w-3 text-gray-500" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

