"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import {
  appointmentService,
  type AppointmentWithUsers,
} from "@/lib/services/appointmentService";
import { satisfactionSurveyService } from "@/lib/services/satisfactionSurveyService";
import SatisfactionSurveyDialog from "./SatisfactionSurveyDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const LAST_REMINDER_KEY_PREFIX = "satisfaction_survey_reminder_";
const REMINDER_COOLDOWN_HOURS = 24; // Una vez al día

export default function SatisfactionSurveyReminder() {
  const { user, isAuthenticated } = useAuthState();
  const [eligibleAppointment, setEligibleAppointment] = useState<{
    appointment: AppointmentWithUsers;
    hoursSince: number;
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEligibleAppointments = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Obtener perfil del usuario
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!profile || profile.role !== 2) {
          // Solo pacientes pueden ver recordatorios
          setIsLoading(false);
          return;
        }

        // Obtener citas elegibles para encuesta
        const eligible =
          await satisfactionSurveyService.getAppointmentsEligibleForSurvey(
            profile.id,
          );

        if (eligible.length === 0) {
          setIsLoading(false);
          return;
        }

        // Obtener la cita más reciente
        const mostRecent = eligible[0];

        // Verificar si ya se mostró el recordatorio hoy
        const reminderKey = `${LAST_REMINDER_KEY_PREFIX}${mostRecent.appointment_id}`;
        const lastReminderTime = localStorage.getItem(reminderKey);

        if (lastReminderTime) {
          const lastReminder = new Date(lastReminderTime);
          const now = new Date();
          const hoursSinceLastReminder =
            (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60);

          if (hoursSinceLastReminder < REMINDER_COOLDOWN_HOURS) {
            // Ya se mostró el recordatorio hoy
            setIsLoading(false);
            return;
          }
        }

        // Obtener los datos completos de la cita
        const appointments = await appointmentService.getAppointmentsForPatient(
          profile.id,
        );
        const appointment = appointments.find(
          (apt) => apt.id === mostRecent.appointment_id,
        );

        if (appointment) {
          const appointmentDate = new Date(mostRecent.scheduled_at);
          const now = new Date();
          const hoursSince =
            (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60);

          // Solo mostrar si está dentro de las 72 horas
          if (hoursSince >= 0 && hoursSince <= 72) {
            setEligibleAppointment({
              appointment,
              hoursSince: Math.floor(hoursSince),
            });
            setShowReminder(true);

            // Guardar el momento en que se mostró el recordatorio
            localStorage.setItem(reminderKey, new Date().toISOString());
          }
        }
      } catch (error) {
        console.error(
          "Error verificando citas elegibles para encuesta:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibleAppointments();
  }, [isAuthenticated, user]);

  const handleOpenSurvey = () => {
    setShowDialog(true);
    setShowReminder(false);
  };

  const handleDismiss = () => {
    setShowReminder(false);
    if (eligibleAppointment) {
      const reminderKey = `${LAST_REMINDER_KEY_PREFIX}${eligibleAppointment.appointment.id}`;
      // Guardar el momento del descarte para no mostrar hasta mañana
      localStorage.setItem(reminderKey, new Date().toISOString());
    }
  };

  const handleSuccess = () => {
    setShowReminder(false);
    setEligibleAppointment(null);
  };

  if (isLoading || !showReminder || !eligibleAppointment) {
    return null;
  }

  const { appointment, hoursSince } = eligibleAppointment;

  return (
    <>
      <Alert className="mb-4">
        <Star className="h-5 w-5" />
        <AlertTitle className="font-semibold">¡Ayúdanos a mejorar!</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">
            Tu última cita fue hace {hoursSince} hora
            {hoursSince !== 1 ? "s" : ""}. ¿Podrías tomar un momento para
            calificar tu experiencia?
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleOpenSurvey}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Calificar ahora
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Recordarme más tarde
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {eligibleAppointment && (
        <SatisfactionSurveyDialog
          appointmentId={appointment.id}
          patientId={appointment.patient_id!}
          professionalId={appointment.professional_id!}
          scheduledAt={appointment.scheduled_at}
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
