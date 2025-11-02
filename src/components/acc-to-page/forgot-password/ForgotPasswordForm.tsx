"use client";

import { useState } from "react";
import Link from "next/link";
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
import { requestPasswordReset } from "@/lib/auth-actions";
import { requestPasswordResetSchema } from "@/lib/validations/password";

type RequestState = {
  success: boolean;
  error: string | null;
  loading: boolean;
  message: string | null;
};

export function ForgotPasswordForm() {
  const [state, setState] = useState<RequestState>({
    success: false,
    error: null,
    loading: false,
    message: null,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ ...state, loading: true, error: null, message: null });

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim() || "";

    // Validar con Zod
    const parsed = requestPasswordResetSchema.safeParse({ email });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = errors.email?.[0] || "Email inválido";
      
      setState({
        success: false,
        error: firstError,
        loading: false,
        message: null,
      });
      return;
    }

    try {
      const result = await requestPasswordReset(formData);

      if (!result.success) {
        setState({
          success: false,
          error: result.error || "Error al solicitar el reset de contraseña",
          loading: false,
          message: null,
        });
        return;
      }

      // Éxito - mostrar mensaje
      setState({
        success: true,
        error: null,
        loading: false,
        message: result.message || "Se ha enviado un email con instrucciones",
      });
    } catch (error) {
      console.error("💥 Error inesperado:", error);
      setState({
        success: false,
        error: "Error inesperado al solicitar el reset de contraseña",
        loading: false,
        message: null,
      });
    }
  };

  // Si ya se envió el email exitosamente, mostrar mensaje de confirmación
  if (state.success && state.message) {
    return (
      <Card className="mx-auto p-5 max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">✅ Email Enviado</CardTitle>
          <CardDescription>
            Por favor revisa tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                {state.message}
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>📧 Revisa tu bandeja de entrada</p>
              <p>⏱️ El enlace expira en 24 horas</p>
              <p>🔒 Si no ves el email, revisa tu carpeta de spam</p>
            </div>

            <Button asChild className="w-full" variant="outline">
              <Link href="/login">
                Volver al Inicio de Sesión
              </Link>
            </Button>

            <div className="text-center">
              <button
                onClick={() => setState({ ...state, success: false, message: null })}
                className="text-sm text-blue-600 hover:underline"
              >
                Enviar a otro email
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formulario de solicitud de reset
  return (
    <Card className="mx-auto p-5 max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico para recibir un enlace de recuperación
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
            
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </Button>

            {/* Mostrar mensaje de error si existe */}
            {!state.success && state.error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {state.error}
              </div>
            )}
          </div>
        </form>
        
        <div className="mt-4 text-center text-sm space-y-2">
          <Link href="/login" className="text-blue-600 hover:underline block">
            ← Volver al Inicio de Sesión
          </Link>
          <div>
            ¿No tienes una cuenta?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Regístrate
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

