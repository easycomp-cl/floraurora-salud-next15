"use client";

import { useEffect, useState } from "react";
import { BHEJob } from "@/lib/services/bheService";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  FileText,
  Calendar,
  DollarSign
} from "lucide-react";

interface BHEJobsListProps {
  professionalId: number;
  isAdmin?: boolean;
}

const statusConfig = {
  queued: {
    label: "En cola",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  processing: {
    label: "Procesando",
    icon: RefreshCw,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  done: {
    label: "Completada",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  failed: {
    label: "Fallida",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  retrying: {
    label: "Reintentando",
    icon: RefreshCw,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

export function BHEJobsList({ professionalId }: BHEJobsListProps) {
  const [jobs, setJobs] = useState<BHEJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<BHEJob["status"] | "all">("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = filterStatus === "all" 
        ? "/api/bhe/jobs"
        : `/api/bhe/jobs?status=${filterStatus}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al obtener boletas");
      }
      
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Error al obtener jobs:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId, filterStatus]);

  const handleDownload = async (jobId: string) => {
    try {
      setDownloadingId(jobId);
      
      const response = await fetch(`/api/bhe/jobs/${jobId}/download`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al generar URL de descarga");
      }
      
      // Abrir la URL de descarga en una nueva pestaña
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Error al descargar boleta:", err);
      alert(err instanceof Error ? err.message : "Error al descargar la boleta");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchJobs}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const filteredJobs = filterStatus === "all" 
    ? jobs 
    : jobs.filter(job => job.status === filterStatus);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Todas
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as BHEJob["status"])}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <config.icon className={`h-4 w-4 ${config.color}`} />
            {config.label}
          </button>
        ))}
      </div>

      {/* Lista de boletas */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No hay boletas disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const statusInfo = statusConfig[job.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {job.glosa}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {job.appointment_id || "Sin cita asociada"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(job.issue_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(job.amount)}</span>
                        </div>
                        {job.result_folio && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Folio:</span> {job.result_folio}
                          </div>
                        )}
                        {job.attempts > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Intentos:</span> {job.attempts}
                          </div>
                        )}
                      </div>
                      
                      {job.last_error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                          <strong>Error:</strong> {job.last_error}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex flex-col gap-2">
                      {job.status === "done" && job.result_pdf_path ? (
                        <button
                          onClick={() => handleDownload(job.id)}
                          disabled={downloadingId === job.id}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {downloadingId === job.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Descargando...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Descargar PDF
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                          {statusInfo.label}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

