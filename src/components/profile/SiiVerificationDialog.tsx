"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const SII_TUTORIAL_URL = "https://www.youtube.com/watch?v=vYqcXQeTDS4";

export function SiiVerificationDialog() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  useEffect(() => {
    const checkSiiVerification = async () => {
      if (pathname === "/dashboard/my-sii") {
        setIsLoadingCheck(false);
        return;
      }
      if (!isLoading && isAuthenticated && user) {
        try {
          const userProfile = await profileService.getUserProfileByUuid(user.id);
          if (userProfile && userProfile.role === 3) {
            const professionalProfile = await profileService.getProfessionalProfile(
              userProfile.id
            );
            if (
              professionalProfile &&
              !professionalProfile.sii_bhe_verified
            ) {
              setIsOpen(true);
            }
          }
        } catch (error) {
          console.error("Error verificando SII:", error);
        } finally {
          setIsLoadingCheck(false);
        }
      } else if (!isLoading) {
        setIsLoadingCheck(false);
      }
    };

    checkSiiVerification();
  }, [user, isLoading, isAuthenticated, pathname]);

  // No mostrar el diálogo si ya está en la página my-sii
  if (pathname === "/dashboard/my-sii") {
    return null;
  }

  if (isLoading || isLoadingCheck || !isAuthenticated || !user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Verificación SII pendiente
          </DialogTitle>
          <DialogDescription>
            Aún no estás verificado en el SII para la emisión de Boletas de
            Honorarios Electrónicas. Sin esta verificación, no podrás emitir BHE
            automáticamente cuando tus pacientes realicen pagos. Mira el tutorial
            y sigue los pasos indicados para completar tu verificación.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Si ya completaste los pasos en el SII, puedes ir a verificar tu RUT.
        </p>
        <DialogFooter>
          <Button variant="outline" asChild>
            <a
              href={SII_TUTORIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              Ver tutorial
            </a>
          </Button>
          <Button
            className="cursor-pointer"
            onClick={() => {
              setIsOpen(false);
              router.push("/dashboard/my-sii");
            }}
          >
            Verificar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
