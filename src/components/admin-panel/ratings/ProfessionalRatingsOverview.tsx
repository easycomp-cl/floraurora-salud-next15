"use client";

import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SatisfactionSurvey } from "@/lib/services/satisfactionSurveyService";
import supabase from "@/utils/supabase/client";

interface ProfessionalRating {
  professionalId: number;
  professionalName: string;
  totalSurveys: number;
  averageRating: number;
  empathyAvg: number;
  punctualityAvg: number;
  satisfactionAvg: number;
}

export default function ProfessionalRatingsOverview() {
  const [professionalRatings, setProfessionalRatings] = useState<
    ProfessionalRating[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfessionalRatings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener todas las encuestas usando la API del admin
        const response = await fetch("/api/admin/ratings", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error obteniendo encuestas:", errorData);
          throw new Error(
            errorData.error ||
              `Error al obtener las encuestas (${response.status})`,
          );
        }

        const payload = await response.json();
        const surveys = payload.data || [];

        console.log(`✅ Encuestas obtenidas: ${surveys.length} encuestas`);

        if (!surveys || surveys.length === 0) {
          setProfessionalRatings([]);
          setLoading(false);
          return;
        }

        const surveysData = surveys as SatisfactionSurvey[];

        // Agrupar por profesional
        const professionalMap = new Map<
          number,
          {
            surveys: SatisfactionSurvey[];
            professionalName: string;
          }
        >();

        // Obtener todos los profesionales únicos
        const uniqueProfessionalIds = Array.from(
          new Set(surveysData.map((s) => s.professional_id)),
        );

        // Obtener información de usuarios para todos los profesionales de una vez
        const { data: users } = await supabase
          .from("users")
          .select("id, name, last_name")
          .in("id", uniqueProfessionalIds);

        // Crear un mapa de ID a nombre
        const userMap = new Map<number, string>();
        if (users) {
          users.forEach((user) => {
            const nameParts = [user.name, user.last_name].filter(Boolean);
            const fullName =
              nameParts.length > 0
                ? nameParts.join(" ")
                : `Profesional ${user.id}`;
            userMap.set(user.id, fullName);
          });
        }

        // Agrupar encuestas por profesional
        for (const survey of surveysData) {
          if (!professionalMap.has(survey.professional_id)) {
            const professionalName =
              userMap.get(survey.professional_id) ||
              `Profesional ${survey.professional_id}`;

            professionalMap.set(survey.professional_id, {
              surveys: [],
              professionalName,
            });
          }

          professionalMap.get(survey.professional_id)!.surveys.push(survey);
        }

        // Calcular estadísticas por profesional
        const ratings: ProfessionalRating[] = [];
        for (const [professionalId, data] of professionalMap.entries()) {
          const surveys = data.surveys;

          const empathyAvg =
            surveys.reduce((sum, s) => sum + s.professional_empathy_rating, 0) /
            surveys.length;
          const punctualityAvg =
            surveys.reduce(
              (sum, s) => sum + s.professional_punctuality_rating,
              0,
            ) / surveys.length;
          const satisfactionAvg =
            surveys.reduce(
              (sum, s) => sum + s.professional_satisfaction_rating,
              0,
            ) / surveys.length;
          const averageRating =
            (empathyAvg + punctualityAvg + satisfactionAvg) / 3;

          ratings.push({
            professionalId,
            professionalName: data.professionalName,
            totalSurveys: surveys.length,
            averageRating,
            empathyAvg,
            punctualityAvg,
            satisfactionAvg,
          });
        }

        // Ordenar por calificación promedio (mayor a menor)
        ratings.sort((a, b) => b.averageRating - a.averageRating);

        setProfessionalRatings(ratings);
      } catch (err) {
        console.error("Error cargando calificaciones por profesional:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    loadProfessionalRatings();
  }, []);

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rounded
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(2)}
        </span>
      </div>
    );
  };

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

  if (professionalRatings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Aún no hay calificaciones por profesional
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {professionalRatings.map((rating) => (
        <Card key={rating.professionalId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {rating.professionalName}
                  </CardTitle>
                  <CardDescription>
                    {rating.totalSurveys} encuesta
                    {rating.totalSurveys !== 1 ? "s" : ""} recibida
                    {rating.totalSurveys !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">
                  Calificación promedio
                </div>
                {renderStars(rating.averageRating)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  Trato y empatía
                </div>
                {renderStars(rating.empathyAvg)}
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Puntualidad</div>
                {renderStars(rating.punctualityAvg)}
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  Satisfacción general
                </div>
                {renderStars(rating.satisfactionAvg)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
