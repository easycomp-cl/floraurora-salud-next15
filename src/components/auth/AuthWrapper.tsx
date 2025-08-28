"use client";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  // Este hook maneja automáticamente las redirecciones de autenticación
  useAuthRedirect();

  return <>{children}</>;
}
