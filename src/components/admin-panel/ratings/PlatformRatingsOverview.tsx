"use client";

import { useEffect, useState } from "react";
import { Star, TrendingUp, Users, Award, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type SatisfactionSurvey } from "@/lib/services/satisfactionSurveyService";
import { clientGetUser } from "@/lib/client-auth";

interface PlatformStats {
  totalSurveys: number;
  averageRating: number;
  professionalAvgRating: number;
  platformAvgRating: number;
  empathyAvgRating: number;
  punctualityAvgRating: number;
  satisfactionAvgRating: number;
  bookingAvgRating: number;
  paymentAvgRating: number;
  experienceAvgRating: number;
  ratingDistribution: { [key: number]: number };
  totalComments: number;
  surveysWithComments: SatisfactionSurvey[];
}

export default function PlatformRatingsOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener el usuario actual para incluir el header X-User-ID
        const { user } = await clientGetUser();
        if (!user) {
          throw new Error("No autenticado");
        }

        // Obtener todas las encuestas usando la API del admin
        const response = await fetch("/api/admin/ratings", {
          cache: "no-store",
          credentials: "include", // Incluir cookies para autenticación
          headers: {
            "X-User-ID": user.id, // Enviar user_id en header como respaldo
          },
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
          setStats({
            totalSurveys: 0,
            averageRating: 0,
            professionalAvgRating: 0,
            platformAvgRating: 0,
            empathyAvgRating: 0,
            punctualityAvgRating: 0,
            satisfactionAvgRating: 0,
            bookingAvgRating: 0,
            paymentAvgRating: 0,
            experienceAvgRating: 0,
            ratingDistribution: {},
            totalComments: 0,
            surveysWithComments: [],
          });
          setLoading(false);
          return;
        }

        const surveysData = surveys as SatisfactionSurvey[];

        // Calcular promedios
        const professionalRatings = surveysData.map(
          (s) =>
            (s.professional_empathy_rating +
              s.professional_punctuality_rating +
              s.professional_satisfaction_rating) /
            3,
        );
        const platformRatings = surveysData.map(
          (s) =>
            (s.platform_booking_rating +
              s.platform_payment_rating +
              s.platform_experience_rating) /
            3,
        );
        const allRatings = [...professionalRatings, ...platformRatings];

        const professionalAvg =
          professionalRatings.reduce((a, b) => a + b, 0) /
          professionalRatings.length;
        const platformAvg =
          platformRatings.reduce((a, b) => a + b, 0) / platformRatings.length;
        const overallAvg =
          allRatings.reduce((a, b) => a + b, 0) / allRatings.length;

        // Calcular promedios por categoría
        const empathyAvg =
          surveysData.reduce(
            (sum, s) => sum + s.professional_empathy_rating,
            0,
          ) / surveysData.length;
        const punctualityAvg =
          surveysData.reduce(
            (sum, s) => sum + s.professional_punctuality_rating,
            0,
          ) / surveysData.length;
        const satisfactionAvg =
          surveysData.reduce(
            (sum, s) => sum + s.professional_satisfaction_rating,
            0,
          ) / surveysData.length;
        const bookingAvg =
          surveysData.reduce((sum, s) => sum + s.platform_booking_rating, 0) /
          surveysData.length;
        const paymentAvg =
          surveysData.reduce((sum, s) => sum + s.platform_payment_rating, 0) /
          surveysData.length;
        const experienceAvg =
          surveysData.reduce(
            (sum, s) => sum + s.platform_experience_rating,
            0,
          ) / surveysData.length;

        // Distribución de calificaciones
        const distribution: { [key: number]: number } = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        };
        allRatings.forEach((rating) => {
          const rounded = Math.round(rating);
          if (rounded >= 1 && rounded <= 5) {
            distribution[rounded] = (distribution[rounded] || 0) + 1;
          }
        });

        // Obtener encuestas con comentarios
        const surveysWithComments = surveysData.filter(
          (s) =>
            (s.what_you_valued && s.what_you_valued.trim()) ||
            (s.what_to_improve && s.what_to_improve.trim()),
        );

        setStats({
          totalSurveys: surveysData.length,
          averageRating: overallAvg,
          professionalAvgRating: professionalAvg,
          platformAvgRating: platformAvg,
          empathyAvgRating: empathyAvg,
          punctualityAvgRating: punctualityAvg,
          satisfactionAvgRating: satisfactionAvg,
          bookingAvgRating: bookingAvg,
          paymentAvgRating: paymentAvg,
          experienceAvgRating: experienceAvg,
          ratingDistribution: distribution,
          totalComments: surveysWithComments.length,
          surveysWithComments,
        });
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        console.error("Detalles del error:", {
          message: errorMessage,
          error: err,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
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

  if (!stats || stats.totalSurveys === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aún no hay valoraciones registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Encuestas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSurveys}</div>
            <p className="text-xs text-muted-foreground">
              Encuestas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calificación Promedio
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderStars(stats.averageRating)}
            <p className="text-xs text-muted-foreground mt-1">
              Promedio general
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesionales</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderStars(stats.professionalAvgRating)}
            <p className="text-xs text-muted-foreground mt-1">
              Promedio profesionales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plataforma</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {renderStars(stats.platformAvgRating)}
            <p className="text-xs text-muted-foreground mt-1">
              Promedio plataforma
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calificaciones detalladas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evaluación del Profesional</CardTitle>
            <CardDescription>
              Calificaciones promedio por aspecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Trato y empatía</span>
              </div>
              {renderStars(stats.empathyAvgRating)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Puntualidad</span>
              </div>
              {renderStars(stats.punctualityAvgRating)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Satisfacción general
                </span>
              </div>
              {renderStars(stats.satisfactionAvgRating)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluación de la Plataforma</CardTitle>
            <CardDescription>
              Calificaciones promedio por aspecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Facilidad para agendar
                </span>
              </div>
              {renderStars(stats.bookingAvgRating)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Proceso de pago</span>
              </div>
              {renderStars(stats.paymentAvgRating)}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Experiencia general</span>
              </div>
              {renderStars(stats.experienceAvgRating)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Calificaciones</CardTitle>
          <CardDescription>
            Número de encuestas por calificación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating] || 0;
              const percentage =
                stats.totalSurveys > 0 ? (count / stats.totalSurveys) * 100 : 0;

              return (
                <div key={rating} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {rating} estrella{rating !== 1 ? "s" : ""}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-gray-600">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resumen de comentarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Resumen de Comentarios
          </CardTitle>
          <CardDescription>
            {stats.totalComments} de {stats.totalSurveys} encuestas incluyen
            comentarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Ve a la pestaña &quot;Comentarios&quot; para ver los detalles
            completos de todas las respuestas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
