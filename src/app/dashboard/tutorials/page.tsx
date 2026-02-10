"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Loader2, Shield, ExternalLink, PlusCircle } from "lucide-react";
import type { TutorialVideo } from "@/lib/types/adminConfig";
import { getYouTubeVideoId } from "@/lib/utils/url";

function TutorialCard({ video }: { video: TutorialVideo }) {
  const videoId = getYouTubeVideoId(video.youtube_url);
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0`
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          {video.title}
        </CardTitle>
        {video.description && (
          <p className="text-sm text-gray-600">{video.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {embedUrl ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            <iframe
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        ) : (
          <div className="rounded-lg bg-gray-100 p-6 text-center text-gray-500">
            No se pudo cargar el video. Usa el enlace para verlo en YouTube.
          </div>
        )}
        <a
          href={video.youtube_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <ExternalLink className="h-4 w-4" />
          Ver en YouTube
        </a>
      </CardContent>
    </Card>
  );
}

export default function TutorialsPage() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (profile) {
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error("Error obteniendo perfil:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user || (userRole !== 1 && userRole !== 3)) {
      return;
    }

    const loadVideos = async () => {
      try {
        setIsLoadingVideos(true);
        setVideosError(null);
        const response = await fetch("/api/tutorials", {
          cache: "no-store",
          credentials: "include",
          headers: { "X-User-ID": user.id },
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error ?? "No se pudieron cargar los tutoriales");
        }
        const payload = await response.json();
        setVideos(payload.data ?? []);
      } catch (err) {
        setVideosError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setIsLoadingVideos(false);
      }
    };

    loadVideos();
  }, [isAuthenticated, user, userRole]);

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando tutoriales...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-gray-600">
              Debes iniciar sesión para acceder a esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfessional = userRole === 3;
  const isAdmin = userRole === 1;

  if (!isProfessional && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
            <p className="text-gray-600">
              Solo los profesionales y administradores pueden acceder a los tutoriales.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PlayCircle className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Tutoriales</h1>
            </div>
            <p className="text-gray-600">
              Videos de ayuda para el uso de la plataforma. Puedes verlos aquí o abrirlos en YouTube.
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin/tutorials">
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Agregar video
              </Button>
            </Link>
          )}
        </div>

        {videosError && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-700">{videosError}</CardContent>
          </Card>
        )}

        {isLoadingVideos ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No hay tutoriales disponibles en este momento.
              </p>
              {isAdmin && (
                <Link href="/admin/tutorials">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Agregar el primer video
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {videos.map((video) => (
              <TutorialCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
