"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { BHEJobsList } from "@/components/bhe/BHEJobsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, AlertCircle } from "lucide-react";

export default function MySIIPage() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
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
          // Si es profesional, obtener su ID
          if (profile.role === 3) {
            const { profileService: ps } = await import("@/lib/services/profileService");
            const professionalProfile = await ps.getProfessionalProfile(profile.id);
            if (professionalProfile) {
              setProfessionalId(professionalProfile.id);
            }
          }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const isProfessional = userRole === 3;
  const isAdmin = userRole === 1;

  if (!isProfessional && !isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                Solo los profesionales pueden acceder a esta sección.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Boletas de Honorarios Electrónicas
          </h1>
        </div>
        <p className="text-gray-600 mt-2">
          Gestiona y descarga tus boletas de honorarios electrónicas emitidas por el SII.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Boletas</CardTitle>
        </CardHeader>
        <CardContent>
          {professionalId ? (
            <BHEJobsList professionalId={professionalId} isAdmin={isAdmin} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
