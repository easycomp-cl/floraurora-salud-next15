"use client";

import { useState, useEffect } from "react";
import { Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface PatientIntakeFormProps {
  patientId: number;
  professionalId: number;
  onSuccess?: () => void;
  className?: string;
}

interface IntakeFormData {
  full_name: string;
  rut: string;
  birth_date: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  medical_history: string;
  family_history: string;
  consultation_reason: string;
}

export default function PatientIntakeForm({
  patientId,
  professionalId,
  onSuccess,
  className = "",
}: PatientIntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    full_name: "",
    rut: "",
    birth_date: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
    medical_history: "",
    family_history: "",
    consultation_reason: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);

  // Calcular edad desde fecha de nacimiento
  useEffect(() => {
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.birth_date]);

  // Cargar datos existentes usando el cliente de Supabase directamente
  useEffect(() => {
    const loadIntakeRecord = async () => {
      try {
        setIsLoading(true);
        // Importar dinámicamente para evitar problemas con SSR
        const { default: supabase } = await import("@/utils/supabase/client");
        
        // Obtener ficha de ingreso directamente desde Supabase
        const { data: record, error } = await supabase
          .from("patient_intake_records")
          .select("*")
          .eq("patient_id", patientId)
          .eq("professional_id", professionalId)
          .maybeSingle();

        if (!error && record) {
          setFormData({
            full_name: record.full_name || "",
            rut: record.rut || "",
            birth_date: record.birth_date || "",
            gender: record.gender || "",
            email: record.email || "",
            phone: record.phone || "",
            address: record.address || "",
            medical_history: record.medical_history || "",
            family_history: record.family_history || "",
            consultation_reason: record.consultation_reason || "",
          });
          if (record.age) {
            setAge(record.age);
          }
        }
      } catch (error) {
        console.error("Error cargando ficha de ingreso:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && professionalId) {
      loadIntakeRecord();
    }
  }, [patientId, professionalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      // Importar dinámicamente para evitar problemas con SSR
      const { default: supabase } = await import("@/utils/supabase/client");
      
      // Verificar si existe registro
      const { data: existingRecord } = await supabase
        .from("patient_intake_records")
        .select("id")
        .eq("patient_id", patientId)
        .eq("professional_id", professionalId)
        .maybeSingle();

      const exists = !!existingRecord;

      // Calcular edad si hay fecha de nacimiento
      let calculatedAge: number | null = null;
      if (formData.birth_date) {
        const birthDate = new Date(formData.birth_date);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
      }

      if (exists) {
        // Actualizar registro existente
        const { error } = await supabase
          .from("patient_intake_records")
          .update({
            full_name: formData.full_name || null,
            rut: formData.rut || null,
            birth_date: formData.birth_date || null,
            age: calculatedAge,
            gender: formData.gender || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            medical_history: formData.medical_history || null,
            family_history: formData.family_history || null,
            consultation_reason: formData.consultation_reason || null,
          })
          .eq("patient_id", patientId)
          .eq("professional_id", professionalId)
          .select()
          .single();

        if (error) throw error;
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from("patient_intake_records")
          .insert({
            patient_id: patientId,
            professional_id: professionalId,
            full_name: formData.full_name || null,
            rut: formData.rut || null,
            birth_date: formData.birth_date || null,
            age: calculatedAge,
            gender: formData.gender || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            medical_history: formData.medical_history || null,
            family_history: formData.family_history || null,
            consultation_reason: formData.consultation_reason || null,
          })
          .select()
          .single();

        if (error) throw error;
      }

      setSaveStatus("success");
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error guardando ficha de ingreso:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Error guardando ficha de ingreso"
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
        <h3 className="text-lg font-semibold text-gray-900">
          Ficha de Ingreso del Paciente
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Complete la información inicial del paciente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Datos de Identificación */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Datos de Identificación
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre Completo *
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="rut"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                RUT *
              </label>
              <input
                type="text"
                id="rut"
                value={formData.rut}
                onChange={(e) =>
                  setFormData({ ...formData, rut: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="12.345.678-9"
                required
              />
            </div>

            <div>
              <label
                htmlFor="birth_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                id="birth_date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Edad
              </label>
              <input
                type="number"
                id="age"
                value={age || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Calculada automáticamente desde la fecha de nacimiento
              </p>
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sexo/Género
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
                <option value="prefiero_no_decir">Prefiero no decir</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo Electrónico *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Información Clínica Inicial */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Información Clínica Inicial
          </h4>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="medical_history"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Historia Médica/Psicológica Previa
              </label>
              <textarea
                id="medical_history"
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
                htmlFor="family_history"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Antecedentes Familiares
              </label>
              <textarea
                id="family_history"
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
                htmlFor="consultation_reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Motivo de Consulta *
              </label>
              <textarea
                id="consultation_reason"
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
          </div>
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
                Ficha de ingreso guardada exitosamente
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
                Guardar Ficha de Ingreso
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

