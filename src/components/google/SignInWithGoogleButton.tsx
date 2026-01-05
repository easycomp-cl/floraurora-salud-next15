"use client";
import { clientSignInWithGoogle } from "@/lib/client-auth";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GoogleSignInButton from "./GoogleSignInButton";

function SignInWithGoogleButtonContent() {
  const searchParams = useSearchParams();

  const handleGoogleSignIn = async () => {
    try {
      // Guardar el parámetro redirect en localStorage antes de iniciar el login con Google
      const redirectParam = searchParams.get("redirect");
      if (redirectParam) {
        // searchParams.get ya decodifica automáticamente, pero guardamos tal cual para preservar los parámetros
        const redirectToSave = redirectParam;
        console.log("🔐 Guardando redirect en localStorage:", redirectToSave);
        localStorage.setItem("auth_redirect", redirectToSave);

        // Verificar que se guardó correctamente
        const verify = localStorage.getItem("auth_redirect");
        console.log("✅ Verificación: redirect guardado:", verify);
      } else {
        console.log("⚠️ No hay parámetro redirect en la URL");
      }

      const { error } = await clientSignInWithGoogle();

      if (error) {
        console.error("❌ Error signing in with Google:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        alert(`Error al iniciar sesión: ${errorMessage}`);
        // Limpiar el redirect guardado si hay error
        localStorage.removeItem("auth_redirect");
        return;
      }

      // La redirección se maneja automáticamente por Supabase
      // No necesitamos hacer window.location.href = data.url aquí
    } catch (error) {
      console.error("💥 Unexpected error during Google sign in:", error);
      alert("Error inesperado durante el inicio de sesión");
      // Limpiar el redirect guardado si hay error
      localStorage.removeItem("auth_redirect");
    }
  };

  return (
    <GoogleSignInButton
      onClick={handleGoogleSignIn}
      className="max-w-sm mx-auto"
    />
  );
}

const SignInWithGoogleButton = () => {
  return (
    <Suspense
      fallback={
        <div className="max-w-sm mx-auto">
          <div className="text-center py-4">
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <SignInWithGoogleButtonContent />
    </Suspense>
  );
};

export default SignInWithGoogleButton;
