"use client";
import React from "react";
import { clientSignInWithGoogle } from "@/lib/client-auth";

interface GoogleOAuthButtonProps {
  text?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  text = "Continuar con Google",
  className = "",
  onSuccess,
  onError,
}) => {
  const handleGoogleSignIn = async () => {
    try {
      console.log("Iniciando autenticación con Google...");

      const { data, error } = await clientSignInWithGoogle();

      if (error) {
        console.error("Error signing in with Google:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";

        if (onError) {
          onError(errorMessage);
        } else {
          alert(`Error al iniciar sesión: ${errorMessage}`);
        }
        return;
      }

      if (data) {
        console.log("Google sign in initiated successfully:", data);
        console.log("Redirecting to:", data.url);

        if (onSuccess) {
          onSuccess();
        }

        // La redirección se maneja automáticamente por Supabase
      }
    } catch (error) {
      console.error("Unexpected error during Google sign in:", error);
      const errorMessage = "Error inesperado durante el inicio de sesión";

      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className={`
        w-full h-11 px-4 py-2
        flex items-center justify-center space-x-3
        bg-white text-gray-700
        border border-gray-300 rounded-md
        hover:bg-gray-50 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {/* Logo oficial de Google */}
      <svg
        className="w-5 h-5 flex-shrink-0"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Google logo"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>

      {/* Texto del botón */}
      <span className="text-sm font-medium">{text}</span>
    </button>
  );
};

export default GoogleOAuthButton;
