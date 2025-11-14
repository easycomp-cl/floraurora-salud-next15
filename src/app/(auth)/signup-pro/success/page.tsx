"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw } from "lucide-react";

function SignupProSuccessContent() {
  const searchParams = useSearchParams();
  const isResubmission = searchParams.get("resubmitted") === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isResubmission ? "bg-blue-100" : "bg-green-100"}`}>
            {isResubmission ? (
              <RefreshCw className="h-10 w-10 text-blue-600" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isResubmission ? "¡Solicitud Reenviada!" : "¡Solicitud Enviada!"}
          </CardTitle>
          <CardDescription>
            {isResubmission 
              ? "Tu solicitud ha sido actualizada y reenviada exitosamente"
              : "Tu solicitud de registro como profesional ha sido recibida exitosamente"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`border rounded-lg p-4 ${isResubmission ? "bg-blue-50 border-blue-200" : "bg-blue-50 border-blue-200"}`}>
            <h3 className={`font-semibold mb-2 ${isResubmission ? "text-blue-900" : "text-blue-900"}`}>
              {isResubmission ? "Solicitud actualizada" : "¿Qué sigue?"}
            </h3>
            {isResubmission ? (
              <>
                <p className="text-sm text-blue-800 mb-2">
                  Has corregido la información y reenviado tu solicitud. Nuestro equipo la revisará nuevamente.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Hemos actualizado tu solicitud con la nueva información</li>
                  <li>Nuestro equipo revisará los cambios que realizaste</li>
                  <li>Te notificaremos por correo electrónico cuando sea procesada</li>
                </ul>
              </>
            ) : (
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Nuestro equipo de administradores revisará tu solicitud</li>
                <li>Verificarán los documentos que adjuntaste</li>
                <li>Te notificaremos por correo electrónico cuando tu solicitud sea aprobada o rechazada</li>
              </ul>
            )}
            <p className="text-sm text-blue-700 mt-3 font-medium">
              Este proceso puede tomar entre 1 a 3 días hábiles.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">Volver al inicio</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupProSuccessPage() {
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
      <SignupProSuccessContent />
    </Suspense>
  );
}

