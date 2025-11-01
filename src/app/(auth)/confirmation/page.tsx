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

  useEffect(() => {
    const confirmEmail = async () => {
      const { searchParams } = new URL(window.location.href);
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (token_hash && type) {
        console.log("🔍 Iniciando confirmación de correo:", {
          token_hash,
          type,
        });
        const { error, data } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "signup" | "email",
        });

        console.log("🔍 Resultado de verificación OTP:", {
          error,
          user: data.user,
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

          // Lógica para insertar el usuario en la tabla 'users' después de la confirmación
          const { error: insertError } = await supabase.from("users").insert({
            user_id: data.user.id,
            email: data.user.email,
            name: firstName,
            last_name: lastName,
            is_active: true,
            role: 2, // Rol de paciente por defecto
          });

          if (insertError) {
            console.error(
              "❌ Error al insertar el usuario en la tabla 'users':",
              insertError
            );
            setMessage("Error al completar la configuración de la cuenta.");
            router.push("/error");
            return;
          }

          console.log("✅ Usuario insertado exitosamente en la tabla 'users'");
          setMessage("¡Correo confirmado exitosamente! Redirigiendo...");
          router.push("/confirmed");
        } else {
          console.error("❌ Error al confirmar el correo electrónico:", error);
          setMessage("Error al confirmar su correo electrónico.");
          router.push("/error");
        }
      } else {
        setMessage("Faltan parámetros para la confirmación.");
        router.push("/error");
      }
    };

    confirmEmail();
  }, [router]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <p className="text-lg">{message}</p>
        </div>

        {isDevelopment && <EmailDebugPanel />}

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Si no recibe el correo de confirmación:</p>
          <ul className="mt-2 space-y-1">
            <li>• Revise su carpeta de spam</li>
            <li>• Verifique que el correo sea correcto</li>
            <li>• Espere unos minutos e intente nuevamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
