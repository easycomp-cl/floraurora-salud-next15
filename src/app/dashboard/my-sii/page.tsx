"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { AppointmentsWithBoletasList } from "@/components/bhe/AppointmentsWithBoletasList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Loader2, AlertCircle, BadgeCheck, BadgeX } from "lucide-react";

export default function MySIIPage() {
  const { user, session, isLoading, isAuthenticated } = useAuthState();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
  const [siiVerified, setSiiVerified] = useState<boolean | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showRutNotRegisteredDialog, setShowRutNotRegisteredDialog] = useState(false);

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
          // Si es profesional, obtener su ID y estado SII
          if (profile.role === 3) {
            const professionalProfile = await profileService.getProfessionalProfile(
              profile.id
            );
            if (professionalProfile) {
              setProfessionalId(professionalProfile.id);
              setSiiVerified(professionalProfile.sii_bhe_verified ?? false);
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

  const handleVerifySii = async () => {
    if (!professionalId || isVerifying || siiVerified) return;
    setIsVerifying(true);
    setVerifyError(null);
    setVerifyMessage(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/professional/rut-checker", {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error ?? "Error al verificar RUT en SII");
      }

      if (data?.ok && data?.registered) {
        setSiiVerified(true);
        setVerifyMessage(data?.message ?? "RUT verificado. Las boletas se emitirán automáticamente tras cada pago.");
      } else if (data?.registered === false) {
        setShowRutNotRegisteredDialog(true);
      } else {
        setVerifyMessage(data?.message ?? "Verificación completada.");
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Error al verificar RUT");
    } finally {
      setIsVerifying(false);
    }
  };

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
        {isProfessional && siiVerified !== null && (
          <div className="mt-3 space-y-2">
            <div
              className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-2 w-fit ${
                siiVerified
                  ? "border-green-200 bg-green-50 text-green-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {siiVerified ? (
                <>
                  <BadgeCheck className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">
                    Verificado en SII: las boletas se emitirán automáticamente tras cada pago.
                  </span>
                </>
              ) : (
                <>
                  <BadgeX className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">
                    No verificado en SII. Activa la emisión automática de BHE verificando tu RUT.
                  </span>
                  <Button
                    size="sm"
                    onClick={handleVerifySii}
                    disabled={isVerifying}
                    className="ml-2"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Verificando...
                      </>
                    ) : (
                      "Verificar"
                    )}
                  </Button>
                </>
              )}
            </div>
            {verifyMessage && (
              <p className="text-sm text-green-700">{verifyMessage}</p>
            )}
            {verifyError && (
              <p className="text-sm text-red-600">{verifyError}</p>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Boletas</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Citas completadas con boletas de honorarios electrónicas disponibles para descargar
          </p>
        </CardHeader>
        <CardContent>
          {professionalId ? (
            <AppointmentsWithBoletasList professionalId={professionalId} />
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRutNotRegisteredDialog} onOpenChange={setShowRutNotRegisteredDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              RUT no registrado en SII
            </DialogTitle>
            <DialogDescription className="pt-2 text-left">
              Tu RUT no está registrado en el SII para emisión de BHE. Debes registrarte primero en el portal del SII para poder emitir boletas de honorarios electrónicas automáticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowRutNotRegisteredDialog(false)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
