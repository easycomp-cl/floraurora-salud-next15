"use client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, session, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // console.log("🛡️ ProtectedRoute: Estado de autenticación:", {
    //   loading,
    //   isAuthenticated,
    //   hasUser: !!user,
    //   hasSession: !!session,
    //   userEmail: user?.email,
    //   sessionAccessToken: !!session?.access_token,
    //   sessionExpiresAt: session?.expires_at,
    // });

    // Solo redirigir cuando no esté cargando y no esté autenticado
    if (!loading && !isAuthenticated) {
      // console.log(
      //   "🚫 ProtectedRoute: Usuario no autenticado, preparando redirección a:",
      //   redirectTo
      // );
      setShouldRedirect(true);
    } else if (!loading && isAuthenticated) {
      // console.log("✅ ProtectedRoute: Usuario autenticado correctamente");
      setShouldRedirect(false);
    }
  }, [isAuthenticated, loading, redirectTo, user, session]);

  // Efecto separado para la redirección
  useEffect(() => {
    if (shouldRedirect) {
      // console.log("🔄 ProtectedRoute: Ejecutando redirección a:", redirectTo);
      router.push(redirectTo);
    }
  }, [shouldRedirect, redirectTo, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
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
    // console.log(
    //   "🚫 ProtectedRoute: Acceso denegado, mostrando mensaje de redirección..."
    // );
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido
  // console.log("✅ ProtectedRoute: Acceso permitido para:", user?.email);
  return <>{children}</>;
}
