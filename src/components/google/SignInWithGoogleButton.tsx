"use client";
import { clientSignInWithGoogle } from "@/lib/client-auth";
import React from "react";
import GoogleSignInButton from "./GoogleSignInButton";

const SignInWithGoogleButton = () => {
  const handleGoogleSignIn = async () => {
    try {
      console.log("🔐 Iniciando autenticación con Google...");
      console.log(
        "📋 El usuario será verificado/creado automáticamente en la tabla users"
      );

      const { data, error } = await clientSignInWithGoogle();

      if (error) {
        console.error("❌ Error signing in with Google:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        alert(`Error al iniciar sesión: ${errorMessage}`);
        return;
      }

      if (data) {
        console.log("✅ Google sign in initiated successfully:", data);
        console.log("🔗 Redirecting to:", data.url);
        console.log(
          "📋 Usuario será verificado/creado automáticamente en el callback"
        );

        // La redirección se maneja automáticamente por Supabase
        // No necesitamos hacer window.location.href = data.url aquí
      }
    } catch (error) {
      console.error("💥 Unexpected error during Google sign in:", error);
      alert("Error inesperado durante el inicio de sesión");
    }
  };

  return (
    <GoogleSignInButton
      onClick={handleGoogleSignIn}
      className="max-w-sm mx-auto"
    />
  );
};

export default SignInWithGoogleButton;
