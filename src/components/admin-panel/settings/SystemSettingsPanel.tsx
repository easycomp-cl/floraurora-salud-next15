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
import type { SystemSettings } from "@/lib/types/adminConfig";

const weekDays = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

const defaultSettings: SystemSettings = {
  scheduling: {
    timezone: "America/Santiago",
    active_days: [1, 2, 3, 4, 5],
    business_hours: {
      start: "08:00",
      end: "20:00",
    },
  },
  rules: {
    min_cancelation_hours: 12,
    reschedule_limit_hours: 6,
  },
};

export default function SystemSettingsPanel() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/system-settings", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo obtener la configuración");
      }
      const payload = (await response.json()) as SystemSettings;
      setSettings(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar la configuración.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleToggleDay = (day: number) => {
    setSettings((prev) => {
      const active = new Set(prev.scheduling.active_days);
      if (active.has(day)) {
        active.delete(day);
      } else {
        active.add(day);
      }
      return {
        ...prev,
        scheduling: {
          ...prev.scheduling,
          active_days: Array.from(active).sort(),
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);
      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo actualizar la configuración");
      }

      setSuccess("Configuración actualizada correctamente.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar la configuración.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          Configuración general
        </CardTitle>
        <CardDescription>
          Ajusta la zona horaria del sistema, los días activos de atención y las reglas globales.
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

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Horarios y disponibilidad</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="timezone">Zona horaria</Label>
              <Input
                id="timezone"
                placeholder="America/Santiago"
                value={settings.scheduling.timezone}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    scheduling: { ...prev.scheduling, timezone: event.target.value },
                  }))
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start">Hora inicio</Label>
                <Input
                  id="start"
                  type="time"
                  value={settings.scheduling.business_hours.start}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      scheduling: {
                        ...prev.scheduling,
                        business_hours: {
                          ...prev.scheduling.business_hours,
                          start: event.target.value,
                        },
                      },
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end">Hora término</Label>
                <Input
                  id="end"
                  type="time"
                  value={settings.scheduling.business_hours.end}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      scheduling: {
                        ...prev.scheduling,
                        business_hours: {
                          ...prev.scheduling.business_hours,
                          end: event.target.value,
                        },
                      },
                    }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Días activos</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {weekDays.map((day) => (
                <label
                  key={day.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                    settings.scheduling.active_days.includes(day.id)
                      ? "border-primary text-primary"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    checked={settings.scheduling.active_days.includes(day.id)}
                    onChange={() => handleToggleDay(day.id)}
                    disabled={isLoading}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Reglas globales</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="min_cancelation">Horas mínimas para cancelar</Label>
              <Input
                id="min_cancelation"
                type="number"
                min={0}
                value={settings.rules.min_cancelation_hours}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      min_cancelation_hours: Number(event.target.value),
                    },
                  }))
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reschedule">Horas límite para reagendar</Label>
              <Input
                id="reschedule"
                type="number"
                min={0}
                value={settings.rules.reschedule_limit_hours}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    rules: {
                      ...prev.rules,
                      reschedule_limit_hours: Number(event.target.value),
                    },
                  }))
                }
                disabled={isLoading}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

