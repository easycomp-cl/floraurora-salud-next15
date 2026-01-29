"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Loader2, Shield } from "lucide-react";

export default function TutorialsPage() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PlayCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Tutoriales
            </h1>
          </div>
          <p className="text-gray-600">
            Videos de ayuda para el uso de la plataforma
          </p>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Videos de Ayuda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center">
              <PlayCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {/* Aquí irán videos de ayuda para el usuario */}
                Aquí irán videos de ayuda para el usuario
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
