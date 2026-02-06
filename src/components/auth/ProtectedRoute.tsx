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
    // console.log("🛡️ ProtectedRoute: Estado de autenticación:", {
    //   isLoading,
    //   isAuthenticated,
    //   hasUser: !!user,
    //   hasSession: !!session,
    //   userEmail: user?.email,
    //   sessionAccessToken: !!session?.access_token,
    //   sessionExpiresAt: session?.expires_at,
    // });

    // Si hay un usuario pero no hay sesión todavía, esperar un poco más
    // Esto puede ocurrir durante el refresh del token
    // (variable comentada para evitar warning de no uso)
    // const hasUserButNoSession = user && !session;
    
    // Solo redirigir cuando no esté cargando y no esté autenticado
    // Y no hay usuario (si hay usuario, puede estar refrescando la sesión)
    if (!isLoading && !isAuthenticated && !user) {
      console.log(
        "🚫 ProtectedRoute: Usuario no autenticado, preparando redirección a:",
        redirectTo
      );
      setShouldRedirect(true);
    } else if (!isLoading && isAuthenticated) {
      // Si está autenticado, cancelar cualquier redirección pendiente
      setShouldRedirect(false);
      setRedirectAttempted(false);
    }
  }, [isAuthenticated, isLoading, redirectTo, user, session]);

  // Efecto separado para la redirección
  useEffect(() => {
    if (shouldRedirect && !redirectAttempted) {
      // console.log("🔄 ProtectedRoute: Ejecutando redirección a:", redirectTo);
      setRedirectAttempted(true);

      // Usar setTimeout para evitar problemas de navegación durante el render
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    }
  }, [shouldRedirect, redirectTo, router, redirectAttempted]);

  // Efecto adicional para forzar redirección si el usuario no está autenticado
  // Pero solo si realmente no hay usuario (no solo falta la sesión)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !user && !redirectAttempted) {
      // console.log("🔄 ProtectedRoute: Forzando redirección inmediata...");
      setRedirectAttempted(true);

      setTimeout(() => {
        router.push(redirectTo);
      }, 50);
    }
  }, [isLoading, isAuthenticated, redirectAttempted, router, redirectTo, user]);

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

  // Si no está autenticado pero hay un usuario, esperar un poco más
  // (puede estar refrescando la sesión)
  if (!isAuthenticated && user) {
    // Esperar un poco más antes de redirigir, en caso de que la sesión se esté refrescando
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado y no hay usuario, mostrar mensaje de redirección
  if (!isAuthenticated && !user) {
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
  // console.log("✅ ProtectedRoute: Acceso permitido para:", user?.email);
  return <>{children}</>;
}
