"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import type {
  ClinicalHistory,
  PatientIntakeRecord,
  ClinicalEvolutionRecord,
} from "@/lib/services/clinicalRecordService";
import PatientIntakeForm from "./PatientIntakeForm";
import AppointmentClinicalForm from "./AppointmentClinicalForm";
import PatientDataDisplay from "./PatientDataDisplay";
import {
  appointmentService,
  type AppointmentWithUsers,
} from "@/lib/services/appointmentService";
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
  professionalId: number,
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
  const [clinicalHistory, setClinicalHistory] =
    useState<ClinicalHistory | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    const loadClinicalHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar historial directamente usando el cliente de Supabase
        const history = await loadClinicalHistoryData(
          patientId,
          professionalId,
        );
        setClinicalHistory(history);

        // Cargar citas del paciente con este profesional
        const patientAppointments =
          await appointmentService.getAppointmentsForPatient(patientId);
        // Filtrar solo las citas con este profesional
        const filteredAppointments = patientAppointments.filter(
          (apt) => apt.professional_id === professionalId,
        );
        // Ordenar por fecha (más recientes primero)
        filteredAppointments.sort((a, b) => {
          const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
          const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
          return dateB - dateA;
        });
        setAppointments(filteredAppointments);
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

  const toggleAppointmentExpanded = (appointmentId: string) => {
    setExpandedAppointments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status?: string | null) => {
    const statusMap: Record<
      string,
      {
        label: string;
        className: string;
        icon: React.ComponentType<{ className?: string }>;
      }
    > = {
      confirmed: {
        label: "Confirmada",
        className: "bg-green-100 text-green-700",
        icon: CheckCircle2,
      },
      pending: {
        label: "Pendiente",
        className: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      },
      pending_confirmation: {
        label: "Pendiente Confirmación",
        className: "bg-amber-100 text-amber-700",
        icon: AlertCircle,
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-red-100 text-red-700",
        icon: XCircle,
      },
      completed: {
        label: "Completada",
        className: "bg-blue-100 text-blue-700",
        icon: CheckCircle2,
      },
    };

    const statusInfo = statusMap[status || "pending"] || statusMap.pending;
    const Icon = statusInfo.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </span>
    );
  };

  // Calcular paginación para las citas
  const totalAppointments = appointments.length;
  const totalPages = Math.ceil(totalAppointments / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = appointments.slice(startIndex, endIndex);

  // Resetear a la primera página cuando cambia itemsPerPage
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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
        </div>

        {showIntakeForm || !clinicalHistory?.intakeRecord ? (
          <PatientIntakeForm
            patientId={patientId}
            professionalId={professionalId}
            onSuccess={handleIntakeFormSuccess}
          />
        ) : (
          <PatientDataDisplay
            patientId={patientId}
            professionalId={professionalId}
          />
        )}
      </div>

      {/* Línea separatoria */}
      <div className="border-t border-gray-200 my-10"></div>

      {/* Historial de Sesiones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Sesiones
            {appointments && (
              <span className="text-sm font-normal text-gray-500">
                ({appointments.length} cita
                {appointments.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {/* Selector de items por página */}
          {appointments.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                Mostrar:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          )}
        </div>

        {/* Lista de citas */}
        {appointments.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              No hay citas registradas para este paciente
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedAppointments.map((appointment) => {
                const appointmentId = String(appointment.id);
                const appointmentDate = appointment.scheduled_at
                  ? new Date(appointment.scheduled_at)
                  : null;
                const isExpanded = expandedAppointments.has(appointmentId);

                // Buscar el registro clínico correspondiente a esta cita
                const clinicalRecord = clinicalHistory?.evolutionRecords?.find(
                  (record) => record.appointment_id === appointmentId,
                );

                // Verificar si hay datos llenados
                const hasData =
                  clinicalRecord &&
                  !!(
                    (clinicalRecord.medical_history &&
                      clinicalRecord.medical_history.trim()) ||
                    (clinicalRecord.family_history &&
                      clinicalRecord.family_history.trim()) ||
                    (clinicalRecord.consultation_reason &&
                      clinicalRecord.consultation_reason.trim()) ||
                    (clinicalRecord.session_development &&
                      clinicalRecord.session_development.trim()) ||
                    (clinicalRecord.treatment_applied &&
                      clinicalRecord.treatment_applied.trim()) ||
                    (clinicalRecord.notes && clinicalRecord.notes.trim()) ||
                    (clinicalRecord.evolution &&
                      clinicalRecord.evolution.trim()) ||
                    (clinicalRecord.observations &&
                      clinicalRecord.observations.trim()) ||
                    (clinicalRecord.diagnosis &&
                      clinicalRecord.diagnosis.trim())
                  );

                const hasRecord = !!clinicalRecord;

                return (
                  <div
                    key={appointmentId}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Encabezado de la cita */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Cita{" "}
                              {appointmentId.startsWith("APT-")
                                ? appointmentId
                                : `APT-${appointmentId.padStart(8, "0")}`}
                            </h3>
                            {getStatusBadge(appointment.status)}
                            {/* Mostrar ícono si hay datos llenados */}
                            {hasData && (
                              <FileText
                                className="h-5 w-5 text-gray-600"
                                title="Ficha clínica con datos"
                              />
                            )}
                          </div>
                          {appointmentDate && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {appointmentDate.toLocaleDateString("es-CL", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                  {", "}
                                  {appointmentDate.toLocaleTimeString("es-CL", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              {appointment.duration_minutes && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {appointment.duration_minutes} minutos
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            toggleAppointmentExpanded(appointmentId)
                          }
                          className={`inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                            hasData
                              ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              : "text-green-600 hover:text-green-800 hover:bg-green-50"
                          }`}
                        >
                          {hasData ? (
                            <FileText className="h-4 w-4" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                          {isExpanded
                            ? "Ocultar"
                            : hasData
                              ? "Ver/Editar"
                              : "Editar"}
                        </button>
                      </div>
                    </div>

                    {/* Formulario clínico desplegable */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50">
                        <AppointmentClinicalForm
                          appointmentId={appointmentId}
                          patientId={patientId}
                          professionalId={professionalId}
                          onSuccess={() => {
                            // Recargar datos si es necesario
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>
                    Mostrando {startIndex + 1} -{" "}
                    {Math.min(endIndex, totalAppointments)} de{" "}
                    {totalAppointments} citas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`
                      inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md
                      ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>

                  {/* Números de página */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Mostrar primera página, última página, página actual y páginas adyacentes
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`
                              px-3 py-2 text-sm font-medium rounded-md
                              ${
                                page === currentPage
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }
                            `}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>

                  {/* Botón Siguiente */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`
                      inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md
                      ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                      }
                    `}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
