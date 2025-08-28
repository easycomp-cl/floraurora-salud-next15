"use client";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { config } from "@/lib/config";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = config.auth.redirects.unauthorized,
}: ProtectedRouteProps) {
  const { user, session, isAuthenticated, isLoading } = useAuthState();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    console.log("🛡️ ProtectedRoute: Estado de autenticación:", {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      hasSession: !!session,
      userEmail: user?.email,
      sessionAccessToken: !!session?.access_token,
      sessionExpiresAt: session?.expires_at,
    });

    // Solo redirigir cuando no esté cargando y no esté autenticado
    if (!isLoading && !isAuthenticated) {
      console.log(
        "🚫 ProtectedRoute: Usuario no autenticado, preparando redirección a:",
        redirectTo
      );
      setShouldRedirect(true);
    } else if (!isLoading && isAuthenticated) {
      console.log("✅ ProtectedRoute: Usuario autenticado correctamente");
      setShouldRedirect(false);
      setRedirectAttempted(false);
    }
  }, [isAuthenticated, isLoading, redirectTo, user, session]);

  // Efecto separado para la redirección
  useEffect(() => {
    if (shouldRedirect && !redirectAttempted) {
      console.log("🔄 ProtectedRoute: Ejecutando redirección a:", redirectTo);
      setRedirectAttempted(true);

      // Usar setTimeout para evitar problemas de navegación durante el render
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
  }, [shouldRedirect, redirectTo, router, redirectAttempted]);

  // Efecto adicional para forzar redirección si el usuario no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirectAttempted) {
      console.log("🔄 ProtectedRoute: Forzando redirección inmediata...");
      setRedirectAttempted(true);

      setTimeout(() => {
        router.push(redirectTo);
      }, 50);
    }
  }, [isLoading, isAuthenticated, redirectAttempted, router, redirectTo]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje de redirección
  if (!isAuthenticated) {
    console.log(
      "🚫 ProtectedRoute: Acceso denegado, mostrando mensaje de redirección..."
    );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al login...</p>
          <p className="text-sm text-gray-500 mt-2">
            Si no eres redirigido automáticamente,
            <button
              onClick={() => router.push(redirectTo)}
              className="ml-1 text-blue-600 underline hover:text-blue-800"
            >
              haz clic aquí
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido
  console.log("✅ ProtectedRoute: Acceso permitido para:", user?.email);
  return <>{children}</>;
}
