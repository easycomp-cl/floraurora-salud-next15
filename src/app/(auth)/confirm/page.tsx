import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ConfirmPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Confirmación de Correo</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de confirmación a su correo electrónico. Por
            favor, revise su bandeja de entrada (y spam) para activar su cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 text-center text-sm">
            ¿Ya confirmó su correo?{" "}
            <Link href="/login" className="underline">
              Iniciar sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
