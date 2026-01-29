"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  satisfactionSurveyService,
  type SatisfactionSurvey,
  type CreateSatisfactionSurveyData,
} from "@/lib/services/satisfactionSurveyService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SatisfactionSurveyFormProps {
  appointmentId: string;
  patientId: number;
  professionalId: number;
  existingSurvey?: SatisfactionSurvey | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}

function StarRating({ value, onChange, label, required = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const displayValue = hoverValue ?? value;
          const isFilled = star <= displayValue;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label={`Calificar ${star} de 5 estrellas`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-300"
                } hover:fill-yellow-300 hover:text-yellow-300`}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="text-sm text-gray-600 ml-2">
            {value} de 5
          </span>
        )}
      </div>
    </div>
  );
}

export default function SatisfactionSurveyForm({
  appointmentId,
  patientId,
  professionalId,
  existingSurvey,
  onSuccess,
  onCancel,
}: SatisfactionSurveyFormProps) {
  const [formData, setFormData] = useState<CreateSatisfactionSurveyData>({
    appointment_id: appointmentId,
    patient_id: patientId,
    professional_id: professionalId,
    professional_empathy_rating: existingSurvey?.professional_empathy_rating || 0,
    professional_punctuality_rating: existingSurvey?.professional_punctuality_rating || 0,
    professional_satisfaction_rating: existingSurvey?.professional_satisfaction_rating || 0,
    platform_booking_rating: existingSurvey?.platform_booking_rating || 0,
    platform_payment_rating: existingSurvey?.platform_payment_rating || 0,
    platform_experience_rating: existingSurvey?.platform_experience_rating || 0,
    what_you_valued: existingSurvey?.what_you_valued || "",
    what_to_improve: existingSurvey?.what_to_improve || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Validar que todos los campos de estrellas estén completos
  useEffect(() => {
    const allRatingsComplete =
      formData.professional_empathy_rating > 0 &&
      formData.professional_punctuality_rating > 0 &&
      formData.professional_satisfaction_rating > 0 &&
      formData.platform_booking_rating > 0 &&
      formData.platform_payment_rating > 0 &&
      formData.platform_experience_rating > 0;

    setIsValid(allRatingsComplete);
  }, [
    formData.professional_empathy_rating,
    formData.professional_punctuality_rating,
    formData.professional_satisfaction_rating,
    formData.platform_booking_rating,
    formData.platform_payment_rating,
    formData.platform_experience_rating,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError("Por favor, completa todas las calificaciones con estrellas.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (existingSurvey) {
        await satisfactionSurveyService.updateSurvey(appointmentId, {
          professional_empathy_rating: formData.professional_empathy_rating,
          professional_punctuality_rating: formData.professional_punctuality_rating,
          professional_satisfaction_rating: formData.professional_satisfaction_rating,
          platform_booking_rating: formData.platform_booking_rating,
          platform_payment_rating: formData.platform_payment_rating,
          platform_experience_rating: formData.platform_experience_rating,
          what_you_valued: formData.what_you_valued,
          what_to_improve: formData.what_to_improve,
        });
      } else {
        await satisfactionSurveyService.createSurvey(formData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error guardando encuesta:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar la encuesta. Por favor, intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">
          🌿 Encuesta de Satisfacción – FlorAurora Salud
        </h3>
        <p className="text-sm text-gray-600">
          Gracias por tu atención. Tu opinión es muy importante para mejorar nuestro servicio.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Califica cada aspecto usando una escala de 1 a 5 estrellas, donde:
          <br />
          ⭐ = Muy insatisfecho / ⭐⭐⭐⭐⭐ = Muy satisfecho
        </p>
      </div>

      {/* Evaluación del profesional */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
          👤 1. Evaluación del profesional
        </h4>

        <StarRating
          value={formData.professional_empathy_rating}
          onChange={(value) =>
            setFormData({ ...formData, professional_empathy_rating: value })
          }
          label="Trato y empatía del profesional"
          required
        />

        <StarRating
          value={formData.professional_punctuality_rating}
          onChange={(value) =>
            setFormData({ ...formData, professional_punctuality_rating: value })
          }
          label="Puntualidad de la atención"
          required
        />

        <StarRating
          value={formData.professional_satisfaction_rating}
          onChange={(value) =>
            setFormData({ ...formData, professional_satisfaction_rating: value })
          }
          label="Satisfacción general con el profesional"
          required
        />
      </div>

      {/* Evaluación de la plataforma */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
          💻 2. Evaluación de la plataforma FlorAurora Salud
        </h4>

        <StarRating
          value={formData.platform_booking_rating}
          onChange={(value) =>
            setFormData({ ...formData, platform_booking_rating: value })
          }
          label="Facilidad para agendar la cita"
          required
        />

        <StarRating
          value={formData.platform_payment_rating}
          onChange={(value) =>
            setFormData({ ...formData, platform_payment_rating: value })
          }
          label="Facilidad del proceso de pago"
          required
        />

        <StarRating
          value={formData.platform_experience_rating}
          onChange={(value) =>
            setFormData({ ...formData, platform_experience_rating: value })
          }
          label="Experiencia general con FlorAurora Salud"
          required
        />
      </div>

      {/* Comentarios */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-md font-semibold text-gray-800 flex items-center gap-2">
          ✍️ 3. Comentarios
        </h4>

        <div className="space-y-2">
          <Label htmlFor="what_you_valued" className="text-sm font-medium text-gray-700">
            ¿Qué fue lo que más valoras de tu experiencia?
          </Label>
          <Textarea
            id="what_you_valued"
            value={formData.what_you_valued}
            onChange={(e) =>
              setFormData({ ...formData, what_you_valued: e.target.value })
            }
            placeholder="Escribe tus comentarios aquí..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what_to_improve" className="text-sm font-medium text-gray-700">
            ¿Hay algo que podamos mejorar?
          </Label>
          <Textarea
            id="what_to_improve"
            value={formData.what_to_improve}
            onChange={(e) =>
              setFormData({ ...formData, what_to_improve: e.target.value })
            }
            placeholder="Escribe tus sugerencias aquí..."
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Guardando..." : existingSurvey ? "Actualizar" : "Enviar Encuesta"}
        </Button>
      </div>
    </form>
  );
}
