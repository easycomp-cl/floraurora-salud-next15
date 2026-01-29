"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SatisfactionSurveyForm from "./SatisfactionSurveyForm";
import {
  satisfactionSurveyService,
  type SatisfactionSurvey,
} from "@/lib/services/satisfactionSurveyService";
import { AlertCircle } from "lucide-react";

interface SatisfactionSurveyDialogProps {
  appointmentId: string;
  patientId: number;
  professionalId: number;
  scheduledAt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function SatisfactionSurveyDialog({
  appointmentId,
  patientId,
  professionalId,
  scheduledAt,
  open,
  onOpenChange,
  onSuccess,
}: SatisfactionSurveyDialogProps) {
  const [existingSurvey, setExistingSurvey] =
    useState<SatisfactionSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canRate, setCanRate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSurveyData = async () => {
      if (!open) return;

      setIsLoading(true);
      setError(null);

      try {
        // Verificar si puede calificar
        const status =
          await satisfactionSurveyService.getAppointmentSurveyStatus(
            appointmentId,
            scheduledAt,
          );

        setCanRate(status.canRate);

        if (!status.canRate) {
          if (status.hasRated) {
            setError("Ya has calificado esta cita.");
          } else if (!status.isWithin7Days) {
            setError(
              "El plazo para calificar esta cita ha expirado (máximo 7 días después de la cita).",
            );
          } else {
            setError("Esta cita aún no ha finalizado.");
          }
        }

        // Cargar encuesta existente si existe
        const survey =
          await satisfactionSurveyService.getSurveyByAppointmentId(
            appointmentId,
          );
        setExistingSurvey(survey || null);
      } catch (err) {
        console.error("Error cargando datos de encuesta:", err);
        setError("Ocurrió un error al cargar la encuesta.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveyData();
  }, [open, appointmentId, scheduledAt]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Encuesta de Satisfacción</DialogTitle>
            <DialogDescription>Cargando...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (error && !canRate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encuesta de Satisfacción</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 text-amber-600 mt-4">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Encuesta de Satisfacción</DialogTitle>
          <DialogDescription>
            Tu opinión es muy importante para mejorar nuestro servicio.
          </DialogDescription>
        </DialogHeader>
        <SatisfactionSurveyForm
          appointmentId={appointmentId}
          patientId={patientId}
          professionalId={professionalId}
          existingSurvey={existingSurvey}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
