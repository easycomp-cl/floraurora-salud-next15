"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { appointmentService, type AppointmentWithUsers } from "@/lib/services/appointmentService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarClock, 
  CheckCircle2,
  Clock,
  History,
  Calendar,
  User,
  AlertCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import SatisfactionSurveyReminder from "@/components/satisfaction-survey/SatisfactionSurveyReminder";
import SatisfactionSurveyDialog from "@/components/satisfaction-survey/SatisfactionSurveyDialog";
import { satisfactionSurveyService } from "@/lib/services/satisfactionSurveyService";

interface PatientMetrics {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  nextAppointment: AppointmentWithUsers | null;
}

export function PatientOverview() {
  const { user } = useAuthState();
  const [metrics, setMetrics] = useState<PatientMetrics | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<AppointmentWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithUsers | null>(null);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const profile = await profileService.getUserProfileByUuid(user.id);
        
        if (!profile) {
          setError("No se pudo cargar tu perfil");
          setLoading(false);
          return;
        }

        // Obtener todas las citas del paciente
        const appointments = await appointmentService.getAppointmentsForPatient(profile.id);
        
        // Calcular métricas
        const now = new Date();
        const upcoming = appointments.filter(apt => {
          const scheduledDate = new Date(apt.scheduled_at);
          return scheduledDate > now && apt.status !== "completed" && apt.status !== "cancelled";
        });
        
        const completed = appointments.filter(apt => apt.status === "completed");
        const pending = appointments.filter(apt => {
          const scheduledDate = new Date(apt.scheduled_at);
          return scheduledDate > now && apt.status === "pending" || apt.status === "confirmed";
        });

        // Encontrar la próxima cita
        const nextAppointment = upcoming.length > 0
          ? upcoming.sort((a, b) => 
              new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            )[0]
          : null;

        // Obtener historial reciente (últimas 5 citas completadas o pasadas)
        const pastAppointments = appointments
          .filter(apt => {
            const scheduledDate = new Date(apt.scheduled_at);
            return scheduledDate <= now || apt.status === "completed";
          })
          .sort((a, b) => 
            new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
          )
          .slice(0, 5);

        setMetrics({
          totalAppointments: appointments.length,
          upcomingAppointments: upcoming.length,
          completedAppointments: completed.length,
          pendingAppointments: pending.length,
          nextAppointment,
        });

        setRecentAppointments(pastAppointments);
      } catch (err) {
        console.error("Error cargando datos del paciente:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: { label: "Completada", className: "bg-green-100 text-green-800" },
      confirmed: { label: "Confirmada", className: "bg-blue-100 text-blue-800" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800" },
    };

    const statusInfo = statusMap[status || "pending"] || statusMap.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleOpenSurvey = async (appointment: AppointmentWithUsers) => {
    if (!appointment.patient_id || !appointment.professional_id) {
      return;
    }

    // Verificar si puede calificar
    try {
      const status = await satisfactionSurveyService.getAppointmentSurveyStatus(
        appointment.id,
        appointment.scheduled_at
      );

      if (!status.canRate) {
        if (status.hasRated) {
          alert("Ya has calificado esta cita.");
        } else if (!status.isWithin7Days) {
          alert("El plazo para calificar esta cita ha expirado (máximo 7 días después de la cita).");
        } else {
          alert("Esta cita aún no ha finalizado.");
        }
        return;
      }

      setSelectedAppointment(appointment);
      setSurveyDialogOpen(true);
    } catch (error) {
      console.error("Error verificando estado de encuesta:", error);
      alert("Ocurrió un error al verificar el estado de la encuesta.");
    }
  };

  const handleSurveySuccess = () => {
    setSurveyDialogOpen(false);
    setSelectedAppointment(null);
    // Recargar datos
    if (user) {
      const loadPatientData = async () => {
        try {
          const profile = await profileService.getUserProfileByUuid(user.id);
          if (profile) {
            const appointments = await appointmentService.getAppointmentsForPatient(profile.id);
            const now = new Date();
            const pastAppointments = appointments
              .filter(apt => {
                const scheduledDate = new Date(apt.scheduled_at);
                return scheduledDate <= now || apt.status === "completed";
              })
              .sort((a, b) => 
                new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
              )
              .slice(0, 5);
            setRecentAppointments(pastAppointments);
          }
        } catch (err) {
          console.error("Error recargando datos:", err);
        }
      };
      loadPatientData();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recordatorio de encuesta de satisfacción */}
      <SatisfactionSurveyReminder />

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Citas</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas tus citas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Citas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.upcomingAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Citas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics?.completedAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Citas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metrics?.pendingAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Por confirmar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Próxima cita */}
      {metrics?.nextAppointment ? (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calendar className="h-5 w-5" />
                  Tu Próxima Cita
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Información de tu próxima sesión programada
                </CardDescription>
              </div>
              {getStatusBadge(metrics.nextAppointment.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Fecha y Hora</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDate(metrics.nextAppointment.scheduled_at)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Profesional</p>
                <p className="text-lg font-semibold text-gray-900">
                  {metrics.nextAppointment.professional
                    ? `${metrics.nextAppointment.professional.name || ""} ${metrics.nextAppointment.professional.last_name || ""}`.trim() || "No disponible"
                    : "No asignado"}
                </p>
              </div>
              {metrics.nextAppointment.service && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Servicio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {metrics.nextAppointment.service}
                  </p>
                </div>
              )}
              {metrics.nextAppointment.duration_minutes && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Duración</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {metrics.nextAppointment.duration_minutes} minutos
                  </p>
                </div>
              )}
            </div>
            {metrics.nextAppointment.meeting_url && (
              <div className="pt-4 border-t border-blue-200">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <a 
                    href={metrics.nextAppointment.meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Unirse a la Sesión
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próxima Cita
            </CardTitle>
            <CardDescription>
              No tienes citas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/appointments">
                Agendar una Cita
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Historial reciente */}
      {recentAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial Reciente
                </CardTitle>
                <CardDescription>
                  Tus últimas 5 citas completadas o pasadas
                </CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/sessions">
                  Ver Todo el Historial
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => {
                const appointmentDate = new Date(appointment.scheduled_at);
                const now = new Date();
                const isPast = appointmentDate <= now || appointment.status === "completed";
                
                return (
                  <div
                    key={appointment.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">
                          {formatDate(appointment.scheduled_at)}
                        </p>
                        {getStatusBadge(appointment.status)}
                      </div>
                      {appointment.professional && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {`${appointment.professional.name || ""} ${appointment.professional.last_name || ""}`.trim() || "Profesional no disponible"}
                        </p>
                      )}
                      {appointment.service && (
                        <p className="text-sm text-gray-500">
                          {appointment.service}
                        </p>
                      )}
                      {isPast && appointment.patient_id && appointment.professional_id && (
                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSurvey(appointment)}
                            className="w-full sm:w-auto"
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Calificar experiencia
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Citas</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona todas tus citas, agenda nuevas sesiones y revisa tu historial completo.
            </p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/dashboard/appointments">Ver todas las citas →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Perfil</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Actualiza tu información personal y preferencias de contacto.
            </p>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/dashboard/profile">Actualizar perfil →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de encuesta de satisfacción */}
      {selectedAppointment && selectedAppointment.patient_id && selectedAppointment.professional_id && (
        <SatisfactionSurveyDialog
          appointmentId={selectedAppointment.id}
          patientId={selectedAppointment.patient_id}
          professionalId={selectedAppointment.professional_id}
          scheduledAt={selectedAppointment.scheduled_at}
          open={surveyDialogOpen}
          onOpenChange={setSurveyDialogOpen}
          onSuccess={handleSurveySuccess}
        />
      )}
    </div>
  );
}

