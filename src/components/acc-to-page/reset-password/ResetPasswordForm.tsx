"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
// Removed unused import: resetPassword
import { createClient } from "@/utils/supabase/browser";

type ResetState = {
  success: boolean;
  error: string | null;
  loading: boolean;
  message: string | null;
};

export function ResetPasswordForm() {
  const [state, setState] = useState<ResetState>({
    success: true,
    error: null,
    loading: false,
    message: null,
  });

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const initializeSession = async () => {
      const supabase = createClient();

      // Verificar si hay un hash en la URL (viene después del redirect de Supabase)
      // Formato: #access_token=...&refresh_token=...&type=recovery
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        // Establecer la sesión con el token del hash
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (sessionError) {
          console.error("Error estableciendo sesión:", sessionError);
          setIsChecking(false);
          setTokenValid(false);
          setState({
            success: false,
            error: "El enlace es inválido o ha expirado",
            loading: false,
            message: null,
          });
          return;
        }

        // Verificar que el usuario esté autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setTokenValid(true);
          setIsChecking(false);
          return;
        } else {
          setIsChecking(false);
          setTokenValid(false);
          setState({
            success: false,
            error: "No se pudo verificar el usuario",
            loading: false,
            message: null,
          });
          return;
        }
      }

      // Si no hay hash, verificar si hay un código en los query params (flujo alternativo)
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get("code");

      if (code) {
        // Procesar el código directamente usando exchangeCodeForSession
        try {
          const { data: sessionData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error(
              "Error intercambiando código por sesión:",
              exchangeError
            );
            setIsChecking(false);
            setTokenValid(false);
            setState({
              success: false,
              error:
                "El enlace es inválido o ha expirado. Solicita un nuevo enlace.",
              loading: false,
              message: null,
            });
            return;
          }

          if (sessionData?.session) {
            // Verificar que el usuario esté autenticado
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              setTokenValid(true);
              setIsChecking(false);
              return;
            }
          }

          // Si no hay sesión después del intercambio, esperar un poco y verificar
          let attempts = 0;
          const maxAttempts = 10;
          const checkSession = async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session) {
              setIsChecking(false);
              setTokenValid(true);
              return true;
            }

            attempts++;
            return false;
          };

          // Verificar inmediatamente
          if (await checkSession()) return;

          // Intentar cada 500ms
          const interval = setInterval(async () => {
            if (await checkSession()) {
              clearInterval(interval);
            } else if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsChecking(false);
              setTokenValid(false);
              setState({
                success: false,
                error:
                  "El enlace ya fue utilizado o ha expirado. Solicita un nuevo enlace.",
                loading: false,
                message: null,
              });
            }
          }, 500);

          // Timeout final
          setTimeout(() => {
            clearInterval(interval);
            if (isChecking) {
              setIsChecking(false);
              setTokenValid(false);
            }
          }, 5000);
        } catch (error) {
          console.error("Error procesando código:", error);
          setIsChecking(false);
          setTokenValid(false);
          setState({
            success: false,
            error:
              "Error al procesar el enlace. Por favor, solicita un nuevo enlace.",
            loading: false,
            message: null,
          });
        }
      } else {
        // No hay ni hash ni código, verificar si ya hay una sesión activa
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setTokenValid(true);
          setIsChecking(false);
        } else {
          setIsChecking(false);
          setTokenValid(false);
          setState({
            success: false,
            error:
              "Enlace inválido o expirado. Por favor, solicita un nuevo enlace.",
            loading: false,
            message: null,
          });
        }
      }
    };

    initializeSession();
  }, [isChecking]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ ...state, loading: true, error: null, message: null });

    const password = (e.currentTarget.password as HTMLInputElement).value;
    const confirmPassword = (
      e.currentTarget.confirmPassword as HTMLInputElement
    ).value;

    // Validación básica
    if (password !== confirmPassword) {
      setState({
        success: false,
        error: "Las contraseñas no coinciden",
        loading: false,
        message: null,
      });
      return;
    }

    if (password.length < 6) {
      setState({
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres",
        loading: false,
        message: null,
      });
      return;
    }

    try {
      // Usar el cliente del browser directamente
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setState({
          success: false,
          error: error.message || "Error al actualizar la contraseña",
          loading: false,
          message: null,
        });
        return;
      }

      // Redirigir al login después de éxito
      router.push("/login?passwordReset=success");
    } catch {
      setState({
        success: false,
        error: "Error inesperado al resetear la contraseña",
        loading: false,
        message: null,
      });
    }
  };

  // Mostrar carga mientras verificamos el token
  if (isChecking) {
    return (
      <Card className="mx-auto p-5 max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verificando...</CardTitle>
          <CardDescription>
            Por favor espera mientras verificamos tu enlace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Token inválido
  if (tokenValid === false) {
    return (
      <Card className="mx-auto p-5 max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">
            Enlace Inválido
          </CardTitle>
          <CardDescription>
            Tu enlace de reseteo de contraseña es inválido o ha expirado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Los enlaces de reseteo de contraseña expiran por seguridad. Por
              favor, solicita un nuevo enlace.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Volver al Inicio de Sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formulario de reset
  return (
    <Card className="mx-auto p-5 max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Nueva Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña. Asegúrate de que sea segura.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="mx-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min. 6 caracteres"
                required
                disabled={state.loading}
              />
              <p className="text-xs text-gray-500">
                Debe contener al menos una mayúscula, una minúscula y un número
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirma tu contraseña"
                required
                disabled={state.loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>

            {/* Mostrar mensaje de error si existe */}
            {!state.success && state.error && (
              <div className="text-red-500 text-sm text-center p-2 bg-red-50 rounded">
                {state.error}
              </div>
            )}

            {/* Mostrar mensaje de éxito si existe */}
            {state.success && state.message && (
              <div className="text-green-500 text-sm text-center p-2 bg-green-50 rounded">
                {state.message}
              </div>
            )}
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Volver al Inicio de Sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
