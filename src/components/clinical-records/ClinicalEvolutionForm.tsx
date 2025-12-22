"use client";

import { useState, useEffect } from "react";
import { Save, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface ClinicalEvolutionFormProps {
  appointmentId: string;
  scheduledAt: string;
  durationMinutes: number;
  onSuccess?: () => void;
  className?: string;
}

interface EvolutionFormData {
  notes?: string;
  evolution?: string;
  observations?: string;
  diagnosis?: string;
  session_development?: string;
  treatment_applied?: string;
  next_session_indications?: string;
}

/**
 * Componente de formulario para fichas de evolución clínica
 * Expandido con todos los campos requeridos según las especificaciones
 */
export default function ClinicalEvolutionForm({
  appointmentId,
  scheduledAt,
  durationMinutes,
  onSuccess,
  className = "",
}: ClinicalEvolutionFormProps) {
  const [formData, setFormData] = useState<EvolutionFormData>({
    notes: "",
    evolution: "",
    observations: "",
    diagnosis: "",
    session_development: "",
    treatment_applied: "",
    next_session_indications: "",
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
            `/api/clinical-records/evolution/${appointmentId}`,
            {
              credentials: "include", // Incluir cookies para autenticación
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.evolutionRecord) {
              const record = data.evolutionRecord;
              setFormData({
                notes: record.notes || "",
                evolution: record.evolution || "",
                observations: record.observations || "",
                diagnosis: record.diagnosis || record.diagnostic_hypothesis || "",
                session_development: record.session_development || "",
                treatment_applied: record.treatment_applied || "",
                next_session_indications: record.next_session_indications || "",
              });
            }
          }
        } catch (error) {
          console.error("Error cargando ficha de evolución:", error);
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
        `/api/clinical-records/evolution/${appointmentId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Incluir cookies para autenticación
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error guardando ficha de evolución");
      }

      setSaveStatus("success");
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error guardando ficha de evolución:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error guardando ficha de evolución"
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ficha de Evolución Clínica
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Registro de evolución por sesión
            </p>
          </div>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Desarrollo de la Sesión */}
          <div>
            <label
              htmlFor="session_development"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Desarrollo de la Sesión *
            </label>
            <textarea
              id="session_development"
              rows={6}
              value={formData.session_development || ""}
              onChange={(e) =>
                setFormData({ ...formData, session_development: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa el desarrollo de la sesión, temas tratados, dinámica de la conversación..."
              required
            />
          </div>

          {/* Diagnóstico o Hipótesis Diagnóstica */}
          <div>
            <label
              htmlFor="diagnosis"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Diagnóstico o Hipótesis Diagnóstica
            </label>
            <textarea
              id="diagnosis"
              rows={4}
              value={formData.diagnosis || ""}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Registre el diagnóstico o hipótesis diagnóstica..."
            />
          </div>

          {/* Tratamiento Aplicado */}
          <div>
            <label
              htmlFor="treatment_applied"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tratamiento Aplicado
            </label>
            <textarea
              id="treatment_applied"
              rows={4}
              value={formData.treatment_applied || ""}
              onChange={(e) =>
                setFormData({ ...formData, treatment_applied: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa el tratamiento o intervenciones aplicadas durante la sesión..."
            />
          </div>

          {/* Observaciones */}
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
              placeholder="Observaciones clínicas relevantes de la sesión..."
            />
          </div>

          {/* Evolución */}
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

          {/* Indicaciones para Próxima Sesión */}
          <div>
            <label
              htmlFor="next_session_indications"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Indicaciones para la Próxima Sesión
            </label>
            <textarea
              id="next_session_indications"
              rows={4}
              value={formData.next_session_indications || ""}
              onChange={(e) =>
                setFormData({ ...formData, next_session_indications: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Indicaciones, tareas o temas a tratar en la próxima sesión..."
            />
          </div>

          {/* Notas Generales */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notas Generales
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales o comentarios generales..."
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {saveStatus === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">
                  Ficha de evolución guardada exitosamente
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`
                inline-flex items-center gap-2 px-6 py-2 rounded-md font-medium
                ${
                  isSaving
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Ficha de Evolución
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

