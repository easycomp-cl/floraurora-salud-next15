"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentPlanFormData } from "@/lib/validations/professional-signup";
import Link from "next/link";

interface PaymentPlanStepProps {
  data: PaymentPlanFormData;
  onChange: (data: PaymentPlanFormData) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
}

interface PlanInfo {
  id: "light" | "monthly";
  name: string;
  price: string;
  period: string;
  features: string[];
  description: string;
  note?: string;
  isPromotional?: boolean;
  normalPrice?: number;
}

export default function PaymentPlanStep({
  data,
  onChange,
  errors,
  onNext,
  onPrevious,
}: PaymentPlanStepProps) {
  const [paymentPlans, setPaymentPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPricing = async () => {
      try {
        // Cargar precios desde la API
        const response = await fetch("/api/plans/pricing", {
          cache: "no-store",
          credentials: "include", // Incluir cookies si están disponibles
        });

        let config = {
          premiumNormalPrice: 39990,
          premiumPromotionPrice: 39990,
          premiumPromotionMonths: 0,
          lightCommissionPercentage: 15,
          premiumExtraSessionCommissionPercentage: 1.6,
        };
        let premiumPrice = 39990;
        let isPromotional = false;

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.pricing) {
            const pricing = result.pricing;
            config = {
              premiumNormalPrice: pricing.premiumNormalPrice,
              premiumPromotionPrice: pricing.premiumPromotionPrice,
              premiumPromotionMonths: pricing.premiumPromotionMonths || 0,
              lightCommissionPercentage: pricing.lightCommissionPercentage,
              premiumExtraSessionCommissionPercentage: pricing.premiumExtraSessionCommissionPercentage || 1.6,
            };
            premiumPrice = pricing.premiumCurrentPrice;
            isPromotional = pricing.isPromotional || false;
          }
        }

        const plans: PlanInfo[] = [
          {
            id: "light",
            name: "Plan Light",
            price: `${config.lightCommissionPercentage.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`,
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
            id: "monthly",
            name: "Plan Premium",
            price: `$${premiumPrice.toLocaleString("es-CL")}`,
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
              isPromotional && config.premiumPromotionMonths > 0 && premiumPrice < config.premiumNormalPrice
                ? `Precio promocional por ${config.premiumPromotionMonths} meses. Incluye todos los servicios de la aplicación`
                : "Incluye todos los servicios de la aplicación",
            note: `Renovación automática mes a mes si no se avisa retiro hasta el último día del mes. Además, se aplica un ${config.premiumExtraSessionCommissionPercentage.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}% de comisión por cada sesión extra realizada.`,
            isPromotional: isPromotional && config.premiumPromotionMonths > 0 && premiumPrice < config.premiumNormalPrice,
            normalPrice: config.premiumNormalPrice,
          },
        ];

        setPaymentPlans(plans);
      } catch (error) {
        console.error("Error cargando precios:", error);
        // Valores por defecto en caso de error
        setPaymentPlans([
          {
            id: "light",
            name: "Plan Light",
            price: "15%",
            period: "por sesión",
            features: [],
            description: "",
          },
          {
            id: "monthly",
            name: "Plan Premium",
            price: "$24.990",
            period: "mensual",
            features: [],
            description: "",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPricing();
  }, []);

  const handlePlanChange = (planType: "light" | "monthly") => {
    onChange({
      ...data,
      plan_type: planType,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(); // Siempre llamar onNext, la validación se maneja en el padre
  };

  return (
    <Card className="mx-auto max-w-4xl lg:max-w-6xl xl:max-w-7xl">
      <CardHeader>
        <CardTitle className="text-xl">Selecciona tu Plan de Pago</CardTitle>
        <CardDescription>
          Elige el plan que mejor se adapte a tus necesidades profesionales. El
          pago se realizará después de la aprobación y validación de tus
          documentos.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Información importante:</strong> Los valores de las
            prestaciones serán designados por cada profesional dentro de un
            rango entre $21.000 - $50.000. Puedes cambiar de plan después de
            registrarte.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando planes...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:gap-12">
            {/* Servicios Incluidos */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">
                Servicios Incluidos en Ambos Planes
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">📅</span>
                      <span>
                        <strong>Agendamiento online</strong> - Sistema completo
                        de reservas
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">📧</span>
                      <span>
                        <strong>Aviso automático</strong> - Confirmación y
                        recordatorios
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">📋</span>
                      <span>
                        <strong>Ficha virtual</strong> - Historial completo del
                        paciente
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">🧾</span>
                      <span>
                        <strong>Boleta SII</strong> - Emisión automática
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">🌟</span>
                      <span>
                        <strong>Visualización web</strong> - Publicidad en
                        página principal
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">📹</span>
                      <span>
                        <strong>Videollamada</strong> - Google Meet integrado
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">💳</span>
                      <span>
                        <strong>Recepción pagos</strong> - Cobro automático a
                        pacientes
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-blue-500 mr-2">💰</span>
                      <span>
                        <strong>Transferencias</strong> - Segundo día hábil
                        semanal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selección de Plan */}
            <div className="grid gap-4">
              <h3 className="text-lg font-semibold">Planes Disponibles</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {paymentPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      data.plan_type === plan.id
                        ? "ring-2 ring-primary border-primary"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {plan.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {plan.description}
                            </CardDescription>
                          </div>
                          <div className="text-center sm:text-right flex-shrink-0">
                            {plan.isPromotional && plan.normalPrice ? (
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-lg font-bold text-muted-foreground line-through">
                                    ${plan.normalPrice.toLocaleString("es-CL")}
                                  </span>
                                  <span className="text-2xl font-bold text-primary">
                                    {plan.price}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  /{plan.period}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="text-2xl font-bold text-primary">
                                  {plan.price}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  /{plan.period}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <span className="text-green-500 mr-2">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.note && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800">
                            <strong>ℹ️ Nota:</strong> {plan.note}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {errors.plan_type && (
                <p className="text-sm text-red-600">{errors.plan_type}</p>
              )}
            </div>

            {/* Resumen */}
            {data.plan_type && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">
                    Resumen de tu selección:
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex-1">
                      <span className="text-sm">
                        {
                          paymentPlans.find((p) => p.id === data.plan_type)
                            ?.name
                        }
                      </span>
                    </div>
                    <div className="text-center sm:text-right">
                      {(() => {
                        const selectedPlan = paymentPlans.find((p) => p.id === data.plan_type);
                        if (!selectedPlan) return null;
                        
                        if (selectedPlan.isPromotional && selectedPlan.normalPrice) {
                          return (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-muted-foreground line-through">
                                ${selectedPlan.normalPrice.toLocaleString("es-CL")}
                              </span>
                              <span className="font-bold text-primary text-lg">
                                {selectedPlan.price}
                                <span className="text-sm font-normal text-muted-foreground">
                                  {data.plan_type === "light" ? " por sesión" : "/mes"}
                                </span>
                              </span>
                            </div>
                          );
                        }
                        
                        return (
                          <span className="font-bold text-primary text-lg">
                            {selectedPlan.price}
                            <span className="text-sm font-normal text-muted-foreground">
                              {data.plan_type === "light" ? " por sesión" : "/mes"}
                            </span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>📋 Proceso:</strong> El pago se realizará después
                      de la aprobación y validación de tus documentos por parte
                      de nuestro equipo administrativo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkbox de Términos y Condiciones */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="accept_terms"
                  checked={data.accept_terms}
                  onChange={(e) =>
                    onChange({ ...data, accept_terms: e.target.checked })
                  }
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor="accept_terms"
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    He leído y acepto los{" "}
                    <Link
                      href="/terms?type=professional"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline font-medium"
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    de FlorAurora Salud
                  </label>
                  {errors.accept_terms && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.accept_terms}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📋 Información importante:</strong> Al aceptar los
                  términos y condiciones, confirmas que has leído y comprendido
                  las condiciones de uso de la plataforma, incluyendo las
                  modalidades de pago, responsabilidades y el tratamiento de
                  datos personales.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex-1"
              >
                Anterior
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!data.plan_type || !data.accept_terms}
              >
                Continuar con el Registro
              </Button>
            </div>
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  );
}
