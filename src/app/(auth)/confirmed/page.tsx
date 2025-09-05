import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConfirmedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">¡Correo Confirmado!</CardTitle>
          <CardDescription>
            Su cuenta ha sido activada exitosamente. Ahora puede iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-4 text-center">
            <Link href="/login" passHref>
              <Button className="w-full">Iniciar sesión</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
