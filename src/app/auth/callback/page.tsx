"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { UserService } from "@/lib/services/userService";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Procesando callback de autenticación...");
        console.log("📍 Componente montado, iniciando proceso...");

        // Obtener la sesión actual
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("🔍 Sesión obtenida:", {
          hasSession: !!session,
          hasError: !!sessionError,
        });

        if (sessionError) {
          console.error("❌ Error al obtener sesión:", sessionError);
          setError("Error al obtener sesión de autenticación");
          return;
        }

        if (session) {
          console.log("✅ Usuario autenticado exitosamente:", session.user);
          console.log("👤 ID del usuario:", session.user.id);
          console.log("📧 Email del usuario:", session.user.email);

          // VERIFICAR SI EL USUARIO EXISTE EN LA TABLA USERS
          console.log(
            "🔍 PASO 1: Verificando si usuario existe en tabla users..."
          );

          try {
            const userExists = await UserService.userExists(session.user.id);
            console.log("📊 Resultado de verificación:", userExists);

            if (userExists) {
              console.log(
                "📋 RESULTADO: Usuario YA EXISTE en la tabla users - NO se crea nada"
              );
            } else {
              console.log(
                "📋 RESULTADO: Usuario NO EXISTE en la tabla users - CREANDO automáticamente..."
              );

              // Extraer información del usuario de Google
              const fullName =
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                "Usuario";
              const nameParts = fullName.split(" ");
              const firstName = nameParts[0] || "Usuario";
              const lastName = nameParts.slice(1).join(" ") || "Usuario";

              // Crear usuario en la tabla users
              const userData = {
                user_id: session.user.id,
                email: session.user.email || "",
                name: firstName,
                last_name: lastName,
                role: 2, // Rol por defecto según tu esquema
                is_active: true,
                // Los campos opcionales se dejan undefined para que se completen después
              };

              console.log("📝 Datos del usuario a crear:", userData);

              const createResult = await UserService.createUser(userData);

              if (createResult.success) {
                console.log(
                  "✅ Usuario creado exitosamente en la tabla users:",
                  createResult.data
                );
              } else {
                console.error("❌ Error al crear usuario:", createResult.error);
              }
            }
          } catch (verifyError) {
            console.error("💥 Error al verificar/crear usuario:", verifyError);
          }

          // Redirigir al dashboard o página principal
          console.log("⏳ Esperando 3 segundos antes de redirigir...");
          setTimeout(() => {
            console.log("🚀 Redirigiendo al dashboard...");
            router.push("/dashboard");
          }, 3000);
        } else {
          console.log("⚠️ No hay sesión activa");
          setError("No se pudo establecer la sesión");
        }
      } catch (err) {
        console.error("💥 Error inesperado:", err);
        setError("Error inesperado durante la autenticación");
      } finally {
        console.log("🏁 Proceso de callback finalizado");
        setIsLoading(false);
      }
    };

    console.log("🚀 useEffect ejecutado, llamando a handleAuthCallback...");
    handleAuthCallback();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            🔐 Procesando autenticación...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras completamos tu inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Error de Autenticación
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/main/test")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver a Intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          ¡Autenticación Exitosa!
        </h2>
        <p className="text-gray-600 mb-4">
          Serás redirigido al dashboard en unos segundos...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
