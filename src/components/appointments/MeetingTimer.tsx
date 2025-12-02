"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface MeetingTimerProps {
  scheduledAt: string; // ISO string
  durationMinutes: number;
  className?: string;
}

/**
 * Componente que muestra un timer para la sesión de videollamada
 * Muestra advertencias cuando quedan 5 minutos o menos
 */
export default function MeetingTimer({
  scheduledAt,
  durationMinutes,
  className = "",
}: MeetingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const startTime = new Date(scheduledAt);
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      if (now < startTime) {
        // Aún no ha comenzado
        setIsActive(false);
        setTimeRemaining(null);
        setShowWarning(false);
      } else if (now >= startTime && now <= endTime) {
        // Sesión en curso
        setIsActive(true);
        const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTimeRemaining(remaining);
        setShowWarning(remaining <= 5 * 60); // Advertencia si quedan 5 minutos o menos
      } else {
        // Sesión finalizada
        setIsActive(false);
        setTimeRemaining(0);
        setShowWarning(false);
      }
    };

    // Actualizar inmediatamente
    updateTimer();

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [scheduledAt, durationMinutes]);

  if (!isActive || timeRemaining === null) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  
  // Mostrar advertencia más fuerte cuando quedan menos de 2 minutos
  const isCritical = timeRemaining <= 2 * 60;

  return (
    <div
      className={`
        flex flex-col gap-2 px-4 py-3 rounded-lg shadow-sm
        ${
          isCritical
            ? "bg-red-100 text-red-800 border-2 border-red-300"
            : showWarning
            ? "bg-orange-50 text-orange-700 border-2 border-orange-200"
            : "bg-blue-50 text-blue-700 border border-blue-200"
        }
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {isCritical || showWarning ? (
          <AlertTriangle className={`h-5 w-5 ${isCritical ? "animate-pulse" : ""}`} />
        ) : (
          <Clock className="h-5 w-5" />
        )}
        <span className={`text-base font-bold ${isCritical ? "uppercase" : ""}`}>
          {isCritical
            ? `⚠️ Tiempo agotado: ${formattedTime} - Finalizar sesión ahora`
            : showWarning
            ? `⏰ Quedan ${formattedTime} - Sesión finalizando pronto`
            : `Tiempo restante: ${formattedTime}`}
        </span>
      </div>
      {(isCritical || showWarning) && (
        <p className="text-xs font-medium opacity-90">
          {isCritical
            ? "Por favor, finaliza la sesión ahora para respetar el tiempo programado."
            : "Recuerda finalizar la sesión cuando termine el tiempo programado."}
        </p>
      )}
    </div>
  );
}

