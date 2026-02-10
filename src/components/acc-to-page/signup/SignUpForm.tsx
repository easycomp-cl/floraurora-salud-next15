"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { signup } from "@/lib/auth-actions";
import { SignUpFormWrapper } from "./SignUpFormWrapper";
import { AlertCircle, XCircle } from "lucide-react";

function SignUpFormContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorContent = () => {
    switch (error) {
      case "user-exists":
        return {
          title: "Usuario ya registrado",
          description: "Este correo electrónico ya está registrado en nuestra plataforma.",
          message: "Si ya tienes una cuenta, puedes iniciar sesión. Si olvidaste tu contraseña, puedes recuperarla.",
          icon: <XCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "invalid-email":
        return {
          title: "Email inválido",
          description: "El correo electrónico proporcionado no es válido.",
          message: "Por favor, verifica que el correo sea correcto e intenta nuevamente.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "weak-password":
        return {
          title: "Contraseña débil",
          description: "La contraseña no cumple con los requisitos mínimos.",
          message: "La contraseña debe tener al menos 6 caracteres.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "signup-failed":
        return {
          title: "Error al crear cuenta",
          description: "No se pudo crear tu cuenta en este momento.",
          message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte.",
          icon: <XCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "invalid-data":
        return {
          title: "Datos inválidos",
          description: "Los datos proporcionados no son válidos.",
          message: "Por favor, completa todos los campos correctamente e intenta nuevamente.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "config-error":
        return {
          title: "Error de configuración",
          description: "Hay un problema con la configuración del sistema.",
          message: "Por favor, contacta a soporte para resolver este problema.",
          icon: <XCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "auth-service-error":
        return {
          title: "Error del servicio de autenticación",
          description: "No se pudo conectar con el servicio de autenticación.",
          message: "Por favor, intenta nuevamente en unos momentos.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "professional-request-pending":
        return {
          title: "Registro no disponible",
          description: "Este correo electrónico tiene una solicitud de profesional en proceso de revisión.",
          message: "No puedes registrarte como paciente mientras tu solicitud de profesional esté siendo evaluada. Espera a que se complete la revisión o contacta a soporte si tienes dudas.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      case "email-service-error":
        return {
          title: "Error al enviar correo de confirmación",
          description: "Tu cuenta no se pudo crear debido a un problema con el servicio de correo.",
          message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte. Es posible que necesites verificar la configuración de correo en Supabase.",
          icon: <AlertCircle className="h-5 w-5" />,
          variant: "destructive" as const,
        };
      default:
        return null;
    }
  };

  const errorContent = getErrorContent();

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Registrarse</CardTitle>
        <CardDescription>
          Ingresa tu información para crear una cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorContent && (
          <Alert variant={errorContent.variant} className="mb-4">
            {errorContent.icon}
            <AlertTitle>{errorContent.title}</AlertTitle>
            <AlertDescription>
              <p className="font-medium">{errorContent.description}</p>
              <p className="mt-2 text-sm">{errorContent.message}</p>
            </AlertDescription>
          </Alert>
        )}

        <form action={signup}>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">Nombre</Label>
                <Input
                  name="first-name"
                  id="first-name"
                  placeholder="Javier"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Apellido</Label>
                <Input
                  name="last-name"
                  id="last-name"
                  placeholder="Núñez"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="m@ejemplo.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input name="password" id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Crear una cuenta
            </Button>
          </div>
        </form>

        <SignUpFormWrapper />

        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="underline">
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-3 text-center text-sm">
          ¿Eres un profesional de la salud?{" "}
          <Link
            href="/signup-pro"
            className="underline text-blue-600 hover:text-blue-800 font-medium"
          >
            Regístrate como profesional
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function SignUpForm() {
  return (
    <Suspense fallback={
      <Card className="mx-auto max-w-md">
        <CardContent className="p-6">
          <p className="text-center">Cargando...</p>
        </CardContent>
      </Card>
    }>
      <SignUpFormContent />
    </Suspense>
  );
}
