"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPasswordSchema } from "@/lib/validations/password";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const initializeSession = async () => {
      const supabase = createClient();
      
      // Verificar si hay un hash en la URL (token de Supabase)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (accessToken && type === "recovery") {
        // Establecer la sesión con el token
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get("refresh_token") || "",
        });

        if (sessionError) {
          console.error("Error estableciendo sesión:", sessionError);
          setIsChecking(false);
          setTokenValid(false);
          return;
        }

        // Verificar que el usuario esté autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setTokenValid(true);
          setIsChecking(false);
        } else {
          setIsChecking(false);
          setTokenValid(false);
        }
      } else {
        // Intentar obtener la sesión actual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setTokenValid(true);
          setIsChecking(false);
        } else {
          setIsChecking(false);
          setTokenValid(false);
        }
      }
    };

    initializeSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación con Zod
    const parsed = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.flatten().fieldErrors.password?.[0] ??
        parsed.error.flatten().fieldErrors.confirmPassword?.[0] ??
        parsed.error.issues[0]?.message;
      setError(firstError ?? "Datos de formulario inválidos");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(updateError.message || "Error al establecer la contraseña");
        setLoading(false);
        return;
      }

      // Obtener el usuario actualizado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("No se pudo obtener la información del usuario");
        setLoading(false);
        return;
      }

      // Obtener el registro de users para conseguir el id numérico
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (userError || !userRecord) {
        console.error("Error al obtener registro de usuario:", userError);
        setError("No se pudo obtener el registro de usuario");
        setLoading(false);
        return;
      }

      // Crear registro en la tabla professionals usando el id de users
      const { error: professionalError } = await supabase
        .from("professionals")
        .insert({
          id: userRecord.id, // Usar el id numérico de users
          is_active: false, // Inactivo hasta que el admin configure el plan y se realice el pago
          plan_type: null, // Se establecerá cuando el admin configure el plan
          // monthly_plan_expires_at será null hasta que se realice el primer pago exitoso
        })
        .select()
        .single();

      // Si el error es que ya existe, está bien (puede haber sido creado antes)
      if (professionalError && professionalError.code !== "23505") {
        console.error("Error al crear registro en professionals:", professionalError);
        // No fallar la operación, solo loguear
      }

      setSuccess(true);
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/login?passwordSet=success");
      }, 2000);
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Error inesperado al establecer la contraseña");
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Verificando enlace...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Enlace Inválido o Expirado</CardTitle>
            <CardDescription>
              Este enlace de creación de contraseña no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Por favor, solicita un nuevo enlace de creación de contraseña o contacta con soporte.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/login")} className="w-full">
              Ir al Inicio de Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Contraseña Creada Exitosamente!</CardTitle>
            <CardDescription>
              Tu contraseña ha sido establecida correctamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Redirigiendo al inicio de sesión...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Crear Contraseña</CardTitle>
          <CardDescription className="text-center">
            Establece una contraseña segura para tu cuenta profesional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mín. 6 caracteres, al menos 1 mayúscula, 1 número. No solo números ni solo letras.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Estableciendo contraseña...
                </>
              ) : (
                "Crear Contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

