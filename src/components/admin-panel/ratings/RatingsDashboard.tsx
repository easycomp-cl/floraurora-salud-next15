"use client";

import { useState } from "react";
import { Star, TrendingUp, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlatformRatingsOverview from "./PlatformRatingsOverview";
import ProfessionalRatingsOverview from "./ProfessionalRatingsOverview";
import CommentsOverview from "./CommentsOverview";

type ViewMode = "platform" | "professionals" | "comments";

export default function RatingsDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("platform");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500" />
            Valoraciones
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Visualiza las calificaciones y encuestas de satisfacción de los
            pacientes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <Button
          variant={viewMode === "platform" ? "default" : "ghost"}
          onClick={() => setViewMode("platform")}
          className="rounded-b-none"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Vista General de la Plataforma
        </Button>
        <Button
          variant={viewMode === "professionals" ? "default" : "ghost"}
          onClick={() => setViewMode("professionals")}
          className="rounded-b-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Calificaciones por Profesional
        </Button>
        <Button
          variant={viewMode === "comments" ? "default" : "ghost"}
          onClick={() => setViewMode("comments")}
          className="rounded-b-none"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Comentarios
        </Button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {viewMode === "platform" ? (
          <PlatformRatingsOverview />
        ) : viewMode === "professionals" ? (
          <ProfessionalRatingsOverview />
        ) : (
          <CommentsOverview />
        )}
      </div>
    </div>
  );
}
