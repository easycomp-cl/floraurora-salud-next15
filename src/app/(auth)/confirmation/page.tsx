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
      
      // Buscar token_hash en query params o hash
      let token_hash = searchParams.get("token_hash") || hashParams.get("token_hash");
      const type = searchParams.get("type") || hashParams.get("type");
      
      // También buscar en otros formatos posibles
      if (!token_hash) {
        token_hash = searchParams.get("token") || hashParams.get("token");
      }
      
      console.log("🔍 Parámetros de confirmación detectados:", {
        token_hash: token_hash ? token_hash.substring(0, 20) + "..." : null,
        type,
        hasHash: url.hash.length > 0,
        allSearchParams: Object.fromEntries(searchParams),
        allHashParams: Object.fromEntries(hashParams),
      });

      if (token_hash && type) {
        console.log("🔍 Iniciando confirmación de correo:", {
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
            const fullName = userMetadata.full_name || "";
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

            setMessage("¡Correo confirmado exitosamente! Tu cuenta ha sido activada.");
            setIsSuccess(true);
            
            // Pequeño delay para mostrar el mensaje de éxito antes de redirigir
            setTimeout(() => {
              router.push("/confirmed");
            }, 2000);
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
        // Verificar si hay otros parámetros en la URL (puede venir de Supabase con formato diferente)
        const allParams = new URLSearchParams(window.location.search);
        console.log("🔍 Parámetros en URL:", Object.fromEntries(allParams));
        
        if (allParams.size === 0) {
          setMessage("Faltan parámetros para la confirmación. Por favor, usa el enlace completo del correo electrónico.");
          setIsError(true);
        } else {
          // Intentar extraer token_hash de otros parámetros posibles
          const possibleToken = allParams.get("token") || allParams.get("access_token");
          if (possibleToken) {
            console.log("⚠️ Formato de token diferente detectado, redirigiendo a login...");
            setMessage("El formato del enlace no es el esperado. Por favor, intenta iniciar sesión directamente.");
            setIsError(true);
            setTimeout(() => {
              router.push("/login");
            }, 3000);
          } else {
            setMessage("Faltan parámetros para la confirmación. Por favor, usa el enlace completo del correo electrónico.");
            setIsError(true);
          }
        }
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
