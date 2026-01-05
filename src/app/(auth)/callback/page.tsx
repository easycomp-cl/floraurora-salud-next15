"use client";
import { useEffect } from "react";
import { UserService } from "@/lib/services/userService";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import type { User } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthState();

  useEffect(() => {
    let mounted = true;
    let redirectAttempted = false;
    let processingStarted = false;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Leer el redirect inmediatamente al montar el componente para evitar que se pierda
    let savedRedirectOnMount: string | null = null;
    if (typeof window !== "undefined") {
      savedRedirectOnMount = localStorage.getItem("auth_redirect");
      console.log("🔍 Callback montado: Redirect guardado al inicio:", savedRedirectOnMount);
    }

    // Verificar si hay errores en la URL (usuario canceló el login)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      if (error) {
        // Redirigir inmediatamente al login si hay un error
        router.push("/login?error=access_denied");
        return () => {
          mounted = false;
          if (timeoutId) clearTimeout(timeoutId);
        };
      }
    }

    const processUserProfile = async (user: User) => {
      // Prevenir múltiples ejecuciones simultáneas
      if (processingStarted) {
        return;
      }

      processingStarted = true;

      // Verificar si el usuario está bloqueado
      const isBlocked = (user.app_metadata as { blocked?: boolean } | null)?.blocked === true;
      if (isBlocked) {
        console.warn("🚫 AuthCallback: Usuario bloqueado detectado, cerrando sesión...");
        
        // Cerrar sesión inmediatamente
        const { clientSignout } = await import("@/lib/client-auth");
        await clientSignout();
        
        // Redirigir a login con mensaje de error
        setTimeout(() => {
          router.push("/login?error=account_blocked");
        }, 2000);
        return;
      }

      try {
        // Verificar si el usuario existe en la tabla users
        const userExists = await UserService.userExists(user.id);

        if (!userExists) {
          const fullName = (user.user_metadata as { full_name?: string } | null)?.full_name || "Usuario";
          const nameParts = fullName.split(" ");
          const firstName = nameParts[0] || "Usuario";
          const lastName = nameParts.slice(1).join(" ") || "";

          const userData = {
            user_id: user.id,
            email: user.email || "",
            name: firstName,
            last_name: lastName,
            role: 2,
            is_active: true,
          };

          const result = await UserService.createUser(userData);

          // Verificar si la creación fue exitosa
          if (result && result.success) {
            // Si es un nuevo usuario (rol 2 = paciente), crear perfil de paciente básico
            if (userData.role === 2 && !result.isExisting) {
              try {
                const { profileService } = await import(
                  "@/lib/services/profileService"
                );
                await profileService.createPatientProfile(user.id, {
                  emergency_contact_name: "",
                  emergency_contact_phone: "",
                  health_insurances_id: 1, // ID por defecto
                });
              } catch (profileError) {
                console.error(
                  "⚠️ Error al crear perfil de paciente:",
                  profileError
                );
                // No es crítico, el usuario puede completar su perfil después
              }
            }
          }
        }

        // Usar el redirect que se leyó al montar el componente, o leerlo nuevamente si no se había leído
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        console.log("🔍 Callback: Redirect guardado en localStorage:", savedRedirect);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        try {
          const profile = await profileService.getUserProfileByUuid(user.id);
          userRole = profile?.role ?? null;
        } catch (roleError) {
          console.error("⚠️ Error obteniendo rol del usuario:", roleError);
        }

        // Determinar el destino según el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect) {
          // Solo usar el redirect guardado si el usuario es paciente (role === 2)
          if (userRole === 2) {
            console.log("✅ Usuario es paciente, usando redirect guardado:", savedRedirect);
            redirectTo = savedRedirect;
          } else {
            // Si no es paciente, ignorar el redirect guardado y redirigir al dashboard
            console.log("⚠️ Usuario NO es paciente (rol:", userRole, "), ignorando redirect guardado y yendo al dashboard");
            redirectTo = "/dashboard";
          }
        } else {
          // Si no hay redirect guardado, determinar el destino según el rol
          console.log("⚠️ No hay redirect guardado, determinando destino por rol");
          if (userRole === 2) {
            // Si es paciente, redirigir a appointments
            redirectTo = "/dashboard/appointments";
          } else {
            // Para profesionales y admins, ir al dashboard normal
            redirectTo = "/dashboard";
          }
        }
        
        if (mounted && !redirectAttempted) {
          redirectAttempted = true;
          setTimeout(() => {
            router.push(redirectTo);
          }, 1000);
        }
      } catch (verifyError) {
        console.error("⚠️ Error al verificar/crear usuario:", verifyError);
        
        // Usar el redirect que se leyó al montar el componente, o leerlo nuevamente si no se había leído
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        console.log("🔍 Callback (error): Redirect guardado en localStorage:", savedRedirect);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        try {
          const profile = await profileService.getUserProfileByUuid(user.id);
          userRole = profile?.role ?? null;
        } catch (roleError) {
          console.error("⚠️ Error obteniendo rol del usuario:", roleError);
        }

        // Determinar el destino según el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect) {
          // Solo usar el redirect guardado si el usuario es paciente (role === 2)
          if (userRole === 2) {
            console.log("✅ Usuario es paciente (error), usando redirect guardado:", savedRedirect);
            redirectTo = savedRedirect;
          } else {
            // Si no es paciente, ignorar el redirect guardado y redirigir al dashboard
            console.log("⚠️ Usuario NO es paciente (rol:", userRole, "), ignorando redirect guardado y yendo al dashboard");
            redirectTo = "/dashboard";
          }
        } else {
          // Si no hay redirect guardado, determinar el destino según el rol
          console.log("⚠️ No hay redirect guardado (error), determinando destino por rol");
          if (userRole === 2) {
            redirectTo = "/dashboard/appointments";
          } else {
            redirectTo = "/dashboard";
          }
        }
        
        // Aún así intentar redirigir
        if (mounted && !redirectAttempted) {
          redirectAttempted = true;
          setTimeout(() => {
            router.push(redirectTo);
          }, 1000);
        }
      }
    };

    // Cuando se detecte la autenticación
    if (isAuthenticated && user && !redirectAttempted && !processingStarted) {
      processUserProfile(user);
    }

    // Timeout de seguridad para evitar que se quede colgado
    timeoutId = setTimeout(async () => {
      if (mounted && !redirectAttempted) {
        redirectAttempted = true;
        // Usar el redirect que se leyó al montar el componente, o leerlo nuevamente si no se había leído
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        console.log("🔍 Callback (timeout): Redirect guardado en localStorage:", savedRedirect);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        if (user) {
          try {
            const profile = await profileService.getUserProfileByUuid(user.id);
            userRole = profile?.role ?? null;
          } catch (roleError) {
            console.error("⚠️ Error obteniendo rol del usuario:", roleError);
          }
        }

        // Determinar el destino según el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect && user) {
          // Solo usar el redirect guardado si el usuario es paciente (role === 2)
          if (userRole === 2) {
            console.log("✅ Usuario es paciente (timeout), usando redirect guardado:", savedRedirect);
            redirectTo = savedRedirect;
          } else {
            // Si no es paciente, ignorar el redirect guardado y redirigir al dashboard
            console.log("⚠️ Usuario NO es paciente (rol:", userRole, "), ignorando redirect guardado y yendo al dashboard");
            redirectTo = "/dashboard";
          }
        } else if (user) {
          // Si no hay redirect guardado, determinar el destino según el rol
          console.log("⚠️ No hay redirect guardado (timeout), determinando destino por rol");
          if (userRole === 2) {
            redirectTo = "/dashboard/appointments";
          } else {
            redirectTo = "/dashboard";
          }
        } else {
          redirectTo = "/dashboard";
        }
        
        router.push(redirectTo);
      }
    }, 10000); // 10 segundos

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
