"use client";
import { clientSignInWithGoogle } from "@/lib/client-auth";
import React from "react";
import GoogleSignInButton from "./GoogleSignInButton";

const SignInWithGoogleButton = () => {
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await clientSignInWithGoogle();

      if (error) {
        console.error("❌ Error signing in with Google:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        alert(`Error al iniciar sesión: ${errorMessage}`);
        return;
      }

      // La redirección se maneja automáticamente por Supabase
      // No necesitamos hacer window.location.href = data.url aquí
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
