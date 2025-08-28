import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthState } from "./useAuthState";
import { config } from "../config";

export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Solo ejecutar cuando no esté cargando
    if (isLoading) return;

    // Verificar si la ruta actual requiere autenticación
    const isCurrentRouteProtected = config.auth.protectedRoutes.some(route => 
      pathname.startsWith(route)
    );

    // CASO 1: Usuario no autenticado intentando acceder a ruta protegida
    if (isCurrentRouteProtected && !isAuthenticated) {
      console.log("🔄 useAuthRedirect: Usuario no autenticado en ruta protegida, redirigiendo al login...");
      router.push(config.auth.redirects.unauthorized);
      return;
    }

    // CASO 2: Usuario autenticado en página de login/signup, redirigir al dashboard
    if (isAuthenticated && (
      pathname === "/auth/login" || 
      pathname === "/auth/signup" || 
      pathname === "/auth/signup-pro"
    )) {
      console.log("🔄 useAuthRedirect: Usuario autenticado en página de auth, redirigiendo al dashboard...");
      router.push(config.auth.redirects.afterLogin);
      return;
    }

    // No hacer nada en otros casos - permitir acceso normal
  }, [isAuthenticated, isLoading, pathname, router]);

  return {
    isAuthenticated,
    isLoading,
    pathname,
  };
}
