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
import { signup } from "@/lib/auth-actions";
import SignInWithGoogleButton from "@/components/google/SignInWithGoogleButton";

export function SignUpForm() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Registrarse</CardTitle>
        <CardDescription>
          Ingresa tu información para crear una cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="">
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
              <Input name="password" id="password" type="password" />
            </div>
            <Button formAction={signup} type="submit" className="w-full">
              Crear una cuenta
            </Button>
            <SignInWithGoogleButton />
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" className="underline">
            Iniciar sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
