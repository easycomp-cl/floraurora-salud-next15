"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientLogin } from "@/lib/client-auth";
import SignInWithGoogleButton from "@/components/google/SignInWithGoogleButton";

// Tipo para el estado del formulario
type LoginState = {
  success: boolean;
  error: string | null;
  loading: boolean;
};

export function LoginForm() {
  const [state, setState] = useState<LoginState>({
    success: true,
    error: null,
    loading: false,
  });
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Verificar si viene de un password reset exitoso
    if (searchParams.get("passwordReset") === "success") {
      setShowResetSuccess(true);
      // Remover el parámetro de la URL sin recargar
      router.replace("/login");
      // Ocultar el mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setShowResetSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ ...state, loading: true, error: null });

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await clientLogin(email, password);
      const errorMessage =
        error instanceof Error ? error.message : "Credenciales inválidas";

      //console.log("errorMessage", errorMessage);
      let errorFinal;

      if (errorMessage.includes("Email not confirmed")) {
        errorFinal = "Email no confirmado";
      } else if (errorMessage.includes("User is banned")) {
        errorFinal = "Usuario baneado";
      } else {
        errorFinal = "Credenciales inválidas";
      }

      if (error) {
        //console.error("❌ Error en login:", error);
        setState({
          success: false,
          error: errorFinal,
          loading: false,
        });
        return;
      }

      if (data?.session) {
        console.log("✅ Login exitoso, redirigiendo...");
        setState({
          success: true,
          error: null,
          loading: false,
        });
        // Redirigir al dashboard
        router.push("/dashboard");
      } else {
        setState({
          success: false,
          error: "No se pudo crear la sesión",
          loading: false,
        });
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setState({
        success: false,
        error: "Error inesperado al iniciar sesión",
        loading: false,
      });
    }
  };

  return (
    <Card className="mx-auto p-5 max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Introduce tu correo electrónico y contraseña para iniciar sesión
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mx-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@ejemplo.com"
                required
                disabled={state.loading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Contraseña</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={state.loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>

            {/* Mostrar mensaje de error si existe */}
            {!state.success && state.error && (
              <p className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {state.error}
              </p>
            )}

            {/* Mostrar mensaje de éxito de reseteo de contraseña */}
            {showResetSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm text-center p-3 rounded-lg flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">
                  Contraseña reestablecida correctamente
                </span>
              </div>
            )}

            <SignInWithGoogleButton />
          </div>
          <div className="flex justify-center mt-4">
            <Link
              href="/forgot-password"
              className="inline-block text-sm underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/signup" className="underline">
            Regístrate
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
