"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { EmailDebugPanel } from "@/components/debug/EmailDebugPanel";

export default function ConfirmationPage() {
  const router = useRouter();
  const [message, setMessage] = useState(
    "Confirmando su correo electrónico..."
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      const url = new URL(window.location.href);
      const searchParams = url.searchParams;
      const hashParams = new URLSearchParams(url.hash.substring(1));
      
      // Buscar access_token en el hash (formato estándar de Supabase)
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type") || searchParams.get("type");
      
      // También buscar token_hash (formato alternativo)
      let token_hash = searchParams.get("token_hash") || hashParams.get("token_hash");
      if (!token_hash) {
        token_hash = searchParams.get("token") || hashParams.get("token");
      }
      
      console.log("🔍 Parámetros de confirmación detectados:", {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        token_hash: token_hash ? token_hash.substring(0, 20) + "..." : null,
        type,
        hasHash: url.hash.length > 0,
        allSearchParams: Object.fromEntries(searchParams),
        allHashParams: Object.fromEntries(hashParams),
      });

      // Caso 1: Formato con access_token en el hash (formato estándar de Supabase)
      if (accessToken && refreshToken && type) {
        console.log("🔍 Confirmando con access_token del hash...");
        
        try {
          // Establecer la sesión con los tokens del hash
          const { error: sessionError, data: sessionData } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error("❌ Error al establecer sesión:", sessionError);
            setMessage("Error al confirmar su correo electrónico. El enlace puede haber expirado.");
            setIsError(true);
            setTimeout(() => {
              router.push("/login?error=confirmation-failed");
            }, 3000);
            return;
          }

          // Obtener el usuario después de establecer la sesión
          const { data: { user }, error: userError } = await supabase.auth.getUser();

          if (userError || !user) {
            console.error("❌ Error al obtener usuario:", userError);
            setMessage("Error al verificar su cuenta. Por favor, intenta iniciar sesión.");
            setIsError(true);
            setTimeout(() => {
              router.push("/login?error=confirmation-failed");
            }, 3000);
            return;
          }

          console.log("✅ Sesión establecida y usuario obtenido:", {
            userId: user.id,
            email: user.email,
            emailConfirmed: !!user.email_confirmed_at,
          });

          // Obtener datos adicionales del usuario desde los metadatos
          const userMetadata = user.user_metadata || {};
          const fullName = (typeof userMetadata.full_name === 'string' ? userMetadata.full_name : "") || "";
          const [firstName = "", lastName = ""] = fullName.split(" ");

          console.log("🔍 Datos del usuario para inserción:", {
            user_id: user.id,
            email: user.email,
            full_name: fullName,
            firstName,
            lastName,
          });

          // Crear/verificar usuario y perfil usando API route (evita problemas de RLS)
          try {
            const response = await fetch("/api/auth/confirm-user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.id,
                email: user.email || "",
                firstName: firstName,
                lastName: lastName,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error("❌ Error al crear/verificar usuario:", errorData);
              // Continuar de todas formas - el usuario puede existir ya
            } else {
              const result = await response.json();
              console.log("✅ Usuario y perfil creados/verificados:", result);
            }
          } catch (apiError) {
            console.error("⚠️ Error al llamar API de confirmación:", apiError);
            // Continuar de todas formas - el usuario puede existir ya
          }

          setMessage("¡Correo confirmado exitosamente! Tu cuenta ha sido activada. Ahora puedes iniciar sesión.");
          setIsSuccess(true);
          
          // Limpiar el hash de la URL para evitar problemas
          window.history.replaceState(null, "", window.location.pathname);
          
          // Pequeño delay para mostrar el mensaje de éxito antes de redirigir
          setTimeout(() => {
            router.push("/login?confirmed=true");
          }, 3000);
        } catch (error) {
          console.error("❌ Error inesperado al confirmar:", error);
          setMessage("Error inesperado al confirmar el correo electrónico.");
          setIsError(true);
          setTimeout(() => {
            router.push("/login?error=confirmation-failed");
          }, 3000);
        }
      }
      // Caso 2: Formato con token_hash (formato alternativo)
      else if (token_hash && type) {
        console.log("🔍 Iniciando confirmación con token_hash:", {
          token_hash: token_hash.substring(0, 20) + "...",
          type,
        });
        
        try {
          // Verificar con el formato estándar
          const verificationResult = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "email",
          });
          
          const { error, data } = verificationResult;

          console.log("🔍 Resultado de verificación OTP:", {
            error: error?.message,
            hasUser: !!data?.user,
            userId: data?.user?.id,
          });

          if (!error && data.user) {
            console.log("✅ Correo confirmado exitosamente:", {
              userId: data.user.id,
              email: data.user.email,
              userData: data.user,
            });

            // Obtener datos adicionales del usuario desde los metadatos
            const userMetadata = data.user.user_metadata || {};
            const fullName = (typeof userMetadata.full_name === 'string' ? userMetadata.full_name : "") || "";
            const [firstName = "", lastName = ""] = fullName.split(" ");

            console.log("🔍 Datos del usuario para inserción:", {
              user_id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              firstName,
              lastName,
            });

            // Crear/verificar usuario y perfil usando API route (evita problemas de RLS)
            try {
              const response = await fetch("/api/auth/confirm-user", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: data.user.id,
                  email: data.user.email || "",
                  firstName: firstName,
                  lastName: lastName,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ Error al crear/verificar usuario:", errorData);
                // Continuar de todas formas - el usuario puede existir ya
              } else {
                const result = await response.json();
                console.log("✅ Usuario y perfil creados/verificados:", result);
              }
            } catch (apiError) {
              console.error("⚠️ Error al llamar API de confirmación:", apiError);
              // Continuar de todas formas - el usuario puede existir ya
            }

            setMessage("¡Correo confirmado exitosamente! Tu cuenta ha sido activada. Ahora puedes iniciar sesión.");
            setIsSuccess(true);
            
            // Pequeño delay para mostrar el mensaje de éxito antes de redirigir
            setTimeout(() => {
              router.push("/login?confirmed=true");
            }, 3000);
          } else {
            console.error("❌ Error al confirmar el correo electrónico:", error);
            setMessage(error?.message || "Error al confirmar su correo electrónico. El enlace puede haber expirado.");
            setIsError(true);
            
            // Redirigir después de mostrar el error
            setTimeout(() => {
              router.push("/login?error=confirmation-failed");
            }, 3000);
          }
        } catch (verifyError) {
          console.error("❌ Error inesperado al verificar OTP:", verifyError);
          setMessage("Error inesperado al confirmar el correo electrónico.");
          setIsError(true);
          
          setTimeout(() => {
            router.push("/login?error=confirmation-failed");
          }, 3000);
        }
      } else {
        // No se encontraron parámetros válidos
        console.log("⚠️ No se encontraron parámetros de confirmación válidos");
        setMessage("Faltan parámetros para la confirmación. Por favor, usa el enlace completo del correo electrónico.");
        setIsError(true);
        setTimeout(() => {
          router.push("/login?error=invalid-link");
        }, 3000);
      }
    };

    confirmEmail();
  }, [router]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          {isSuccess ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600">{message}</p>
              <p className="text-sm text-gray-600">Redirigiendo a la página de confirmación...</p>
            </div>
          ) : isError ? (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-red-600">{message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-lg">{message}</p>
            </div>
          )}
        </div>

        {isDevelopment && <EmailDebugPanel />}

        {!isSuccess && !isError && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Si no recibe el correo de confirmación:</p>
            <ul className="mt-2 space-y-1">
              <li>• Revise su carpeta de spam</li>
              <li>• Verifique que el correo sea correcto</li>
              <li>• Espere unos minutos e intente nuevamente</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
