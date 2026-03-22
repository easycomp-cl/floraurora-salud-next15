"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { appointmentService, type AppointmentWithUsers } from "@/lib/services/appointmentService";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, Loader2, Calendar, User, DollarSign } from "lucide-react";

interface AppointmentsWithBoletasListProps {
  professionalId: number;
}

export function AppointmentsWithBoletasList({ professionalId }: AppointmentsWithBoletasListProps) {
  const { session } = useAuthState();
  const [appointments, setAppointments] = useState<AppointmentWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const all = await appointmentService.getAppointmentsForProfessional(professionalId);
        if (!mounted) return;
        const withBoleta = all.filter(
          (apt) => apt.status === "completed" && apt.bhe_job_id
        );
        setAppointments(withBoleta);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error al cargar citas");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [professionalId]);

  const handleDownload = async (bheJobId: string) => {
    try {
      setDownloadingId(bheJobId);
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`/api/bhe/jobs/${bheJobId}/download`, {
        credentials: "include",
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Error al descargar");
      if (data.download_url) window.open(data.download_url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar la boleta");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);

  const patientName = (apt: AppointmentWithUsers) =>
    apt.patient
      ? `${apt.patient.name ?? ""} ${apt.patient.last_name ?? ""}`.trim() || "Paciente"
      : "Paciente";

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No hay boletas disponibles</p>
        <p className="text-sm mt-2">
          Las boletas aparecerán aquí cuando se completen citas con pagos procesados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => (
        <Card key={apt.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDate(apt.scheduled_at)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  {patientName(apt)}
                </div>
                {apt.service && (
                  <p className="text-sm text-gray-600">{apt.service}</p>
                )}
                {apt.amount != null && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(apt.amount)}
                  </div>
                )}
              </div>
              {apt.bhe_job_id && (
                <button
                  onClick={() => handleDownload(apt.bhe_job_id!)}
                  disabled={downloadingId === apt.bhe_job_id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
                >
                  {downloadingId === apt.bhe_job_id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Descargar boleta PDF
                    </>
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
