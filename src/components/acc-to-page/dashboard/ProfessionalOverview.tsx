"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import type { ProfessionalProfile } from "@/lib/types/profile";
import supabase from "@/utils/supabase/client";
import { DateTime } from "luxon";
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

interface ProfessionalMetrics {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
}

/**
 * Calcula las métricas del profesional directamente usando el cliente de Supabase
 * Esto evita problemas con cookies en fetch desde el cliente
 */
async function calculateProfessionalMetrics(
  professionalId: number
): Promise<ProfessionalMetrics> {
  // Calcular rango de fechas
  const now = DateTime.now().setZone("America/Santiago");
  const dayOfWeek = now.weekday; // 1 = lunes, 7 = domingo

  // Calcular lunes de la semana actual
  const daysFromMonday = dayOfWeek === 7 ? 6 : dayOfWeek - 1;
  const startOfWeek = now
    .minus({ days: daysFromMonday })
    .startOf("day")
    .toISO();

  // Calcular domingo de la semana actual
  const daysToSunday = dayOfWeek === 7 ? 0 : 7 - dayOfWeek;
  const endOfWeek = now.plus({ days: daysToSunday }).endOf("day").toISO();

  // Para citas totales: mes actual
  const startOfMonth = now.startOf("month").toISO();
  const endOfMonth = now.endOf("month").toISO();

  // Obtener métricas en paralelo
  const [
    totalAppointmentsResult,
    upcomingAppointmentsResult,
    completedAppointmentsResult,
  ] = await Promise.all([
    // Total de citas del profesional del mes actual
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .gte("scheduled_at", startOfMonth)
      .lte("scheduled_at", endOfMonth),

    // Próximas citas
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .gte("scheduled_at", now.toISO())
      .in("status", ["confirmed", "pending_confirmation"]),

    // Citas completadas (semana actual)
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .eq("status", "completed")
      .gte("scheduled_at", startOfWeek)
      .lte("scheduled_at", endOfWeek),
  ]);

  // Calcular ingresos de la semana actual
  // Obtener las citas de la semana actual primero
  const { data: appointmentsData } = await supabase
    .from("appointments")
    .select("id, scheduled_at")
    .eq("professional_id", professionalId)
    .gte("scheduled_at", startOfWeek)
    .lte("scheduled_at", endOfWeek);

  let totalRevenue = 0;

  if (appointmentsData && appointmentsData.length > 0) {
    // Crear un Set con los IDs de citas en diferentes formatos posibles
    const appointmentIdsSet = new Set<string>();
    appointmentsData.forEach((a) => {
      const idNum =
        typeof a.id === "number"
          ? a.id
          : Number(String(a.id).replace(/\D/g, ""));
      if (!isNaN(idNum)) {
        appointmentIdsSet.add(String(idNum));
        appointmentIdsSet.add(String(idNum).padStart(8, "0"));
        appointmentIdsSet.add(`APT-${String(idNum).padStart(8, "0")}`);
        appointmentIdsSet.add(`apt${String(idNum).padStart(8, "0")}`);
      }
      appointmentIdsSet.add(String(a.id));
    });

    // Obtener pagos exitosos del profesional
    const { data: allPayments } = await supabase
      .from("payments")
      .select("amount, appointment_id, provider_payment_status")
      .eq("professional_id", professionalId)
      .eq("provider_payment_status", "succeeded");

    if (allPayments && allPayments.length > 0) {
      // Filtrar pagos que correspondan a citas de la semana actual
      const validPayments = allPayments.filter((p) => {
        const paymentAppointmentId = String(p.appointment_id || "");
        const normalizedPaymentId = paymentAppointmentId.replace(/\D/g, "");

        // Verificar si el appointment_id del pago coincide con alguna cita de la semana
        if (
          appointmentIdsSet.has(paymentAppointmentId) ||
          (normalizedPaymentId && appointmentIdsSet.has(normalizedPaymentId)) ||
          (normalizedPaymentId &&
            appointmentIdsSet.has(
              `APT-${normalizedPaymentId.padStart(8, "0")}`
            )) ||
          (normalizedPaymentId &&
            appointmentIdsSet.has(`apt${normalizedPaymentId.padStart(8, "0")}`))
        ) {
          return true;
        }

        // Comparar numéricamente
        for (const appointment of appointmentsData) {
          const appointmentIdNum =
            typeof appointment.id === "number"
              ? appointment.id
              : Number(String(appointment.id).replace(/\D/g, ""));
          const paymentIdNum = Number(normalizedPaymentId);
          if (
            !isNaN(appointmentIdNum) &&
            !isNaN(paymentIdNum) &&
            appointmentIdNum === paymentIdNum
          ) {
            return true;
          }
        }
        return false;
      });

      // Sumar los montos de los pagos válidos
      totalRevenue = validPayments.reduce((sum, p) => {
        const amount = Number(p.amount) || 0;
        return sum + amount;
      }, 0);
    }
  }

  return {
    totalAppointments: totalAppointmentsResult.count || 0,
    upcomingAppointments: upcomingAppointmentsResult.count || 0,
    completedAppointments: completedAppointmentsResult.count || 0,
    totalRevenue,
  };
}

export function ProfessionalOverview() {
  const { user } = useAuthState();
  const router = useRouter();
  const [professionalData, setProfessionalData] =
    useState<ProfessionalData | null>(null);
  const [metrics, setMetrics] = useState<ProfessionalMetrics | null>(null);
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
        const professional = await profileService.getProfessionalProfile(
          profile.id
        );

        if (professional) {
          // Tipar el profesional con campos adicionales que pueden venir de la base de datos
          const professionalWithPlan = professional as ProfessionalProfile & {
            plan_type?: "commission" | "monthly" | null;
            last_monthly_payment_date?: string | null;
            monthly_plan_expires_at?: string | null;
            is_active?: boolean;
          };

          const profData = {
            id: professional.id,
            plan_type: professionalWithPlan.plan_type || null,
            last_monthly_payment_date:
              professionalWithPlan.last_monthly_payment_date || null,
            monthly_plan_expires_at:
              professionalWithPlan.monthly_plan_expires_at || null,
            is_active:
              professionalWithPlan.is_active !== undefined
                ? professionalWithPlan.is_active
                : false,
          };

          setProfessionalData(profData);

          // Si no tiene plan asignado, redirigir a la página de plan
          if (!profData.plan_type) {
            router.push("/dashboard/my-plan?setup=true");
            return;
          }

          // Cargar métricas del profesional directamente usando el cliente de Supabase
          // Esto evita problemas con cookies en fetch
          try {
            const metricsData = await calculateProfessionalMetrics(
              professional.id
            );
            setMetrics(metricsData);
          } catch (metricsError) {
            // Error silencioso - las métricas no son críticas para el funcionamiento
            // Solo loguear en desarrollo si es necesario
            if (process.env.NODE_ENV === "development") {
              console.debug(
                "No se pudieron cargar métricas (no crítico):",
                metricsError
              );
            }
          }
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
  }, [user, router]);

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
              : professionalData.plan_type === "monthly" &&
                  !isMonthlyPlanActive()
                ? "Tu plan mensual ha expirado o no has realizado el pago. Por favor, realiza el pago para continuar usando el servicio."
                : "Tu cuenta no está activa. Contacta con el administrador."}
          </AlertDescription>
        </Alert>
      )}

      {/* Información del plan - Card mejorado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información del Plan
              </CardTitle>
              <CardDescription>Estado de tu plan y pagos</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/my-plan">Gestionar Plan</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {professionalData ? (
            <>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Plan</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {professionalData.plan_type === "commission"
                      ? "Plan de Comisión"
                      : professionalData.plan_type === "monthly"
                        ? "Plan Mensual"
                        : "Sin plan asignado"}
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    serviceAvailable
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {serviceAvailable ? "Activo" : "Inactivo"}
                </div>
              </div>

              {professionalData.plan_type === "monthly" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">
                        Estado del Pago Mensual
                      </p>
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
                      {new Date(
                        professionalData.last_monthly_payment_date
                      ).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  {professionalData.monthly_plan_expires_at && (
                    <div className="text-sm text-gray-600">
                      <strong>Expira:</strong>{" "}
                      {new Date(
                        professionalData.monthly_plan_expires_at
                      ).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}

                  {daysRemaining !== null &&
                    daysRemaining > 0 &&
                    daysRemaining <= 7 && (
                      <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      asChild
                    >
                      <Link href="/dashboard/my-plan?payment=true">
                        Realizar Pago Mensual
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {professionalData.plan_type === "commission" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Con el plan de comisión, pagas un porcentaje por cada cita
                    realizada. No necesitas realizar pagos mensuales.
                  </p>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertDescription>
                No se encontró información del profesional. Contacta con el
                administrador.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Métricas del profesional */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Citas Totales
              </CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                Citas del mes actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Próximas Citas
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.upcomingAppointments}
              </div>
              <p className="text-xs text-muted-foreground">Citas programadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.completedAppointments}
              </div>
              <p className="text-xs text-muted-foreground">Citas finalizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {new Intl.NumberFormat("es-CL", {
                  style: "currency",
                  currency: "CLP",
                  maximumFractionDigits: 0,
                }).format(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {professionalData?.plan_type === "commission"
                  ? "Ingresos de la semana actual (antes de comisión)"
                  : "Ingresos de la semana actual"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Citas</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/dashboard/sessions">Ver todas las citas →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button variant="link" className="p-0 h-auto mt-2" asChild>
              <Link href="/dashboard/my-plan">Gestionar plan y pagos →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
