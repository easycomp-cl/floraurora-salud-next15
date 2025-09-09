"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button"; // Asumiendo que tienes un componente Button

export function ProfileCompletionDialog() {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isLoading && isAuthenticated && user) {
        try {
          // Obtener el perfil completo del usuario
          //console.log("ProfileCompletionDialog-user.id", user.id);
          const userProfile = await profileService.getUserProfileByUuid(
            user.id
          );
          if (userProfile) {
            const isComplete = await profileService.isProfileComplete(
              userProfile
            );
            if (!isComplete) {
              setIsOpen(true);
            }
          }
        } catch (error) {
          console.error("Error checking profile completion:", error);
        } finally {
          setIsLoadingCheck(false);
        }
      } else if (!isLoading) {
        setIsLoadingCheck(false);
      }
    };

    checkProfile();
  }, [user, isLoading, isAuthenticated]);

  const handleCompleteProfile = () => {
    setIsOpen(false);
    router.push("/dashboard/profile");
  };

  if (isLoading || isLoadingCheck || !isAuthenticated || !user) {
    return null; // No renderizar nada mientras carga o si no está autenticado
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>¡Tu perfil está incompleto!</DialogTitle>
          <DialogDescription>
            Parece que te faltan algunos datos importantes en tu perfil. Por
            favor, complétalos para acceder a todas las funcionalidades.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleCompleteProfile}>Completar Perfil</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
