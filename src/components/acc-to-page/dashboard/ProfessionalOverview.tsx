"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import type { ProfessionalProfile } from "@/lib/types/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarClock, 
  DollarSign, 
  CreditCard, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface ProfessionalData {
  id: number;
  plan_type: "commission" | "monthly" | null;
  last_monthly_payment_date: string | null;
  monthly_plan_expires_at: string | null;
  is_active: boolean;
}

export function ProfessionalOverview() {
  const { user } = useAuthState();
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfessionalData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const profile = await profileService.getUserProfileByUuid(user.id);
        
        if (!profile) {
          setError("No se pudo cargar tu perfil");
          setLoading(false);
          return;
        }

        // Obtener datos del profesional
        const professional = await profileService.getProfessionalProfile(profile.id);
        
        if (professional) {
          // Tipar el profesional con campos adicionales que pueden venir de la base de datos
          const professionalWithPlan = professional as ProfessionalProfile & {
            plan_type?: "commission" | "monthly" | null;
            last_monthly_payment_date?: string | null;
            monthly_plan_expires_at?: string | null;
            is_active?: boolean;
          };
          
          setProfessionalData({
            id: professional.id,
            plan_type: professionalWithPlan.plan_type || null,
            last_monthly_payment_date: professionalWithPlan.last_monthly_payment_date || null,
            monthly_plan_expires_at: professionalWithPlan.monthly_plan_expires_at || null,
            is_active: professionalWithPlan.is_active !== undefined ? professionalWithPlan.is_active : false,
          });
        } else {
          setProfessionalData(null);
        }
      } catch (err) {
        console.error("Error cargando datos del profesional:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadProfessionalData();
  }, [user]);

  // Verificar si el plan mensual está activo (basado en monthly_plan_expires_at)
  const isMonthlyPlanActive = () => {
    if (!professionalData || professionalData.plan_type !== "monthly") {
      return false;
    }

    if (!professionalData.monthly_plan_expires_at) {
      return false; // Si no tiene fecha de expiración, no tiene pago activo
    }

    const expiresAt = new Date(professionalData.monthly_plan_expires_at);
    return expiresAt > new Date(); // Solo activo si la fecha está en el futuro
  };

  // Verificar si puede usar el servicio
  const canUseService = () => {
    if (!professionalData) return false;
    
    // Verificar que la cuenta esté activa
    if (!professionalData.is_active) {
      return false;
    }
    
    // Si tiene plan de comisión, puede usar el servicio (si está activo)
    if (professionalData.plan_type === "commission") {
      return true;
    }

    // Si tiene plan mensual, verificar que el pago esté activo
    if (professionalData.plan_type === "monthly") {
      return isMonthlyPlanActive();
    }

    // Si no tiene plan asignado, no puede usar el servicio
    return false;
  };

  // Obtener días restantes del plan mensual
  const getDaysRemaining = () => {
    if (!professionalData?.monthly_plan_expires_at) return null;
    
    const expiresAt = new Date(professionalData.monthly_plan_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const serviceAvailable = canUseService();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Alerta de estado del servicio */}
      {!serviceAvailable && (
        <Alert variant="destructive" className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-semibold">
            <strong>Servicio no disponible:</strong>{" "}
            {!professionalData?.plan_type 
              ? "No tienes un plan asignado. Contacta con el administrador para activar tu cuenta."
              : professionalData.plan_type === "monthly" && !isMonthlyPlanActive()
              ? "Tu plan mensual ha expirado o no has realizado el pago. Por favor, realiza el pago para continuar usando el servicio."
              : "Tu cuenta no está activa. Contacta con el administrador."}
          </AlertDescription>
        </Alert>
      )}

      {/* Información del plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información del Plan
          </CardTitle>
          <CardDescription>
            Estado de tu plan y pagos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {professionalData ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Plan</p>
                  <p className="text-lg font-semibold">
                    {professionalData.plan_type === "commission" 
                      ? "Plan de Comisión" 
                      : professionalData.plan_type === "monthly"
                      ? "Plan Mensual"
                      : "Sin plan asignado"}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  serviceAvailable 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                }`}>
                  {serviceAvailable ? "Activo" : "Inactivo"}
                </div>
              </div>

              {professionalData.plan_type === "monthly" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Estado del Pago Mensual</p>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        {isMonthlyPlanActive() ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            Inactivo / Sin pago
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {professionalData.last_monthly_payment_date && (
                    <div className="text-sm text-gray-600">
                      <strong>Último pago:</strong>{" "}
                      {new Date(professionalData.last_monthly_payment_date).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  {professionalData.monthly_plan_expires_at && (
                    <div className="text-sm text-gray-600">
                      <strong>Expira:</strong>{" "}
                      {new Date(professionalData.monthly_plan_expires_at).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  {daysRemaining !== null && daysRemaining > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          {daysRemaining === 1 
                            ? "Tu plan expira mañana" 
                            : `Tu plan expira en ${daysRemaining} días`}
                        </p>
                      </div>
                    </div>
                  )}

                  {!isMonthlyPlanActive() && (
                    <Button className="w-full" asChild>
                      <Link href="/dashboard/payment">
                        Realizar Pago Mensual
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {professionalData.plan_type === "commission" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Con el plan de comisión, pagas un porcentaje por cada cita realizada. 
                    No necesitas realizar pagos mensuales.
                  </p>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                No se encontró información del profesional. Contacta con el administrador.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Métricas rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Citas</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              Ver todas tus citas
            </p>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/dashboard/appointments">Ver citas →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              {professionalData?.plan_type === "commission" 
                ? "Comisiones por citas"
                : "Ingresos del mes"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

