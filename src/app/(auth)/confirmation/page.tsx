"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import createClient from "@/utils/supabase/client";

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
        const supabase = createClient;
        const { error, data } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any, // Supabase types expect specific string literals
        });

        if (!error && data.user) {
          // Lógica para insertar el usuario en la tabla 'users' después de la confirmación
          // Esto es lo que se mencionó que se movería aquí desde la función signup
          const { error: insertError } = await supabase.from("users").insert({
            user_id: data.user.id,
            email: data.user.email,
            // Puedes añadir otros campos que necesites, como name, last_name, etc.
            // Si estos datos no están en el objeto 'data.user', necesitarías obtenerlos de otra forma
            // Por ahora, asumiremos que email y user_id son suficientes para una inserción básica
          });

          if (insertError) {
            console.error(
              "Error al insertar el usuario en la tabla 'users':",
              insertError
            );
            setMessage("Error al completar la configuración de la cuenta.");
            router.push("/error");
            return;
          }

          router.push("/confirmed");
        } else {
          console.error("Error al confirmar el correo electrónico:", error);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <p>{message}</p>
    </div>
  );
}
