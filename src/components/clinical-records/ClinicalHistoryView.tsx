"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, Search } from "lucide-react";
import type { ClinicalHistory, PatientIntakeRecord, ClinicalEvolutionRecord } from "@/lib/services/clinicalRecordService";
import ClinicalRecordCard from "./ClinicalRecordCard";
import PatientIntakeForm from "./PatientIntakeForm";
import supabase from "@/utils/supabase/client";

interface ClinicalHistoryViewProps {
  patientId: number;
  professionalId: number;
  className?: string;
}

/**
 * Carga el historial clínico directamente usando el cliente de Supabase
 * Esto evita problemas con cookies en fetch desde el cliente
 */
async function loadClinicalHistoryData(
  patientId: number,
  professionalId: number
): Promise<ClinicalHistory> {
  // Obtener ficha de ingreso
  const { data: intakeRecord, error: intakeError } = await supabase
    .from("patient_intake_records")
    .select("*")
    .eq("patient_id", patientId)
    .eq("professional_id", professionalId)
    .maybeSingle();

  if (intakeError && intakeError.code !== "PGRST116") {
    console.error("Error obteniendo ficha de ingreso:", intakeError);
    throw intakeError;
  }

  // Obtener todas las fichas de evolución del paciente con este profesional
  const { data: evolutionRecords, error: evolutionError } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("patient_id", patientId)
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (evolutionError) {
    console.error("Error obteniendo historial clínico:", evolutionError);
    throw evolutionError;
  }

  return {
    intakeRecord: intakeRecord as PatientIntakeRecord | null,
    evolutionRecords: (evolutionRecords || []) as ClinicalEvolutionRecord[],
  };
}

export default function ClinicalHistoryView({
  patientId,
  professionalId,
  className = "",
}: ClinicalHistoryViewProps) {
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  useEffect(() => {
    const loadClinicalHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar historial directamente usando el cliente de Supabase
        const history = await loadClinicalHistoryData(patientId, professionalId);
        setClinicalHistory(history);
      } catch (err) {
        console.error("Error cargando historial clínico:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && professionalId) {
      loadClinicalHistory();
    }
  }, [patientId, professionalId]);

  const handleIntakeFormSuccess = async () => {
    setShowIntakeForm(false);
    // Recargar historial directamente usando el cliente de Supabase
    try {
      const history = await loadClinicalHistoryData(patientId, professionalId);
      setClinicalHistory(history);
    } catch (err) {
      console.error("Error recargando historial clínico:", err);
    }
  };

  // Filtrar registros de evolución por término de búsqueda
  const filteredRecords = clinicalHistory?.evolutionRecords.filter((record) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.diagnosis?.toLowerCase().includes(searchLower) ||
      record.observations?.toLowerCase().includes(searchLower) ||
      record.session_development?.toLowerCase().includes(searchLower) ||
      record.treatment_applied?.toLowerCase().includes(searchLower) ||
      record.notes?.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Ficha de Ingreso */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ficha de Ingreso
          </h2>
          {!clinicalHistory?.intakeRecord && (
            <button
              onClick={() => setShowIntakeForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Crear Ficha de Ingreso
            </button>
          )}
        </div>

        {showIntakeForm || !clinicalHistory?.intakeRecord ? (
          <PatientIntakeForm
            patientId={patientId}
            professionalId={professionalId}
            onSuccess={handleIntakeFormSuccess}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Nombre Completo:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.full_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">RUT:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.rut || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Fecha de Nacimiento:</span>
                <p className="text-gray-900">
                  {clinicalHistory.intakeRecord.birth_date
                    ? new Date(clinicalHistory.intakeRecord.birth_date).toLocaleDateString("es-CL")
                    : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Edad:</span>
                <p className="text-gray-900">
                  {clinicalHistory.intakeRecord.age ? `${clinicalHistory.intakeRecord.age} años` : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Sexo/Género:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.gender || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.phone || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Dirección:</span>
                <p className="text-gray-900">{clinicalHistory.intakeRecord.address || "N/A"}</p>
              </div>
            </div>

            {clinicalHistory.intakeRecord.medical_history && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm font-medium text-gray-600">Historia Médica/Psicológica Previa:</span>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                  {clinicalHistory.intakeRecord.medical_history}
                </p>
              </div>
            )}

            {clinicalHistory.intakeRecord.family_history && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm font-medium text-gray-600">Antecedentes Familiares:</span>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                  {clinicalHistory.intakeRecord.family_history}
                </p>
              </div>
            )}

            {clinicalHistory.intakeRecord.consultation_reason && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm font-medium text-gray-600">Motivo de Consulta:</span>
                <p className="text-gray-900 mt-1 whitespace-pre-wrap">
                  {clinicalHistory.intakeRecord.consultation_reason}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowIntakeForm(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Editar Ficha de Ingreso
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Sesiones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Sesiones
            {clinicalHistory?.evolutionRecords && (
              <span className="text-sm font-normal text-gray-500">
                ({clinicalHistory.evolutionRecords.length} sesión{clinicalHistory.evolutionRecords.length !== 1 ? "es" : ""})
              </span>
            )}
          </h2>
        </div>

        {/* Barra de búsqueda */}
        {clinicalHistory && clinicalHistory.evolutionRecords.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Lista de fichas de evolución */}
        {filteredRecords.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchTerm
                ? "No se encontraron sesiones que coincidan con la búsqueda"
                : clinicalHistory?.evolutionRecords.length === 0
                ? "No hay fichas de evolución registradas aún"
                : "No hay registros que mostrar"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              // Necesitamos obtener la fecha de la cita asociada
              // Por ahora usamos created_at como aproximación
              const appointmentDate = record.created_at;
              return (
                <ClinicalRecordCard
                  key={record.id}
                  record={record}
                  appointmentDate={appointmentDate}
                  onClick={() => {
                    // Aquí podrías abrir un modal o navegar a una página de detalle
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

