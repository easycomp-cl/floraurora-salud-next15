"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Bell,
  Shield,
  Settings,
  DollarSign,
  Cog,
  Check,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { clientGetUser } from "@/lib/client-auth";

interface SystemConfiguration {
  id: number;
  config_key: string;
  config_value: string;
  description: string | null;
  data_type: "string" | "number" | "boolean" | "json";
  category: string;
  is_active: boolean;
  value: string | number | boolean;
}

const categoryLabels: Record<string, string> = {
  appointments: "Citas",
  notifications: "Notificaciones",
  security: "Seguridad",
  system: "Sistema",
  general: "General",
  pricing: "Precios",
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  appointments: Calendar,
  notifications: Bell,
  security: Shield,
  system: Settings,
  general: Cog,
  pricing: DollarSign,
};

export default function SystemSettingsPanel() {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingConfigs, setSavingConfigs] = useState<Set<number>>(new Set());
  const [savedConfigs, setSavedConfigs] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [originalValues, setOriginalValues] = useState<Map<number, string | number | boolean>>(new Map());
  const savedTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const [hourValidationErrors, setHourValidationErrors] = useState<Map<number, string>>(new Map());

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener el usuario actual para incluir el header X-User-ID
      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const response = await fetch("/api/admin/system-configurations", {
        cache: "no-store",
        credentials: "include", // Incluir cookies para autenticación
        headers: {
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener la configuración");
      }
      const data = (await response.json()) as SystemConfiguration[];
      setConfigurations(data);
      
      // Guardar valores originales para detectar cambios
      const originalMap = new Map<number, string | number | boolean>();
      data.forEach((config) => {
        originalMap.set(config.id, config.value);
      });
      setOriginalValues(originalMap);
      setSavedConfigs(new Set(data.map((c) => c.id)));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar la configuración.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations();
    
    // Cleanup de timeouts al desmontar
    // Copiar el ref a una variable local para evitar problemas con el cleanup
    const timeoutsRef = savedTimeoutsRef;
    return () => {
      const timeouts = timeoutsRef.current;
      if (timeouts) {
        timeouts.forEach((timeout) => {
          clearTimeout(timeout);
        });
        timeouts.clear();
      }
    };
  }, []);

  const handleConfigChange = (id: number, newValue: string | number | boolean) => {
    const config = configurations.find((c) => c.id === id);
    if (!config) return;

    // Validar horas si es una configuración de hora
    if (config.config_key.includes("hour") && typeof newValue === "string") {
      const otherHourConfig = configurations.find(
        (c) =>
          c.config_key.includes("hour") &&
          c.id !== id &&
          c.category === config.category
      );

      if (otherHourConfig) {
        // Convertir horas a minutos para comparar
        const parseHour = (hourValue: string | number | boolean): number => {
          const hourStr = String(hourValue || "");
          if (!hourStr.includes(":")) {
            return 0;
          }
          const [hours] = hourStr.split(":").map(Number);
          return isNaN(hours) ? 0 : hours;
        };

        // Obtener valores actuales (convertir a string si es necesario)
        const startHourValue = config.config_key === "schedule_start_hour" 
          ? newValue 
          : String(otherHourConfig.value || "");
        const endHourValue = config.config_key === "schedule_end_hour" 
          ? newValue 
          : String(otherHourConfig.value || "");

        const startHour = parseHour(startHourValue);
        const endHour = parseHour(endHourValue);

        // Validar que la hora final no sea menor que la inicial
        if (endHour < startHour) {
          const errorMessage = "La hora final debe ser mayor o igual a la hora inicial";
          const endHourConfigId = config.config_key === "schedule_end_hour" ? id : otherHourConfig.id;
          
          // Marcar error en la hora final (siempre marcar el error para que se muestre)
          setHourValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.set(endHourConfigId, errorMessage);
            return newMap;
          });
          
          // Continuar actualizando el estado para que el mensaje de error se muestre
          // El guardado se bloqueará en handleSaveConfig
        } else {
          // Limpiar errores si la validación pasa
          setHourValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.delete(id);
            if (otherHourConfig) {
              newMap.delete(otherHourConfig.id);
            }
            return newMap;
          });
          // Limpiar error general si existe
          setError(null);
        }
      }
    }

    setConfigurations((prev) =>
      prev.map((config) =>
        config.id === id
          ? {
              ...config,
              value: newValue,
              config_value:
                typeof newValue === "boolean"
                  ? newValue.toString()
                  : String(newValue),
            }
          : config
      )
    );
  };

  const handleToggleActive = async (id: number) => {
    const config = configurations.find((c) => c.id === id);
    if (!config) return;

    const newActiveState = !config.is_active;
    
    // Guardar en BD primero
    await saveConfiguration(id, config.config_value, newActiveState);
    
    // El estado se actualizará automáticamente cuando saveConfiguration termine
  };

  const hasChanges = (config: SystemConfiguration): boolean => {
    const original = originalValues.get(config.id);
    return original !== undefined && original !== config.value;
  };

  const saveConfiguration = async (
    id: number,
    configValue: string,
    isActive?: boolean
  ) => {
    try {
      setSavingConfigs((prev) => new Set(prev).add(id));
      setError(null);

      // Obtener el usuario actual para incluir el header X-User-ID
      const { user } = await clientGetUser();
      if (!user) {
        throw new Error("No autenticado");
      }

      const updateData: { config_value: string; is_active?: boolean } = {
        config_value: configValue,
      };

      if (isActive !== undefined) {
        updateData.is_active = isActive;
      }

      const response = await fetch(`/api/admin/system-configurations/${id}`, {
        method: "PATCH",
        credentials: "include", // Incluir cookies para autenticación
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Enviar user_id en header como respaldo
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo guardar la configuración");
      }

      const updatedConfig = (await response.json()) as SystemConfiguration;
      
      // Limpiar timeout anterior si existe
      const existingTimeout = savedTimeoutsRef.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        savedTimeoutsRef.current.delete(id);
      }

      // Actualizar valor original PRIMERO para evitar que se detecten cambios falsos
      setOriginalValues((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, updatedConfig.value);
        return newMap;
      });

      // Actualizar la configuración en el estado
      setConfigurations((prev) =>
        prev.map((c) => (c.id === id ? updatedConfig : c))
      );

      // Mostrar indicador de guardado exitoso DESPUÉS de actualizar la configuración
      // Usar requestAnimationFrame para asegurar que se ejecute después del render
      requestAnimationFrame(() => {
        setSavedConfigs((prev) => {
          const newSet = new Set(prev);
          newSet.add(id);
          return newSet;
        });
        
        // Mantener el indicador verde por más tiempo
        const timeout = setTimeout(() => {
          setSavedConfigs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
          savedTimeoutsRef.current.delete(id);
        }, 3000);
        
        savedTimeoutsRef.current.set(id, timeout);
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la configuración";
      setError(message);
      
      // Revertir cambios en caso de error
      await loadConfigurations();
    } finally {
      setSavingConfigs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSaveConfig = async (config: SystemConfiguration) => {
    // Validar horas antes de guardar
    if (config.config_key.includes("hour")) {
      const otherHourConfig = configurations.find(
        (c) =>
          c.config_key.includes("hour") &&
          c.id !== config.id &&
          c.category === config.category
      );

      if (otherHourConfig) {
        const parseHour = (hourValue: string | number | boolean): number => {
          const hourStr = String(hourValue || "");
          if (!hourStr.includes(":")) {
            return 0;
          }
          const [hours] = hourStr.split(":").map(Number);
          return isNaN(hours) ? 0 : hours;
        };

        // Obtener los valores actuales (usar el valor del estado actualizado)
        const startHourConfig = config.config_key === "schedule_start_hour" ? config : otherHourConfig;
        const endHourConfig = config.config_key === "schedule_end_hour" ? config : otherHourConfig;

        const startHour = parseHour(startHourConfig.value);
        const endHour = parseHour(endHourConfig.value);

        // Solo bloquear el guardado de la hora final si es menor que la inicial
        // Permitir guardar la hora inicial incluso si hace que la final sea inválida
        if (config.config_key === "schedule_end_hour" && endHour < startHour) {
          const errorMessage = "La hora final debe ser mayor o igual a la hora inicial";
          setError(errorMessage);
          // Marcar el error en el mapa para que se muestre en la UI
          setHourValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.set(config.id, errorMessage);
            return newMap;
          });
          return;
        }

        // Si estamos guardando la hora inicial y hace que la final sea inválida,
        // marcar el error en la final pero permitir guardar la inicial
        if (config.config_key === "schedule_start_hour" && endHour < startHour) {
          const errorMessage = "La hora final debe ser mayor o igual a la hora inicial";
          setHourValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.set(otherHourConfig.id, errorMessage);
            return newMap;
          });
          // Continuar guardando la hora inicial
        } else {
          // Limpiar errores si la validación pasa
          setHourValidationErrors((prev) => {
            const newMap = new Map(prev);
            newMap.delete(config.id);
            if (otherHourConfig) {
              newMap.delete(otherHourConfig.id);
            }
            return newMap;
          });
          setError(null);
        }
      }
    }

    await saveConfiguration(config.id, config.config_value, config.is_active);
  };

  // Agrupar configuraciones por categoría y ordenar horas
  const configurationsByCategory = configurations.reduce(
    (acc, config) => {
      const category = config.category || "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(config);
      return acc;
    },
    {} as Record<string, SystemConfiguration[]>
  );

  // Ordenar configuraciones dentro de cada categoría: hora inicial antes de hora final
  Object.keys(configurationsByCategory).forEach((category) => {
    configurationsByCategory[category].sort((a, b) => {
      // Si ambos son horas, ordenar: start_hour antes de end_hour
      if (a.config_key.includes("hour") && b.config_key.includes("hour")) {
        if (a.config_key === "schedule_start_hour" && b.config_key === "schedule_end_hour") {
          return -1;
        }
        if (a.config_key === "schedule_end_hour" && b.config_key === "schedule_start_hour") {
          return 1;
        }
      }
      return 0;
    });
  });

  const categories = Object.keys(configurationsByCategory).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Configuración general
        </CardTitle>
        <CardDescription>
          Ajusta las configuraciones del sistema organizadas por categorías.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando configuraciones...</p>
            </div>
          </div>
        ) : (
          <>
            {categories.map((category) => {
              const IconComponent = categoryIcons[category] || Settings;
              const categoryLabel = categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1);
              
              return (
                <section key={category} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {categoryLabel}
                  </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {configurationsByCategory[category].map((config) => {
                    const isSaving = savingConfigs.has(config.id);
                    const isSaved = savedConfigs.has(config.id);
                    const hasUnsavedChanges = hasChanges(config);
                    
                    // Determinar el estilo del borde basado en el estado
                    let borderStyle = "border-gray-200";
                    let bgStyle = "";
                    
                    if (isSaving) {
                      borderStyle = "border-blue-300";
                      bgStyle = "bg-blue-50/30";
                    } else if (isSaved) {
                      borderStyle = "border-green-300";
                      bgStyle = "bg-green-50/50";
                    } else if (hasUnsavedChanges) {
                      borderStyle = "border-yellow-300";
                      bgStyle = "bg-yellow-50/50";
                    }
                    
                    return (
                      <Card
                        key={config.id}
                        className={`transition-all duration-300 ${borderStyle} ${bgStyle}`}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2 min-w-0">
                              <Label
                                htmlFor={`config-${config.id}`}
                                className="text-sm font-semibold text-gray-900 block"
                              >
                                {config.description ||
                                  config.config_key.replace(/_/g, " ")}
                              </Label>

                              {config.data_type === "boolean" ? (
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={config.value === true}
                                      onChange={(e) =>
                                        handleConfigChange(config.id, e.target.checked)
                                      }
                                      disabled={isLoading || isSaving || !config.is_active}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                                    />
                                    <span
                                      className={`text-sm font-medium ${
                                        !config.is_active
                                          ? "text-gray-400"
                                          : config.value === true
                                          ? "text-green-600"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {config.value === true
                                        ? "Habilitado"
                                        : "Deshabilitado"}
                                    </span>
                                  </label>
                                </div>
                              ) : config.data_type === "number" ? (
                                <div className="space-y-2">
                                  <Input
                                    id={`config-${config.id}`}
                                    type="number"
                                    value={config.value as number}
                                    onChange={(event) =>
                                      handleConfigChange(
                                        config.id,
                                        Number(event.target.value)
                                      )
                                    }
                                    disabled={isLoading || isSaving || !config.is_active}
                                    className={`w-full ${
                                      hasUnsavedChanges ? "border-yellow-400" : ""
                                    }`}
                                    min={config.config_key.includes("percentage") ? 0 : undefined}
                                    max={config.config_key.includes("percentage") ? 100 : undefined}
                                    step={config.config_key.includes("percentage") ? "0.1" : "1"}
                                  />
                                  {hasUnsavedChanges && (
                                    <p className="text-xs text-yellow-600">
                                      Tienes cambios sin guardar
                                    </p>
                                  )}
                                </div>
                              ) : config.config_key.includes("hour") ? (
                                <div className="space-y-2">
                                  <select
                                    id={`config-${config.id}`}
                                    value={config.value as string}
                                    onChange={(event) =>
                                      handleConfigChange(config.id, event.target.value)
                                    }
                                    disabled={isLoading || isSaving || !config.is_active}
                                    className={`w-full border rounded-md px-3 py-2 text-sm ${
                                      hourValidationErrors.has(config.id)
                                        ? "border-red-400"
                                        : hasUnsavedChanges
                                        ? "border-yellow-400"
                                        : "border-gray-300"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const hour = i.toString().padStart(2, '0');
                                      const timeValue = `${hour}:00`;
                                      return (
                                        <option key={timeValue} value={timeValue}>
                                          {hour}:00
                                        </option>
                                      );
                                    })}
                                  </select>
                                  {hourValidationErrors.has(config.id) && (
                                    <p className="text-xs text-red-600">
                                      {hourValidationErrors.get(config.id)}
                                    </p>
                                  )}
                                  {hasUnsavedChanges && !hourValidationErrors.has(config.id) && (
                                    <p className="text-xs text-yellow-600">
                                      Tienes cambios sin guardar
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Input
                                    id={`config-${config.id}`}
                                    type="text"
                                    value={config.value as string}
                                    onChange={(event) =>
                                      handleConfigChange(config.id, event.target.value)
                                    }
                                    disabled={isLoading || isSaving || !config.is_active}
                                    className={`w-full ${
                                      hasUnsavedChanges ? "border-yellow-400" : ""
                                    }`}
                                  />
                                  {hasUnsavedChanges && (
                                    <p className="text-xs text-yellow-600">
                                      Tienes cambios sin guardar
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 pt-1">
                              <div className="flex items-center gap-2">
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                ) : isSaved ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : hasUnsavedChanges ? (
                                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                ) : null}
                              </div>
                              <Button
                                size="sm"
                                variant={config.is_active ? "outline" : "default"}
                                onClick={() => handleToggleActive(config.id)}
                                disabled={isLoading || isSaving}
                                className={`text-xs h-7 px-3 ${
                                  config.is_active
                                    ? "border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                                    : ""
                                }`}
                              >
                                {config.is_active ? "Desactivar" : "Activar"}
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveConfig(config)}
                              disabled={
                                isSaving || 
                                isLoading || 
                                // Solo deshabilitar si hay un error de validación en ESTE campo específico
                                // Permitir guardar la hora inicial incluso si la final tiene error
                                (config.config_key === "schedule_end_hour" && hourValidationErrors.has(config.id))
                              }
                              className="flex-1"
                              variant={hasUnsavedChanges ? "default" : "outline"}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Guardando...
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3 mr-2" />
                                  Guardar
                                </>
                              )}
                            </Button>
                          </div>

                          <div className="pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Clave:</span>{" "}
                              <code className="text-xs bg-gray-200 px-1.5 py-0.5 rounded font-mono">
                                {config.config_key}
                              </code>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}
