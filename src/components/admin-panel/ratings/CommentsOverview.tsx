"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type SatisfactionSurvey } from "@/lib/services/satisfactionSurveyService";

export default function CommentsOverview() {
  const [surveysWithComments, setSurveysWithComments] = useState<SatisfactionSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todas las encuestas usando la API del admin
        const response = await fetch("/api/admin/ratings", { cache: "no-store" });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error obteniendo encuestas:", errorData);
          throw new Error(errorData.error || `Error al obtener las encuestas (${response.status})`);
        }

        const payload = await response.json();
        const surveys = payload.data || [];
        
        console.log(`✅ Encuestas obtenidas: ${surveys.length} encuestas`);

        // Filtrar solo las encuestas con comentarios
        const withComments = surveys.filter((s: SatisfactionSurvey) => 
          (s.what_you_valued && s.what_you_valued.trim()) || 
          (s.what_to_improve && s.what_to_improve.trim())
        );

        setSurveysWithComments(withComments);
      } catch (err) {
        console.error("Error cargando comentarios:", err);
        const errorMessage = err instanceof Error ? err.message : "Error desconocido";
        console.error("Detalles del error:", {
          message: errorMessage,
          error: err,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (surveysWithComments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay comentarios disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios de los Pacientes
          </CardTitle>
          <CardDescription>
            {surveysWithComments.length} encuesta{surveysWithComments.length !== 1 ? "s" : ""} con comentarios
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {surveysWithComments.map((survey) => {
          const avgRating = Math.round(
            (survey.professional_empathy_rating +
              survey.professional_punctuality_rating +
              survey.professional_satisfaction_rating +
              survey.platform_booking_rating +
              survey.platform_payment_rating +
              survey.platform_experience_rating) /
              6
          );
          
          return (
            <Card key={survey.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ID: {survey.id}
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= avgRating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        ({avgRating}/5)
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(survey.created_at).toLocaleDateString("es-CL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                
                {survey.what_you_valued && survey.what_you_valued.trim() && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-green-600">✨</span>
                      ¿Qué fue lo que más valoras de tu experiencia?
                    </div>
                    <p className="text-sm text-gray-700 bg-green-50 border border-green-200 p-4 rounded-md whitespace-pre-wrap">
                      {survey.what_you_valued}
                    </p>
                  </div>
                )}
                
                {survey.what_to_improve && survey.what_to_improve.trim() && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-amber-600">💡</span>
                      ¿Hay algo que podamos mejorar?
                    </div>
                    <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 p-4 rounded-md whitespace-pre-wrap">
                      {survey.what_to_improve}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
