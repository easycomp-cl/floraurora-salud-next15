"use client";
import { useEffect, useState } from "react";
import { UserService } from "@/lib/services/userService";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";

export default function AuthCallback() {
  const [status, setStatus] = useState<string>("Iniciando autenticación...");
  const [debugInfo, setDebugInfo] = useState<{
    hasSession: boolean;
    userEmail?: string;
    userId?: string;
    timestamp?: string;
    method?: string;
  }>({ hasSession: false });
  const router = useRouter();
  const { user, session, isLoading, isAuthenticated } = useAuthState();

  useEffect(() => {
    let mounted = true;
    let redirectAttempted = false;
    let processingStarted = false;

    const processUserProfile = async (user: {
      id: string;
      email?: string;
      user_metadata?: { full_name?: string };
    }) => {
      // Prevenir múltiples ejecuciones simultáneas
      if (processingStarted) {
        console.log("⚠️ Procesamiento ya en curso, saltando...");
        return;
      }

      processingStarted = true;

      try {
        // Verificar si el usuario existe en la tabla users
        const userExists = await UserService.userExists(user.id);

        if (!userExists) {
          console.log("📋 Creando usuario en tabla users...");
          setStatus("Creando perfil de usuario...");

          const fullName = user.user_metadata?.full_name || "Usuario";
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
            console.log("✅ Usuario creado exitosamente");

            // Si es un nuevo usuario (rol 2 = paciente), crear perfil de paciente básico
            if (userData.role === 2 && !result.isExisting) {
              console.log("📋 Creando perfil de paciente básico...");
              try {
                const { profileService } = await import(
                  "@/lib/services/profileService"
                );
                await profileService.createPatientProfile(user.id, {
                  emergency_contact_name: "",
                  emergency_contact_phone: "",
                  health_insurances_id: 1, // ID por defecto
                });
                console.log("✅ Perfil de paciente creado exitosamente");
              } catch (profileError) {
                console.error(
                  "⚠️ Error al crear perfil de paciente:",
                  profileError
                );
                // No es crítico, el usuario puede completar su perfil después
              }
            }
          } else {
            console.log(
              "⚠️ Usuario ya existía o hubo un error, continuando..."
            );
          }
        } else {
          console.log("📋 Usuario ya existe en tabla users");
        }

        // Redirigir al dashboard
        console.log("🚀 Redirigiendo al dashboard...");
        setStatus("¡Autenticación exitosa! Redirigiendo...");

        if (mounted && !redirectAttempted) {
          redirectAttempted = true;
          // Pequeño delay para mostrar el mensaje de éxito
          setTimeout(() => {
            console.log("⏰ Ejecutando redirección después de delay...");
            router.push("/dashboard");
          }, 1500);
        }
      } catch (verifyError) {
        console.error("⚠️ Error al verificar/crear usuario:", verifyError);
        // Aún así intentar redirigir
        if (mounted && !redirectAttempted) {
          redirectAttempted = true;
          setStatus("Redirigiendo al dashboard...");
          setTimeout(() => {
            console.log("⏰ Ejecutando redirección después de error...");
            router.push("/dashboard");
          }, 1500);
        }
      }
    };

    // Cuando se detecte la autenticación
    if (isAuthenticated && user && !redirectAttempted && !processingStarted) {
      console.log("✅ Usuario autenticado detectado:", user.email);
      setStatus("Usuario autenticado, verificando perfil...");

      // Actualizar info de debug
      setDebugInfo({
        hasSession: true,
        userEmail: user.email,
        userId: user.id,
        timestamp: new Date().toISOString(),
        method: "hook_detection",
      });

      processUserProfile(user);
    }

    // Timeout de seguridad para evitar que se quede colgado
    const timeoutId = setTimeout(() => {
      if (mounted && !redirectAttempted) {
        console.log("⏰ Timeout de seguridad alcanzado, redirigiendo...");
        setStatus("Redirigiendo por timeout de seguridad...");
        redirectAttempted = true;
        router.push("/dashboard");
      }
    }, 10000); // 10 segundos

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, user, router]);

  const handleManualRedirect = () => {
    console.log("🖱️ Redirección manual iniciada");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          🔐 Procesando autenticación...
        </h2>
        <p className="text-gray-600 mb-4">{status}</p>
        <p className="text-sm text-gray-500">
          Por favor espera mientras completamos tu inicio de sesión.
        </p>

        {/* Información de debug */}
        {debugInfo.hasSession && (
          <div className="mt-4 p-3 bg-green-50 rounded-md text-left max-w-md mx-auto">
            <p className="text-sm text-green-700 font-semibold mb-2">
              ✅ Sesión detectada:
            </p>
            <p className="text-xs text-green-600">
              Email: {debugInfo.userEmail}
            </p>
            <p className="text-xs text-green-600">ID: {debugInfo.userId}</p>
            <p className="text-xs text-green-600">
              Tiempo: {debugInfo.timestamp}
            </p>
            <p className="text-xs text-green-600">Método: {debugInfo.method}</p>
          </div>
        )}

        {/* Estado del hook */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-left max-w-md mx-auto">
          <p className="text-sm text-blue-700 font-semibold mb-2">
            Estado del Hook:
          </p>
          <p className="text-xs text-blue-600">
            isLoading: {isLoading.toString()}
          </p>
          <p className="text-xs text-blue-600">
            isAuthenticated: {isAuthenticated.toString()}
          </p>
          <p className="text-xs text-blue-600">hasUser: {!!user}</p>
          <p className="text-xs text-blue-600">hasSession: {!!session}</p>
          {user && (
            <p className="text-xs text-blue-600">User Email: {user.email}</p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleManualRedirect}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            🚀 Ir al Dashboard (Manual)
          </button>

          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="block w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🔄 Recargar y Redirigir
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Si la redirección no funciona automáticamente, usa uno de los
            botones de arriba.
          </p>
        </div>
      </div>
    </div>
  );
}
