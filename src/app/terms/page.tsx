"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import TermsPatient from "@/components/terms/TermsPatient";
import TermsProfessional from "@/components/terms/TermsProfessional";

function TermsContent() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthState();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const typeParam = searchParams.get("type");

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (profile) {
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error("Error obteniendo el rol del usuario:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated, user]);

  // Determinar qué versión mostrar:
  // 1. Si hay parámetro ?type=professional o ?type=patient, usar ese
  // 2. Si no hay parámetro pero el usuario está autenticado, usar su rol
  // 3. Por defecto, mostrar versión de paciente
  const showProfessional = typeParam === "professional" || (!typeParam && userRole === 3);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            TÉRMINOS Y CONDICIONES
          </h1>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando...</p>
            </div>
          ) : showProfessional ? (
            <TermsProfessional />
          ) : (
            <TermsPatient />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              TÉRMINOS Y CONDICIONES
            </h1>
            <div className="text-center py-8">
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
