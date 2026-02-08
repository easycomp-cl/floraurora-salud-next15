"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail } from "lucide-react";

function ConfirmPageContent() {
  const searchParams = useSearchParams();
  const emailSent = searchParams.get("email-sent") !== "false";
  const registered = searchParams.get("registered") === "true";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {emailSent ? (
              <>
                <Mail className="h-5 w-5" />
                Confirmación de Correo
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Problema al Enviar Correo
              </>
            )}
          </CardTitle>
          <CardDescription>
            {emailSent ? (
              <>
                {registered ? (
                  <>
                    ¡Tu cuenta ha sido creada exitosamente! Hemos enviado un enlace de confirmación a tu correo electrónico ({searchParams.get("email") || "tu correo"}). 
                    Por favor, revise su bandeja de entrada (y spam) para activar su cuenta.
                  </>
                ) : (
                  <>
                    Hemos enviado un enlace de confirmación a su correo electrónico. Por
                    favor, revise su bandeja de entrada (y spam) para activar su cuenta.
                  </>
                )}
              </>
            ) : (
              <>
                Hubo un problema al enviar el correo de confirmación, pero su cuenta
                se ha creado correctamente. Puede intentar iniciar sesión directamente
                o contactar a soporte para obtener ayuda.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSent && registered && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 font-medium">
                ✅ Tu cuenta ha sido creada. Revisa tu correo para confirmar tu email.
              </p>
            </div>
          )}
          {!emailSent && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Si no recibió el correo, puede intentar iniciar sesión directamente.
                Si su correo ya estaba confirmado, podrá acceder sin problemas.
              </p>
            </div>
          )}
          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              ¿Ya confirmó su correo?{" "}
              <Link href="/login" className="underline font-medium">
                Iniciar sesión
              </Link>
            </div>
            {!emailSent && (
              <div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Intentar Iniciar Sesión</Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Card className="mx-auto max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}
