"use client";

import { useState, useEffect } from "react";
import { Save, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface ClinicalRecordFormProps {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  className?: string;
}

interface ClinicalRecord {
  id?: string;
  notes?: string | null;
  evolution?: string | null;
  observations?: string | null;
  diagnostic_hypothesis?: string | null;
}

/**
 * Componente de formulario para fichas clínicas
 * Solo está disponible dentro de la ventana de tiempo válida (5 min antes hasta 5 min después)
 */
export default function ClinicalRecordForm({
  appointmentId,
  scheduledAt,
  durationMinutes,
  className = "",
}: ClinicalRecordFormProps) {
  const [formData, setFormData] = useState<ClinicalRecord>({
    notes: "",
    evolution: "",
    observations: "",
    diagnostic_hypothesis: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithinWindow, setIsWithinWindow] = useState(false);
  const [windowMessage, setWindowMessage] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Verificar ventana de tiempo y cargar datos existentes
  useEffect(() => {
    const checkTimeWindow = async () => {
      const now = new Date();
      const startTime = new Date(scheduledAt);
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      const windowStart = new Date(startTime.getTime() - 5 * 60 * 1000);
      const windowEnd = new Date(endTime.getTime() + 5 * 60 * 1000);

      if (now < windowStart) {
        setIsWithinWindow(false);
        const minutesUntilStart = Math.ceil(
          (windowStart.getTime() - now.getTime()) / (1000 * 60)
        );
        if (minutesUntilStart > 60) {
          const hours = Math.floor(minutesUntilStart / 60);
          setWindowMessage(
            `La ficha clínica estará disponible en ${hours} hora${hours > 1 ? "s" : ""}`
          );
        } else {
          setWindowMessage(
            `La ficha clínica estará disponible en ${minutesUntilStart} minuto${minutesUntilStart > 1 ? "s" : ""}`
          );
        }
      } else if (now >= windowStart && now <= windowEnd) {
        setIsWithinWindow(true);
        if (now < startTime) {
          setWindowMessage("La sesión comenzará pronto");
        } else if (now >= startTime && now <= endTime) {
          setWindowMessage("Sesión en curso");
        } else {
          setWindowMessage("Ventana de edición activa (5 minutos después del fin)");
        }
      } else {
        setIsWithinWindow(false);
        setWindowMessage("La ventana de tiempo para editar ha expirado");
      }

      // Cargar ficha clínica existente si está dentro de la ventana
      if (now >= windowStart && now <= windowEnd) {
        try {
          const response = await fetch(
            `/api/appointments/${appointmentId}/clinical-record`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.clinicalRecord) {
              setFormData({
                notes: data.clinicalRecord.notes || "",
                evolution: data.clinicalRecord.evolution || "",
                observations: data.clinicalRecord.observations || "",
                diagnostic_hypothesis: data.clinicalRecord.diagnostic_hypothesis || "",
              });
            }
          }
        } catch (error) {
          console.error("Error cargando ficha clínica:", error);
        }
      }

      setIsLoading(false);
    };

    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [appointmentId, scheduledAt, durationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/clinical-record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error guardando ficha clínica");
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error guardando ficha clínica:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error guardando ficha clínica"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Ficha Clínica
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {isWithinWindow ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-gray-500" />
            )}
            <span
              className={
                isWithinWindow ? "text-green-700" : "text-gray-600"
              }
            >
              {windowMessage}
            </span>
          </div>
        </div>
      </div>

      {!isWithinWindow ? (
        <div className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{windowMessage}</p>
          <p className="text-sm text-gray-500 mt-2">
            La ficha clínica solo está disponible 5 minutos antes de la sesión
            hasta 5 minutos después de que termine.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notas
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas generales de la sesión..."
            />
          </div>

          <div>
            <label
              htmlFor="evolution"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Evolución
            </label>
            <textarea
              id="evolution"
              rows={4}
              value={formData.evolution || ""}
              onChange={(e) =>
                setFormData({ ...formData, evolution: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Evolución del paciente durante la sesión..."
            />
          </div>

          <div>
            <label
              htmlFor="observations"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Observaciones
            </label>
            <textarea
              id="observations"
              rows={4}
              value={formData.observations || ""}
              onChange={(e) =>
                setFormData({ ...formData, observations: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones clínicas relevantes..."
            />
          </div>

          <div>
            <label
              htmlFor="diagnostic_hypothesis"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Hipótesis Diagnóstica
            </label>
            <textarea
              id="diagnostic_hypothesis"
              rows={3}
              value={formData.diagnostic_hypothesis || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  diagnostic_hypothesis: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hipótesis diagnóstica..."
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {saveStatus === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                Ficha clínica guardada exitosamente
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium
                ${
                  isSaving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
              `}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar Ficha Clínica"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

