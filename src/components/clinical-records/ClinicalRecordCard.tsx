"use client";

import { Calendar, FileText, ArrowRight } from "lucide-react";
import type { ClinicalEvolutionRecord } from "@/lib/services/clinicalRecordService";

interface ClinicalRecordCardProps {
  record: ClinicalEvolutionRecord;
  appointmentDate: string;
  onClick?: () => void;
}

export default function ClinicalRecordCard({
  record,
  appointmentDate,
  onClick,
}: ClinicalRecordCardProps) {
  const date = new Date(appointmentDate);
  const formattedDate = date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Obtener resumen del diagnóstico o observaciones principales
  const getSummary = () => {
    if (record.diagnosis) {
      return record.diagnosis.length > 100
        ? `${record.diagnosis.substring(0, 100)}...`
        : record.diagnosis;
    }
    if (record.observations) {
      return record.observations.length > 100
        ? `${record.observations.substring(0, 100)}...`
        : record.observations;
    }
    if (record.session_development) {
      return record.session_development.length > 100
        ? `${record.session_development.substring(0, 100)}...`
        : record.session_development;
    }
    return "Sin resumen disponible";
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {formattedDate}
            </span>
          </div>

          {record.diagnosis && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">
                Diagnóstico:
              </span>
              <p className="text-sm text-gray-800 mt-1">{record.diagnosis}</p>
            </div>
          )}

          <div className="mt-2">
            <p className="text-sm text-gray-600 line-clamp-2">{getSummary()}</p>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {record.treatment_applied && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Tratamiento registrado
              </span>
            )}
            {record.next_session_indications && (
              <span className="flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                Indicaciones registradas
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
      </div>
    </div>
  );
}

