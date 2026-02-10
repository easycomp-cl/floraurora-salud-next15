"use client";
import { useEffect } from "react";
import { UserService } from "@/lib/services/userService";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import type { User } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();
  const { user, isAuthenticated, supabase } = useAuthState();

  useEffect(() => {
    let mounted = true;
    let redirectAttempted = false;
    let processingStarted = false;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Leer el redirect inmediatamente al montar el componente para evitar que se pierda
    let savedRedirectOnMount: string | null = null;
    if (typeof window !== "undefined") {
      savedRedirectOnMount = localStorage.getItem("auth_redirect");
    }

    // Verificar si hay errores en la URL (usuario cancelÃ³ el login)
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
      // Prevenir mÃºltiples ejecuciones simultÃ¡neas
      if (processingStarted) {
        return;
      }

      processingStarted = true;

      // Verificar si el usuario estÃ¡ bloqueado
      const isBlocked = (user.app_metadata as { blocked?: boolean } | null)?.blocked === true;
      if (isBlocked) {
        console.warn("ðŸš« AuthCallback: Usuario bloqueado detectado, cerrando sesiÃ³n...");
        
        // Cerrar sesiÃ³n inmediatamente
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
          // Validar: si el email tiene una solicitud de profesional en proceso, no permitir registro como paciente
          // El cliente usa localStorage para la sesiÃ³n, no cookies - enviamos el token en el body
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          const checkRes = await fetch("/api/auth/check-email-professional-pending", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
            credentials: "include",
          });
          const checkData = await checkRes.json().catch(() => ({}));
          if (checkData.hasPendingRequest) {
            await fetch("/api/auth/cleanup-orphan-patient", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: accessToken }),
              credentials: "include",
            });
            const { clientSignout } = await import("@/lib/client-auth");
            await clientSignout();
            redirectAttempted = true;
            // Usar location.href para forzar recarga completa y limpiar cualquier estado
            // residual (evita que el navbar muestre datos de usuario fantasma)
            window.location.href = "/login?error=professional-request-pending";
            return;
          }

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

          // Verificar si la creaciÃ³n fue exitosa
          if (result && result.success) {
            // Si es un nuevo usuario (rol 2 = paciente), crear perfil de paciente bÃ¡sico
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
                  "âš ï¸ Error al crear perfil de paciente:",
                  profileError
                );
                // No es crÃ­tico, el usuario puede completar su perfil despuÃ©s
              }
            }
          }
        }

        // Usar el redirect que se leyÃ³ al montar el componente, o leerlo nuevamente si no se habÃ­a leÃ­do
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        try {
          const profile = await profileService.getUserProfileByUuid(user.id);
          if (profile) {
            userRole = profile.role ?? null;
          } else {
            userRole = 2;
          }
        } catch (roleError) {
          console.error("âš ï¸ Error obteniendo rol del usuario:", roleError);
          // En caso de error, usar rol por defecto (paciente = 2)
          userRole = 2;
        }

        // Determinar el destino segÃºn el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect) {
          if (userRole === 2) {
            redirectTo = savedRedirect;
          } else {
            redirectTo = "/dashboard";
          }
        } else {
          if (userRole === 2) {
            redirectTo = "/dashboard/appointments";
          } else {
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
        console.error("âš ï¸ Error al verificar/crear usuario:", verifyError);
        
        // Usar el redirect que se leyÃ³ al montar el componente, o leerlo nuevamente si no se habÃ­a leÃ­do
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        try {
          const profile = await profileService.getUserProfileByUuid(user.id);
          if (profile) {
            userRole = profile.role ?? null;
          } else {
            userRole = 2;
          }
        } catch (roleError) {
          console.error("âš ï¸ Error obteniendo rol del usuario:", roleError);
          // En caso de error, usar rol por defecto (paciente = 2)
          userRole = 2;
        }

        // Determinar el destino segÃºn el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect) {
          // Solo usar el redirect guardado si el usuario es paciente (role === 2)
          if (userRole === 2) {
            redirectTo = savedRedirect;
          } else {
            redirectTo = "/dashboard";
          }
        } else {
          if (userRole === 2) {
            redirectTo = "/dashboard/appointments";
          } else {
            redirectTo = "/dashboard";
          }
        }
        
        // AÃºn asÃ­ intentar redirigir
        if (mounted && !redirectAttempted) {
          redirectAttempted = true;
          setTimeout(() => {
            router.push(redirectTo);
          }, 1000);
        }
      }
    };

    // Cuando se detecte la autenticaciÃ³n
    if (isAuthenticated && user && !redirectAttempted && !processingStarted) {
      processUserProfile(user);
    }

    // Timeout de seguridad para evitar que se quede colgado
    timeoutId = setTimeout(async () => {
      if (mounted && !redirectAttempted) {
        redirectAttempted = true;
        // Usar el redirect que se leyÃ³ al montar el componente, o leerlo nuevamente si no se habÃ­a leÃ­do
        const savedRedirect = savedRedirectOnMount || (typeof window !== "undefined" 
          ? localStorage.getItem("auth_redirect") 
          : null);
        
        // Limpiar el redirect guardado
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_redirect");
        }

        // Obtener el perfil del usuario para determinar su rol
        let userRole: number | null = null;
        if (user) {
          try {
            const profile = await profileService.getUserProfileByUuid(user.id);
            if (profile) {
              userRole = profile.role ?? null;
            } else {
              userRole = 2;
            }
          } catch (roleError) {
            console.error("âš ï¸ Error obteniendo rol del usuario:", roleError);
            // En caso de error, usar rol por defecto (paciente = 2)
            userRole = 2;
          }
        }

        // Determinar el destino segÃºn el rol del usuario
        let redirectTo: string;
        
        // Si hay redirect guardado, verificar si el usuario es paciente antes de usarlo
        if (savedRedirect && user) {
          // Solo usar el redirect guardado si el usuario es paciente (role === 2)
          if (userRole === 2) {
            redirectTo = savedRedirect;
          } else {
            redirectTo = "/dashboard";
          }
        } else if (user) {
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
  }, [isAuthenticated, user, router, supabase.auth]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}
