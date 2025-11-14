"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProfessionalSignupStepper from "@/components/acc-to-page/signup-pro/ProfessionalSignupStepper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

function SignUpProContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error");

  // Si hay un error, mostrar página de error
  if (error) {
    const getErrorContent = () => {
      switch (error) {
        case "user-exists":
          return {
            title: "Usuario ya registrado",
            description: "Este correo electrónico ya está registrado en nuestra plataforma.",
            message: "Si ya tienes una cuenta, puedes iniciar sesión. Si olvidaste tu contraseña, puedes recuperarla.",
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            color: "red",
          };
        case "email-required":
          return {
            title: "Email requerido",
            description: "El correo electrónico es obligatorio para registrarse.",
            message: "Por favor, completa todos los campos requeridos.",
            icon: <AlertCircle className="h-10 w-10 text-yellow-600" />,
            color: "yellow",
          };
        case "signup-failed":
          return {
            title: "Error al crear cuenta",
            description: "No se pudo crear tu cuenta en este momento.",
            message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte.",
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            color: "red",
          };
        case "user-creation-failed":
          return {
            title: "Error al crear perfil",
            description: "Tu cuenta se creó pero no se pudo completar tu perfil.",
            message: "Por favor, contacta a soporte para resolver este problema.",
            icon: <AlertCircle className="h-10 w-10 text-yellow-600" />,
            color: "yellow",
          };
        case "request-creation-failed":
          return {
            title: "Error al enviar solicitud",
            description: "No se pudo guardar tu solicitud de registro profesional.",
            message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte.",
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            color: "red",
          };
        case "request-pending":
          return {
            title: "Solicitud en revisión",
            description: "Ya existe una solicitud de registro profesional pendiente para este correo electrónico.",
            message: "Tu solicitud está siendo revisada actualmente por nuestro equipo. Por favor, espera a que sea procesada. Recibirás una notificación por correo electrónico cuando sea aprobada o rechazada.",
            icon: <AlertCircle className="h-10 w-10 text-yellow-600" />,
            color: "yellow",
          };
        case "user-update-failed":
          return {
            title: "Error al actualizar datos",
            description: "No se pudieron actualizar tus datos de usuario.",
            message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte.",
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            color: "red",
          };
        case "request-update-failed":
          return {
            title: "Error al reenviar solicitud",
            description: "No se pudo actualizar tu solicitud rechazada.",
            message: "Por favor, intenta nuevamente. Si el problema persiste, contacta a soporte.",
            icon: <XCircle className="h-10 w-10 text-red-600" />,
            color: "red",
          };
        default:
          return {
            title: "Error desconocido",
            description: "Ocurrió un error inesperado.",
            message: "Por favor, intenta nuevamente o contacta a soporte.",
            icon: <AlertCircle className="h-10 w-10 text-yellow-600" />,
            color: "yellow",
          };
      }
    };

    const errorContent = getErrorContent();
    const bgColorClass = errorContent.color === "red" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";
    const textColorClass = errorContent.color === "red" ? "text-red-800" : "text-yellow-800";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgColorClass}`}>
              {errorContent.icon}
            </div>
            <CardTitle className="text-2xl">{errorContent.title}</CardTitle>
            <CardDescription>{errorContent.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`${bgColorClass} border rounded-lg p-4`}>
              <p className={`text-sm ${textColorClass}`}>{errorContent.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  router.push("/signup-pro");
                }}
                className="w-full"
              >
                Intentar nuevamente
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay error, mostrar el formulario normal
  return <ProfessionalSignupStepper />;
}

const SignUpProPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignUpProContent />
    </Suspense>
  );
};

export default SignUpProPage;
