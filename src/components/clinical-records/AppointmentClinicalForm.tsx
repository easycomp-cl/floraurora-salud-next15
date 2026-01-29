"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import supabase from "@/utils/supabase/client";

interface AppointmentClinicalFormProps {
  appointmentId: string;
  patientId: number;
  professionalId: number;
  onSuccess?: () => void;
  className?: string;
}

interface ClinicalFormData {
  medical_history: string;
  family_history: string;
  consultation_reason: string;
}

export default function AppointmentClinicalForm({
  appointmentId,
  patientId,
  professionalId,
  onSuccess,
  className = "",
}: AppointmentClinicalFormProps) {
  const [formData, setFormData] = useState<ClinicalFormData>({
    medical_history: "",
    family_history: "",
    consultation_reason: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Cargar datos existentes
  useEffect(() => {
    const loadClinicalData = async () => {
      try {
        setIsLoading(true);
        // Normalizar el appointmentId: asegurar que tenga el formato "APT-00000060"
        let normalizedAppointmentId: string;
        if (appointmentId.startsWith('APT-')) {
          normalizedAppointmentId = appointmentId;
        } else {
          const numericPart = appointmentId.replace(/[^0-9]/g, '');
          normalizedAppointmentId = `APT-${numericPart.padStart(8, '0')}`;
        }

        const { data: clinicalRecord, error } = await supabase
          .from("clinical_records")
          .select("*")
          .eq("appointment_id", normalizedAppointmentId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error cargando datos clínicos:", error);
        }

        if (clinicalRecord) {
          setFormData({
            medical_history: clinicalRecord.medical_history || "",
            family_history: clinicalRecord.family_history || "",
            consultation_reason: clinicalRecord.consultation_reason || "",
          });
        }
      } catch (error) {
        console.error("Error cargando datos clínicos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (appointmentId) {
      loadClinicalData();
    }
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      // Normalizar el appointmentId: asegurar que tenga el formato "APT-00000060"
      let normalizedAppointmentId: string;
      if (appointmentId.startsWith('APT-')) {
        normalizedAppointmentId = appointmentId;
      } else {
        const numericPart = appointmentId.replace(/[^0-9]/g, '');
        normalizedAppointmentId = `APT-${numericPart.padStart(8, '0')}`;
      }

      // Verificar si ya existe un registro clínico
      const { data: existingRecord, error: checkError } = await supabase
        .from("clinical_records")
        .select("id")
        .eq("appointment_id", normalizedAppointmentId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      const exists = !!existingRecord;

      if (exists) {
        // Actualizar registro existente
        const { error: updateError } = await supabase
          .from("clinical_records")
          .update({
            medical_history: formData.medical_history || null,
            family_history: formData.family_history || null,
            consultation_reason: formData.consultation_reason || null,
          })
          .eq("appointment_id", normalizedAppointmentId);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo registro
        const { error: insertError } = await supabase
          .from("clinical_records")
          .insert({
            appointment_id: normalizedAppointmentId,
            professional_id: professionalId,
            patient_id: patientId,
            medical_history: formData.medical_history || null,
            family_history: formData.family_history || null,
            consultation_reason: formData.consultation_reason || null,
          });

        if (insertError) throw insertError;
      }

      setSaveStatus("success");
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error guardando datos clínicos:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error guardando datos clínicos"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={`medical_history_${appointmentId}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Historia Médica/Psicológica Previa
            </label>
            <textarea
              id={`medical_history_${appointmentId}`}
              rows={4}
              value={formData.medical_history}
              onChange={(e) =>
                setFormData({ ...formData, medical_history: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa la historia médica y psicológica previa del paciente..."
            />
          </div>

          <div>
            <label
              htmlFor={`family_history_${appointmentId}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Antecedentes Familiares
            </label>
            <textarea
              id={`family_history_${appointmentId}`}
              rows={4}
              value={formData.family_history}
              onChange={(e) =>
                setFormData({ ...formData, family_history: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa los antecedentes familiares relevantes..."
            />
          </div>

          <div>
            <label
              htmlFor={`consultation_reason_${appointmentId}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Motivo de Consulta *
            </label>
            <textarea
              id={`consultation_reason_${appointmentId}`}
              rows={4}
              value={formData.consultation_reason}
              onChange={(e) =>
                setFormData({ ...formData, consultation_reason: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describa el motivo principal de la consulta..."
              required
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
                  Información clínica guardada exitosamente
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
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
                  Guardar
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
}
