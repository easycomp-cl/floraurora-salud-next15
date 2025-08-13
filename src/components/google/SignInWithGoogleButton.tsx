"use client";
import { Button } from "@/components/ui/button";
import { clientSignInWithGoogle } from "@/lib/client-auth";
import React, { useState } from "react";

const SignInWithGoogleButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      console.log("Iniciando autenticación con Google...");

      const { data, error } = await clientSignInWithGoogle();

      if (error) {
        console.error("Error signing in with Google:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        alert(`Error al iniciar sesión: ${errorMessage}`);
        return;
      }

      if (data) {
        console.log("Google sign in initiated successfully:", data);
        console.log("Redirecting to:", data.url);

        // La redirección se maneja automáticamente por Supabase
        // No necesitamos hacer window.location.href = data.url aquí
      }
    } catch (error) {
      console.error("Unexpected error during Google sign in:", error);
      alert("Error inesperado durante el inicio de sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? "Conectando..." : "Login with Google"}
    </Button>
  );
};

export default SignInWithGoogleButton;
