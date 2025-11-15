"use client";

import { useEffect, useState } from "react";
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
};

export default function SystemSettingsPanel() {
  const [configurations, setConfigurations] = useState<SystemConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/system-configurations", {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener la configuración");
      }
      const data = (await response.json()) as SystemConfiguration[];
      setConfigurations(data);
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
  }, []);

  const handleConfigChange = (id: number, newValue: string | number | boolean) => {
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

  const handleToggleActive = (id: number) => {
    setConfigurations((prev) =>
      prev.map((config) =>
        config.id === id ? { ...config, is_active: !config.is_active } : config
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);

      const configurationsToUpdate = configurations.map((config) => ({
        id: config.id,
        config_value: config.config_value,
        is_active: config.is_active,
      }));

      const response = await fetch("/api/admin/system-configurations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configurations: configurationsToUpdate }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo actualizar la configuración");
      }

      const updatedData = (await response.json()) as SystemConfiguration[];
      setConfigurations(updatedData);
      setSuccess("Configuración actualizada correctamente.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar la configuración.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Agrupar configuraciones por categoría
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
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
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
            {categories.map((category) => (
              <section key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {configurationsByCategory[category].map((config) => (
                    <div key={config.id} className="space-y-3 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`config-${config.id}`} className="text-sm font-medium text-gray-900 block">
                            {config.description || config.config_key.replace(/_/g, " ")}
                          </Label>
                          
                          {config.data_type === "boolean" ? (
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={config.value === true}
                                  onChange={(e) =>
                                    handleConfigChange(config.id, e.target.checked)
                                  }
                                  disabled={isLoading || isSaving || !config.is_active}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className={`text-sm font-medium ${!config.is_active ? 'text-gray-400' : 'text-gray-700'}`}>
                                  {config.value === true ? "Habilitado" : "Deshabilitado"}
                                </span>
                              </label>
                            </div>
                          ) : config.data_type === "number" ? (
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
                              className="w-full"
                            />
                          ) : (
                            <Input
                              id={`config-${config.id}`}
                              type="text"
                              value={config.value as string}
                              onChange={(event) =>
                                handleConfigChange(config.id, event.target.value)
                              }
                              disabled={isLoading || isSaving || !config.is_active}
                              className="w-full"
                            />
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 pt-1">
                          <span className="text-xs text-gray-500 whitespace-nowrap">Estado</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.is_active}
                              onChange={() => handleToggleActive(config.id)}
                              disabled={isLoading || isSaving}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-gray-600">
                              {config.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Clave: <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">{config.config_key}</code>
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
