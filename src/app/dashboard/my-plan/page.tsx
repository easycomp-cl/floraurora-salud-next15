"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { useRouter, useSearchParams } from "next/navigation";
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
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import WebpayRedirectForm from "@/components/payments/WebpayRedirectForm";
import { canRenewPlan } from "@/lib/utils/plan-renewal";

interface ProfessionalPlanData {
  id: number;
  plan_type: "commission" | "monthly" | null;
  last_monthly_payment_date: string | null;
  monthly_plan_expires_at: string | null;
  is_active: boolean;
}

const MONTHLY_PLAN_PRICE = 24990; // Precio del plan mensual en CLP

const availablePlans = [
  {
    id: "commission" as const,
    name: "Plan Light",
    price: "10%",
    period: "por sesión",
    features: [
      "Agendamiento online",
      "Aviso automático con link de Google Meet",
      "Ficha virtual del paciente",
      "Emisión automática de boleta SII",
      "Videollamada Google Meet",
      "Recepción de pagos de pacientes",
      "Transferencia semanal (segundo día hábil)",
    ],
    description:
      "Renovación automática mensual. Solo correo con link de Meet (sin confirmación automática al paciente)",
  },
  {
    id: "monthly" as const,
    name: "Plan Mensual",
    price: "$24.990",
    period: "mensual",
    features: [
      "Agendamiento online",
      "Aviso automático de confirmación vía mail",
      "Aviso automático de recordatorio vía mail",
      "Ficha virtual del paciente",
      "Emisión automática de boleta SII",
      "Visualización y Publicidad en página principal",
      "Videollamada Google Meet",
      "Recepción de pagos de pacientes",
      "Transferencia semanal (segundo día hábil)",
    ],
    description:
      "Precio preferencial por marcha blanca. Incluye todos los servicios de la aplicación",
    note: "Renovación automática mes a mes si no se avisa retiro hasta el último día del mes",
  },
];

export default function MyPlanPage() {
  const { user, signOut } = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [planData, setPlanData] = useState<ProfessionalPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [webpayData, setWebpayData] = useState<{
    token: string;
    url: string;
  } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<
    "commission" | "monthly" | null
  >(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);

  useEffect(() => {
    const loadPlanData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const profile = await profileService.getUserProfileByUuid(user.id);

        if (!profile) {
          setError("No se pudo cargar tu perfil");
          setLoading(false);
          return;
        }

        const professional = await profileService.getProfessionalProfile(
          profile.id
        );

        if (professional) {
          const professionalWithPlan = professional as {
            plan_type?: "commission" | "monthly" | string | null;
            last_monthly_payment_date?: string | null;
            monthly_plan_expires_at?: string | null;
            is_active?: boolean;
          };

          const data: ProfessionalPlanData = {
            id: professional.id,
            plan_type:
              professionalWithPlan.plan_type === "commission" ||
              professionalWithPlan.plan_type === "monthly"
                ? professionalWithPlan.plan_type
                : null,
            last_monthly_payment_date:
              professionalWithPlan.last_monthly_payment_date || null,
            monthly_plan_expires_at:
              professionalWithPlan.monthly_plan_expires_at || null,
            is_active:
              professionalWithPlan.is_active !== undefined
                ? professionalWithPlan.is_active
                : false,
          };

          setPlanData(data);
        } else {
          // Si no existe el profesional, crear un registro básico con plan null
          // Esto permite que el usuario pueda seleccionar un plan
          const data = {
            id: profile.id,
            plan_type: null,
            last_monthly_payment_date: null,
            monthly_plan_expires_at: null,
            is_active: false,
          };

          setPlanData(data);
        }
      } catch (err) {
        console.error("Error cargando datos del plan:", err);
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadPlanData();
  }, [user]);

  // Manejar estados de pago desde query params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      // Recargar datos del plan después de un pago exitoso
      setTimeout(() => {
        window.location.href = "/dashboard/my-plan";
      }, 3000);
    }
  }, [searchParams]);

  const isMonthlyPlanActive = () => {
    if (!planData || planData.plan_type !== "monthly") return false;
    if (!planData.monthly_plan_expires_at) return false;
    return new Date(planData.monthly_plan_expires_at) > new Date();
  };

  const getDaysRemaining = () => {
    if (!planData?.monthly_plan_expires_at) return null;
    const expiresAt = new Date(planData.monthly_plan_expires_at);
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handlePlanSelection = async (planType: "commission" | "monthly") => {
    if (!user) return;

    try {
      setUpdatingPlan(true);
      setError(null);

      // Ya no necesitamos obtener el professionalId del cliente
      // El servidor lo determinará desde el usuario autenticado
      console.log("Seleccionando plan:", { planType });

      // Si el plan es "commission", solo actualizar el plan_type
      if (planType === "commission") {
        const response = await fetch("/api/professional/update-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user.id, // Enviar user_id en header como respaldo
          },
          body: JSON.stringify({
            planType: "commission",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Si hay error 401 (no autenticado) o desajuste de sesión, cerrar sesión y redirigir
          if (
            response.status === 401 ||
            errorData.sessionMismatch ||
            errorData.needsReauth
          ) {
            console.error(
              "🚨 Error de autenticación detectado, cerrando sesión..."
            );
            console.error("🚨 Detalles:", {
              status: response.status,
              errorData,
            });

            // Cerrar sesión y redirigir al login
            try {
              await signOut();
            } catch (signOutError) {
              console.error("Error al cerrar sesión:", signOutError);
            }

            // Forzar redirección inmediata
            window.location.href = "/login?error=session_mismatch";
            return;
          }

          throw new Error(errorData.error || "Error al actualizar el plan");
        }

        // Recargar datos del plan
        window.location.reload();
        return;
      }

      // Si el plan es "monthly", primero actualizar el plan_type y luego iniciar el pago
      if (planType === "monthly") {
        // Primero actualizar el plan_type a "monthly"
        const updateResponse = await fetch("/api/professional/update-plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-ID": user.id, // Enviar user_id en header como respaldo
          },
          body: JSON.stringify({
            planType: "monthly",
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();

          // Si hay desajuste de sesión, cerrar sesión automáticamente
          if (
            errorData.sessionMismatch ||
            (errorData.needsReauth &&
              errorData.error?.includes("desactualizada"))
          ) {
            console.error(
              "🚨 Desajuste de sesión detectado, cerrando sesión..."
            );
            // Cerrar sesión y redirigir al login
            await signOut();
            router.push("/login?error=session_mismatch");
            return;
          }

          throw new Error(errorData.error || "Error al actualizar el plan");
        }

        // Luego iniciar el proceso de pago (sin professionalId, el servidor lo determinará)
        await handleMonthlyPayment();
      }
    } catch (err) {
      console.error("Error seleccionando plan:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al procesar la selección del plan"
      );
      setUpdatingPlan(false);
    }
  };

  const handleMonthlyPayment = async () => {
    if (!user) return;

    try {
      setProcessingPayment(true);
      setError(null);

      // Ya no necesitamos obtener el professionalId
      // El servidor lo determinará desde el usuario autenticado

      // Crear transacción de Webpay
      const response = await fetch("/api/payments/webpay/create-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
        body: JSON.stringify({
          amount: MONTHLY_PLAN_PRICE,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Si hay error 401 (no autenticado) o desajuste de sesión, cerrar sesión y redirigir
        if (
          response.status === 401 ||
          errorData.sessionMismatch ||
          errorData.needsReauth
        ) {
          console.error(
            "🚨 Error de autenticación detectado, cerrando sesión..."
          );
          console.error("🚨 Detalles:", { status: response.status, errorData });

          // Cerrar sesión y redirigir al login
          try {
            await signOut();
          } catch (signOutError) {
            console.error("Error al cerrar sesión:", signOutError);
          }

          // Forzar redirección inmediata
          window.location.href = "/login?error=session_mismatch";
          return;
        }

        throw new Error(
          errorData.error || "Error al iniciar el proceso de pago"
        );
      }

      const webpayData = await response.json();

      if (!webpayData.success || !webpayData.token || !webpayData.url) {
        throw new Error("No se pudo obtener la información de pago de Webpay");
      }

      // Redirigir a Webpay
      setWebpayData({
        token: webpayData.token,
        url: webpayData.url,
      });
    } catch (err) {
      console.error("Error procesando pago:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
      setProcessingPayment(false);
      setUpdatingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando información del plan...</p>
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

  const daysRemaining = getDaysRemaining();
  const needsPayment =
    planData?.plan_type === "monthly" && !isMonthlyPlanActive();

  // Verificar si se puede renovar el plan (mínimo 5 días antes de expirar)
  const renewalCheck = planData?.monthly_plan_expires_at
    ? canRenewPlan(planData.monthly_plan_expires_at)
    : { canRenew: true }; // Si no hay fecha, es primer pago (siempre permitido)

  const setupMode = searchParams.get("setup") === "true";
  const paymentMode = searchParams.get("payment") === "true";
  const paymentStatus = searchParams.get("payment");

  // Si hay datos de Webpay, mostrar el componente de redirección
  if (webpayData) {
    return <WebpayRedirectForm token={webpayData.token} url={webpayData.url} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Plan</h1>
          <p className="text-gray-600 mt-1">Gestiona tu plan y pagos</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Volver al Dashboard</Link>
        </Button>
      </div>

      {/* Mensajes de estado de pago */}
      {paymentStatus === "success" && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>¡Pago exitoso!</strong> Tu plan mensual ha sido activado
            correctamente. Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "cancelled" && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Pago cancelado:</strong> El pago fue cancelado. Puedes
            intentar nuevamente cuando lo desees.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "error" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error en el pago:</strong>{" "}
            {searchParams.get("message") ||
              "Ocurrió un error al procesar el pago. Por favor, intenta nuevamente."}
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === "rejected" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pago rechazado:</strong> El pago fue rechazado por el banco.
            Por favor, verifica tu tarjeta e intenta nuevamente.
          </AlertDescription>
        </Alert>
      )}

      {setupMode && !planData?.plan_type && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Plan no asignado:</strong> No tienes un plan activo.
            Contacta con el administrador para activar tu cuenta y asignar un
            plan.
          </AlertDescription>
        </Alert>
      )}

      {paymentMode && needsPayment && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Pago requerido:</strong> Tu plan mensual ha expirado o no
            has realizado el pago. Realiza el pago para continuar usando el
            servicio.
          </AlertDescription>
        </Alert>
      )}

      {planData?.plan_type && (
        <>
          {/* Información del plan actual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan Actual
              </CardTitle>
              <CardDescription>
                {planData.plan_type === "commission"
                  ? "Plan de Comisión - Pagas por cada cita realizada"
                  : "Plan Mensual - Pago mensual fijo"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mostrar el plan seleccionado con sus detalles */}
              {(() => {
                const currentPlan = availablePlans.find(
                  (p) => p.id === planData.plan_type
                );
                return currentPlan ? (
                  <div className="p-6 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border-2 border-teal-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-teal-900 mb-2">
                          {currentPlan.name}
                        </h3>
                        <p className="text-gray-700 mb-3">
                          {currentPlan.description}
                        </p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-teal-900">
                            {currentPlan.price}
                          </span>
                          <span className="text-gray-600">
                            /{currentPlan.period}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          planData.is_active &&
                          (planData.plan_type === "commission" ||
                            isMonthlyPlanActive())
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {planData.is_active &&
                        (planData.plan_type === "commission" ||
                          isMonthlyPlanActive())
                          ? "Activo"
                          : "Inactivo"}
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {currentPlan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {currentPlan.note && (
                      <p className="text-xs text-gray-600 italic bg-white/50 p-2 rounded">
                        {currentPlan.note}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}

              {planData.plan_type === "monthly" && (
                <div className="space-y-4">
                  {/* Información de renovación y duración */}
                  <div
                    className={`p-4 border rounded-lg ${isMonthlyPlanActive() ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}
                  >
                    <h4
                      className={`font-semibold mb-3 flex items-center gap-2 ${isMonthlyPlanActive() ? "text-blue-900" : "text-red-900"}`}
                    >
                      <Calendar className="h-5 w-5" />
                      Información de Renovación
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {planData.last_monthly_payment_date && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Último Pago
                          </p>
                          <p
                            className={`text-lg font-semibold ${isMonthlyPlanActive() ? "text-blue-900" : "text-gray-700"}`}
                          >
                            {new Date(
                              planData.last_monthly_payment_date
                            ).toLocaleDateString("es-CL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}

                      <div>
                        {planData.monthly_plan_expires_at ? (
                          <>
                            {isMonthlyPlanActive() ? (
                              <>
                                <p className="text-sm text-gray-600 mb-1">
                                  Expira el
                                </p>
                                <p className="text-lg font-semibold text-blue-900">
                                  {new Date(
                                    planData.monthly_plan_expires_at
                                  ).toLocaleDateString("es-CL", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                {daysRemaining !== null &&
                                  daysRemaining > 0 && (
                                    <p className="text-sm text-blue-700 mt-1 font-medium">
                                      {daysRemaining === 1
                                        ? "⏰ Expira mañana"
                                        : daysRemaining <= 7
                                          ? `⏰ Expira en ${daysRemaining} días`
                                          : `✅ Válido por ${daysRemaining} días más`}
                                    </p>
                                  )}
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600 mb-1">
                                  Expiró el
                                </p>
                                <p className="text-lg font-semibold text-red-600">
                                  {new Date(
                                    planData.monthly_plan_expires_at
                                  ).toLocaleDateString("es-CL", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-sm text-red-700 mt-1 font-medium">
                                  ⚠️ Plan expirado - Pago requerido
                                </p>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 mb-1">
                              Estado del Plan
                            </p>
                            <p className="text-lg font-semibold text-yellow-700">
                              Sin fecha de expiración
                            </p>
                            <p className="text-sm text-yellow-700 mt-1 font-medium">
                              ⚠️ No se ha registrado un pago aún
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`mt-3 pt-3 border-t ${isMonthlyPlanActive() ? "border-blue-200" : "border-red-200"}`}
                    >
                      {planData.monthly_plan_expires_at ? (
                        <>
                          {isMonthlyPlanActive() ? (
                            <p className="text-sm text-gray-700">
                              <strong>Duración del plan:</strong> Tu plan
                              mensual tiene una duración de 30 días desde el
                              último pago.
                              <strong className="text-blue-900">
                                {" "}
                                Expira el{" "}
                                {new Date(
                                  planData.monthly_plan_expires_at
                                ).toLocaleDateString("es-CL", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </strong>{" "}
                              si no realizas el pago de renovación antes.
                            </p>
                          ) : (
                            <p className="text-sm text-red-700">
                              <strong>Plan expirado:</strong> Tu plan mensual{" "}
                              <strong>
                                expiró el{" "}
                                {new Date(
                                  planData.monthly_plan_expires_at
                                ).toLocaleDateString("es-CL", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </strong>
                              . Realiza el pago para reactivar tu plan y
                              continuar usando el servicio.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-yellow-700">
                          <strong>Plan sin activar:</strong> Tu plan mensual aún
                          no tiene una fecha de expiración registrada. Realiza
                          el primer pago para activar tu plan.
                        </p>
                      )}
                    </div>
                  </div>

                  {needsPayment && (
                    <Alert className="border-red-500 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>Pago requerido:</strong> Tu plan mensual ha
                        expirado o no has realizado el pago. Realiza el pago
                        para continuar usando el servicio.
                      </AlertDescription>
                    </Alert>
                  )}

                  {needsPayment && (
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      size="lg"
                      onClick={handleMonthlyPayment}
                      disabled={processingPayment}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pagar Plan Mensual - $
                          {MONTHLY_PLAN_PRICE.toLocaleString("es-CL")} CLP
                        </>
                      )}
                    </Button>
                  )}

                  {isMonthlyPlanActive() && (
                    <>
                      {!renewalCheck.canRenew ? (
                        <Alert className="border-yellow-500 bg-yellow-50">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Renovación no disponible aún:</strong>{" "}
                            {renewalCheck.reason}
                            {renewalCheck.daysUntilRenewal !== undefined && (
                              <span className="block mt-1">
                                Podrás renovar en{" "}
                                {renewalCheck.daysUntilRenewal}{" "}
                                {renewalCheck.daysUntilRenewal === 1
                                  ? "día"
                                  : "días"}
                                .
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Button
                          className="w-full bg-teal-600 hover:bg-teal-700"
                          size="lg"
                          onClick={handleMonthlyPayment}
                          disabled={processingPayment}
                          variant="outline"
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Renovar Plan Mensual - $
                              {MONTHLY_PLAN_PRICE.toLocaleString("es-CL")} CLP
                            </>
                          )}
                        </Button>
                      )}
                      {renewalCheck.canRenew && renewalCheck.reason && (
                        <p className="text-sm text-gray-600 mt-2 text-center">
                          {renewalCheck.reason}
                        </p>
                      )}
                    </>
                  )}

                  {isMonthlyPlanActive() &&
                    daysRemaining !== null &&
                    daysRemaining <= 7 &&
                    daysRemaining > 5 && (
                      <Alert className="border-yellow-500 bg-yellow-50">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          <strong>Renovación próxima:</strong> Tu plan expira en{" "}
                          {daysRemaining} días. Podrás renovar cuando falten 5
                          días o menos.
                          {renewalCheck.daysUntilRenewal !== undefined && (
                            <span className="block mt-1">
                              Podrás renovar en {renewalCheck.daysUntilRenewal}{" "}
                              {renewalCheck.daysUntilRenewal === 1
                                ? "día"
                                : "días"}
                              .
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  {isMonthlyPlanActive() &&
                    daysRemaining !== null &&
                    daysRemaining <= 5 &&
                    daysRemaining > 0 && (
                      <Alert className="border-blue-500 bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <strong>Renovación disponible:</strong> Tu plan expira
                          en {daysRemaining} días. Puedes renovarlo ahora y se
                          extenderá por 30 días desde la fecha de expiración
                          actual.
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
              )}

              {planData.plan_type === "commission" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Información del Plan
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Plan de Comisión:</strong> Pagas un porcentaje (10%)
                    por cada cita realizada.
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    No necesitas realizar pagos mensuales. Las comisiones se
                    calculan automáticamente y se transfieren semanalmente
                    (segundo día hábil).
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Duración:</strong> Este plan es permanente y no
                    requiere renovación. Pagarás solo cuando realices citas con
                    pacientes.
                  </p>
                </div>
              )}

              {/* Botón para cambiar al otro plan */}
              {(() => {
                const otherPlan = availablePlans.find(
                  (p) => p.id !== planData.plan_type
                );
                if (!otherPlan) return null;

                return (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          ¿Quieres cambiar a {otherPlan.name}?
                        </h4>
                        <p className="text-sm text-gray-600">
                          {otherPlan.description}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          {otherPlan.price} / {otherPlan.period}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handlePlanSelection(otherPlan.id)}
                        disabled={updatingPlan || processingPayment}
                        className="ml-4"
                      >
                        {updatingPlan || processingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : otherPlan.id === "monthly" ? (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Cambiar y Pagar
                          </>
                        ) : (
                          "Cambiar Plan"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Información de renovación */}
          {planData.plan_type === "monthly" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  {planData.monthly_plan_expires_at
                    ? isMonthlyPlanActive()
                      ? "Renovación del Plan"
                      : "Estado del Plan"
                    : "Estado del Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planData.monthly_plan_expires_at ? (
                  <>
                    {isMonthlyPlanActive() ? (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Tu plan mensual se renueva automáticamente cada mes si
                          no cancelas antes del último día.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-700">
                            <strong>Expira el:</strong>{" "}
                            {new Date(
                              planData.monthly_plan_expires_at
                            ).toLocaleDateString("es-CL", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                            {daysRemaining !== null && daysRemaining > 0 && (
                              <span className="ml-2 text-blue-600 font-medium">
                                ({daysRemaining}{" "}
                                {daysRemaining === 1
                                  ? "día restante"
                                  : "días restantes"}
                                )
                              </span>
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-red-600 mb-4 font-medium">
                          ⚠️ Tu plan mensual ha expirado. Realiza el pago para
                          continuar usando el servicio.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-red-500" />
                          <span className="text-gray-700">
                            <strong>Expiró el:</strong>{" "}
                            <span className="text-red-600 font-semibold">
                              {new Date(
                                planData.monthly_plan_expires_at
                              ).toLocaleDateString("es-CL", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-yellow-600 mb-4 font-medium">
                      ⚠️ Tu plan mensual aún no tiene una fecha de expiración
                      registrada.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-700">
                        <strong>Estado:</strong>{" "}
                        <span className="text-yellow-700 font-semibold">
                          Sin fecha de expiración - Realiza el primer pago para
                          activar
                        </span>
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!planData?.plan_type && (
        <Card>
          <CardHeader>
            <CardTitle>Selecciona tu Plan</CardTitle>
            <CardDescription>
              Elige el plan que mejor se adapte a tus necesidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {availablePlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {plan.description}
                          </CardDescription>
                        </div>
                        <div className="text-center sm:text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-primary">
                            {plan.price}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            /{plan.period}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.note && (
                      <p className="text-xs text-muted-foreground mb-4 italic">
                        {plan.note}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelection(plan.id);
                      }}
                      disabled={updatingPlan || processingPayment}
                    >
                      {updatingPlan || processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : plan.id === "monthly" ? (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Seleccionar y Pagar
                        </>
                      ) : (
                        "Seleccionar Plan"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedPlan && (
              <Alert className="mt-4">
                <AlertDescription>
                  {selectedPlan === "monthly" ? (
                    <>
                      <strong>Plan Mensual seleccionado:</strong> Al continuar,
                      serás redirigido a WebPay para realizar el pago de $
                      {MONTHLY_PLAN_PRICE.toLocaleString("es-CL")} CLP.
                    </>
                  ) : (
                    <>
                      <strong>Plan Light seleccionado:</strong> Este plan se
                      activará inmediatamente. Pagarás un 10% de comisión por
                      cada sesión realizada.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
