"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseTyped } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PersonalDataFormData,
  formatRUT,
  formatPhone,
} from "@/lib/validations/professional-signup";
import { AlertCircle, X, Mail, Calendar, Loader2 } from "lucide-react";

interface PersonalDataStepProps {
  data: PersonalDataFormData;
  onChange: (data: PersonalDataFormData) => void;
  errors: Record<string, string>;
  onNext: () => void;
  isCheckingRequest?: boolean;
  pendingRequestMessage?: {
    show: boolean;
    type?: "pending_request" | "existing_user_rut" | "existing_user_email";
    email?: string;
    created_at?: string;
    userRut?: string;
  };
  onDismissMessage?: () => void;
}

export default function PersonalDataStep({
  data,
  onChange,
  errors,
  onNext,
  isCheckingRequest = false,
  pendingRequestMessage = { show: false },
  onDismissMessage,
}: PersonalDataStepProps) {
  // Solo bloquear el botón cuando hay solicitud pendiente en revisión.
  // Para "Usuario Ya Registrado" permitir retentar tras cambiar email o RUT.
  const blockContinue =
    pendingRequestMessage.show && pendingRequestMessage.type === "pending_request";
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string; region_id: number }[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data, error } = await supabaseTyped
          .from("regions")
          .select("id, name")
          .order("name");
        if (!error) setRegions((data || []) as { id: number; name: string }[]);
      } catch {
        setRegions([]);
      } finally {
        setIsLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (!data.region || data.region <= 0) {
      setMunicipalities([]);
      return;
    }
    const fetchMunicipalities = async () => {
      setIsLoadingMunicipalities(true);
      try {
        const { data: muniData, error } = await supabaseTyped
          .from("municipalities")
          .select("id, name, region_id")
          .eq("region_id", data.region)
          .order("name");
        if (!error) setMunicipalities((muniData || []) as { id: number; name: string; region_id: number }[]);
        else setMunicipalities([]);
      } catch {
        setMunicipalities([]);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };
    fetchMunicipalities();
  }, [data.region]);

  const handleInputChange = (
    field: keyof PersonalDataFormData,
    value: string | number
  ) => {
    if (field === "region" || field === "municipality") {
      const numValue = typeof value === "string" ? parseInt(value, 10) : value;
      const update: Partial<PersonalDataFormData> = { ...data, [field]: numValue || 0 };
      if (field === "region") {
        (update as Partial<PersonalDataFormData>).municipality = 0;
      }
      onChange(update as PersonalDataFormData);
      return;
    }

    let formattedValue = value as string;

    if (field === "rut" || field === "email") {
      if (field === "rut") {
        formattedValue = formatRUT(value as string);
      }
      if (onDismissMessage && pendingRequestMessage.show) {
        onDismissMessage();
      }
    } else if (field === "phone_number") {
      formattedValue = formatPhone(value as string);
    }

    onChange({
      ...data,
      [field]: formattedValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(); // Siempre llamar onNext, la validación se maneja en el padre
  };

  return (
    <Card className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <CardHeader>
        <CardTitle className="text-xl">Datos Personales</CardTitle>
        <CardDescription>
          Completa tu información personal básica. Todos los campos marcados con
          * son obligatorios.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Consejo:</strong> Asegúrate de que todos los datos sean
            correctos, ya que serán verificados durante el proceso de
            aprobación.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input
                  id="first_name"
                  value={data.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Juan Carlos"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name_p">Apellido Paterno *</Label>
                <Input
                  id="last_name_p"
                  value={data.last_name_p}
                  onChange={(e) =>
                    handleInputChange("last_name_p", e.target.value)
                  }
                  placeholder="Pérez"
                />
                {errors.last_name_p && (
                  <p className="text-sm text-red-600">{errors.last_name_p}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name_m">Apellido Materno *</Label>
                <Input
                  id="last_name_m"
                  value={data.last_name_m}
                  onChange={(e) =>
                    handleInputChange("last_name_m", e.target.value)
                  }
                  placeholder="González"
                />
                {errors.last_name_m && (
                  <p className="text-sm text-red-600">{errors.last_name_m}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={data.rut}
                onChange={(e) => handleInputChange("rut", e.target.value)}
                placeholder="12.345.678-9"
              />
              {errors.rut && (
                <p className="text-sm text-red-600">{errors.rut}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
              <Input
                id="birth_date"
                type="date"
                value={data.birth_date}
                onChange={(e) =>
                  handleInputChange("birth_date", e.target.value)
                }
              />
              {errors.birth_date && (
                <p className="text-sm text-red-600">{errors.birth_date}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="ejemplo@dominio.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone_number">Número de Teléfono *</Label>
              <Input
                id="phone_number"
                value={data.phone_number}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
                placeholder="+56912345678"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="region">Región *</Label>
                <select
                  id="region"
                  value={data.region && data.region > 0 ? data.region : ""}
                  onChange={(e) => handleInputChange("region", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecciona una región</option>
                  {isLoadingRegions ? (
                    <option disabled>Cargando regiones...</option>
                  ) : (
                    regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.region && (
                  <p className="text-sm text-red-600">{errors.region}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="municipality">Comuna *</Label>
                <select
                  id="municipality"
                  value={data.municipality && data.municipality > 0 ? data.municipality : ""}
                  onChange={(e) => handleInputChange("municipality", e.target.value)}
                  disabled={!data.region || data.region <= 0}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {!data.region || data.region <= 0
                      ? "Primero selecciona una región"
                      : isLoadingMunicipalities
                        ? "Cargando comunas..."
                        : "Selecciona una comuna"}
                  </option>
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.municipality && (
                  <p className="text-sm text-red-600">{errors.municipality}</p>
                )}
              </div>
            </div>

            {/* Mensaje de solicitud pendiente o usuario existente */}
            {pendingRequestMessage.show && (() => {
              const maskEmail = (email: string) => {
                const [localPart, domain] = email.split("@");
                if (!localPart) return email;
                
                if (localPart.length > 6) {
                  const firstThree = localPart.substring(0, 3);
                  const lastThree = localPart.substring(localPart.length - 3);
                  const masked = "*".repeat(Math.max(3, localPart.length - 6));
                  return `${firstThree}${masked}${lastThree}@${domain}`;
                } else if (localPart.length > 2) {
                  const first = localPart[0];
                  const last = localPart[localPart.length - 1];
                  return `${first}${"*".repeat(Math.max(2, localPart.length - 2))}${last}@${domain}`;
                }
                return `${localPart[0]}***@${domain}`;
              };

              const maskRut = (rut: string) => {
                if (!rut) return rut;
                
                // Remover puntos y guiones, y separar el dígito verificador
                const cleanRut = rut.replace(/\./g, "").replace(/-/g, "");
                // El último carácter puede ser un dígito verificador (número o K)
                const rutWithoutDV = cleanRut.slice(0, -1);
                const lastFour = rutWithoutDV.slice(-4);
                
                if (rutWithoutDV.length <= 4) {
                  // Si el RUT es muy corto, mostrar solo los últimos 4 o menos
                  return lastFour;
                }
                
                // Contar cuántos caracteres hay antes de los últimos 4
                const beforeLastFour = rutWithoutDV.length - 4;
                
                // Si el RUT original tenía formato con puntos, mantener estructura similar
                const hasDots = rut.includes(".");
                if (hasDots) {
                  // Formato chileno típico: XX.XXX.XXX-X
                  // Ejemplo: 19.123.123-2 → XX.XX3.123
                  // Los últimos 4 dígitos se muestran como: X.XXX (con punto después del primer dígito)
                  const masked = "X".repeat(beforeLastFour);
                  
                  // Dividir los últimos 4 en formato: X.XXX
                  const lastFourFormatted = `${lastFour.slice(0, 1)}.${lastFour.slice(1)}`;
                  
                  // Dividir los X's en grupos de 2 y el resto
                  if (beforeLastFour >= 4) {
                    // Si hay 4 o más X's, agrupar como XX.XX
                    const firstGroup = masked.slice(0, 2);
                    const secondGroup = masked.slice(2, 4);
                    const remaining = masked.slice(4);
                    if (remaining) {
                      return `${firstGroup}.${secondGroup}${remaining}.${lastFourFormatted}`;
                    }
                    return `${firstGroup}.${secondGroup}.${lastFourFormatted}`;
                  } else if (beforeLastFour >= 2) {
                    // Si hay 2-3 X's, agrupar como XX.X o XX
                    const firstGroup = masked.slice(0, 2);
                    const secondGroup = masked.slice(2);
                    if (secondGroup) {
                      return `${firstGroup}.${secondGroup}.${lastFourFormatted}`;
                    }
                    return `${firstGroup}.${lastFourFormatted}`;
                  } else {
                    // Si hay solo 1 X
                    return `X.${lastFourFormatted}`;
                  }
                } else {
                  // Sin formato, solo mostrar X's y últimos 4 dígitos
                  const masked = "X".repeat(beforeLastFour);
                  return `${masked}${lastFour}`;
                }
              };

              // Mensaje para solicitud pendiente
              if (pendingRequestMessage.type === "pending_request") {
                return (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-900 mb-2">
                          Solicitud en Revisión
                        </h3>
                        <p className="text-amber-800 mb-4">
                          Ya existe una solicitud de registro profesional en revisión por los administradores para este RUT.
                        </p>
                        <div className="bg-white/60 rounded-lg p-4 space-y-2 mb-4">
                          {pendingRequestMessage.email && (
                            <div className="flex items-center gap-2 text-sm text-amber-900">
                              <Mail className="w-4 h-4" />
                              <span>
                                <strong>Email asociado:</strong> {maskEmail(pendingRequestMessage.email)}
                              </span>
                            </div>
                          )}
                          {pendingRequestMessage.created_at && (
                            <div className="flex items-center gap-2 text-sm text-amber-900">
                              <Calendar className="w-4 h-4" />
                              <span>
                                <strong>Fecha de solicitud recibida:</strong>{" "}
                                {new Date(pendingRequestMessage.created_at).toLocaleDateString("es-CL", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                          <p className="text-sm text-amber-900 font-medium">
                            📧 Por favor, espera el correo electrónico con la resolución o respuesta de tu solicitud.
                          </p>
                          <p className="text-xs text-amber-800 mt-2">
                            Nuestro equipo administrativo está revisando tu solicitud. Te notificaremos por correo cuando sea procesada.
                          </p>
                        </div>
                        {onDismissMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onDismissMessage}
                            className="mt-4 w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            Entendido
                          </Button>
                        )}
                      </div>
                      {onDismissMessage && (
                        <button
                          type="button"
                          onClick={onDismissMessage}
                          className="flex-shrink-0 text-amber-600 hover:text-amber-800 transition-colors"
                          aria-label="Cerrar mensaje"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              // Mensaje para usuario existente por RUT
              if (pendingRequestMessage.type === "existing_user_rut") {
                return (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-900">Usuario Ya Registrado</p>
                      <p className="text-sm text-red-800 mt-1">
                        Ya existe un usuario con este RUT. Si ya tienes cuenta, inicia sesión. Para registrarte con otro correo o RUT, modifica los datos y haz clic en Continuar.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {onDismissMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onDismissMessage}
                            className="border-red-300 text-red-700 hover:bg-red-100 h-8 text-xs"
                          >
                            Entendido
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => window.location.href = "/login"}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                        >
                          Iniciar Sesión
                        </Button>
                      </div>
                    </div>
                    {onDismissMessage && (
                      <button
                        type="button"
                        onClick={onDismissMessage}
                        className="flex-shrink-0 text-red-600 hover:text-red-800"
                        aria-label="Cerrar mensaje"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              }

              // Mensaje para usuario existente por email
              if (pendingRequestMessage.type === "existing_user_email") {
                return (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-900">Usuario Ya Registrado</p>
                      <p className="text-sm text-red-800 mt-1">
                        Ya existe un usuario con este correo. Si ya tienes cuenta, inicia sesión. Para registrarte con otro correo o RUT, modifica los datos y haz clic en Continuar.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {onDismissMessage && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onDismissMessage}
                            className="border-red-300 text-red-700 hover:bg-red-100 h-8 text-xs"
                          >
                            Entendido
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => window.location.href = "/login"}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                        >
                          Iniciar Sesión
                        </Button>
                      </div>
                    </div>
                    {onDismissMessage && (
                      <button
                        type="button"
                        onClick={onDismissMessage}
                        className="flex-shrink-0 text-red-600 hover:text-red-800"
                        aria-label="Cerrar mensaje"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              }

              return null;
            })()}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isCheckingRequest || blockContinue}
            >
              {isCheckingRequest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
