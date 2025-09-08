"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AvailabilityRule,
  TimeSlot,
  WEEKDAYS,
  COMMON_TIME_SLOTS,
} from "@/lib/types/availability";
import { AvailabilityService } from "@/lib/services/availabilityService";
import { Plus, Trash2, Clock, Calendar } from "lucide-react";

interface WeeklyScheduleFormProps {
  professionalId: number;
  onUpdate: () => void;
}

export function WeeklyScheduleForm({
  professionalId,
  onUpdate,
}: WeeklyScheduleFormProps) {
  const [weeklyRules, setWeeklyRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWeeklyRules();
  }, [professionalId]);

  const loadWeeklyRules = async () => {
    try {
      setLoading(true);
      const rules = await AvailabilityService.getAvailabilityRules(
        professionalId
      );
      setWeeklyRules(rules);
    } catch (error) {
      console.error("Error al cargar reglas semanales:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (weekday: number) => {
    const newRule: AvailabilityRule = {
      professional_id: professionalId,
      weekday,
      start_time: "08:00",
      end_time: "17:00",
    };

    setWeeklyRules((prev) => [...prev, newRule]);
  };

  const updateTimeSlot = (
    index: number,
    field: keyof AvailabilityRule,
    value: string | number
  ) => {
    setWeeklyRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [field]: value } : rule))
    );
  };

  const removeTimeSlot = async (rule: AvailabilityRule) => {
    if (rule.id) {
      try {
        await AvailabilityService.deleteAvailabilityRule(rule.id);
        setWeeklyRules((prev) => prev.filter((r) => r.id !== rule.id));
        onUpdate();
      } catch (error) {
        console.error("Error al eliminar regla:", error);
      }
    } else {
      setWeeklyRules((prev) => prev.filter((r) => r !== rule));
    }
  };

  const saveTimeSlot = async (rule: AvailabilityRule) => {
    try {
      setSaving(true);

      // Prueba temporal de la función de solapamiento
      AvailabilityService.testTimeSlotsOverlap();

      // Validar que no se solape con otros horarios del mismo día
      const dayRules = getRulesForWeekday(rule.weekday);
      const otherRules = dayRules.filter((r) => r.id !== rule.id);

      const hasOverlap = otherRules.some((existingRule) =>
        AvailabilityService.timeSlotsOverlap(
          rule.start_time,
          rule.end_time,
          existingRule.start_time,
          existingRule.end_time
        )
      );

      if (hasOverlap) {
        alert(
          "Este horario se solapa con otro horario ya configurado para el mismo día."
        );
        return;
      }

      if (rule.id) {
        await AvailabilityService.updateAvailabilityRule(rule.id, rule);
      } else {
        const newRule = await AvailabilityService.createAvailabilityRule(rule);
        setWeeklyRules((prev) => prev.map((r) => (r === rule ? newRule : r)));
      }

      onUpdate();
    } catch (error) {
      console.error("Error al guardar regla:", error);
    } finally {
      setSaving(false);
    }
  };

  const getRulesForWeekday = (weekday: number) => {
    return weeklyRules.filter((rule) => rule.weekday === weekday);
  };

  const validateTimeSlot = (startTime: string, endTime: string) => {
    return AvailabilityService.validateTimeSlot(startTime, endTime);
  };

  const validateHourFormat = (time: string) => {
    return AvailabilityService.validateHourFormat(time);
  };

  const getAvailableTimeSlots = (weekday: number, excludeRuleId?: number) => {
    const dayRules = getRulesForWeekday(weekday).filter(
      (rule) => rule.id !== excludeRuleId
    );
    const allSlots = COMMON_TIME_SLOTS;
    const availableSlots: string[] = [];

    for (let i = 0; i < allSlots.length - 1; i++) {
      const startTime = allSlots[i];
      const endTime = allSlots[i + 1];

      // Verificar si este slot está disponible (no se solapa con horarios existentes)
      const isAvailable = !dayRules.some((rule) =>
        AvailabilityService.timeSlotsOverlap(
          startTime,
          endTime,
          rule.start_time,
          rule.end_time
        )
      );

      if (isAvailable) {
        availableSlots.push(startTime);
      }
    }

    return availableSlots;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horarios Semanales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando horarios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Horarios Semanales
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configura tus horarios de disponibilidad para cada día de la semana
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {WEEKDAYS.map((day) => {
          const dayRules = getRulesForWeekday(day.value);

          return (
            <div key={day.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg">{day.label}</h3>
                <Button
                  onClick={() => addTimeSlot(day.value)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Horario
                </Button>
              </div>

              {dayRules.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  No hay horarios configurados para {day.label}
                </p>
              ) : (
                <div className="space-y-3">
                  {dayRules.map((rule, index) => {
                    const isNew = !rule.id;
                    const isValid = validateTimeSlot(
                      rule.start_time,
                      rule.end_time
                    );
                    const isStartValid = validateHourFormat(rule.start_time);
                    const isEndValid = validateHourFormat(rule.end_time);

                    // Si es un horario guardado, mostrarlo como información
                    if (!isNew) {
                      return (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">
                              {rule.start_time} - {rule.end_time}
                            </span>
                            <span className="text-green-600 text-sm">
                              ✓ Guardado
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => removeTimeSlot(rule)}
                              size="sm"
                              variant="destructive"
                              className="p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    }

                    // Si es un horario nuevo, mostrarlo como formulario editable
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <select
                            value={rule.start_time}
                            onChange={(e) =>
                              updateTimeSlot(
                                weeklyRules.findIndex((r) => r === rule),
                                "start_time",
                                e.target.value
                              )
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {getAvailableTimeSlots(rule.weekday).map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                          <span className="text-gray-500">a</span>
                          <select
                            value={rule.end_time}
                            onChange={(e) =>
                              updateTimeSlot(
                                weeklyRules.findIndex((r) => r === rule),
                                "end_time",
                                e.target.value
                              )
                            }
                            className="border rounded px-2 py-1 text-sm"
                          >
                            {COMMON_TIME_SLOTS.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>

                        {(!isValid || !isStartValid || !isEndValid) && (
                          <span className="text-red-500 text-xs">
                            {!isStartValid || !isEndValid
                              ? "Solo se permiten horas completas (ej: 09:00, 10:00)"
                              : "Hora de fin debe ser mayor a hora de inicio y dentro del rango 08:00-00:00"}
                          </span>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            onClick={() => saveTimeSlot(rule)}
                            size="sm"
                            disabled={
                              !isValid || !isStartValid || !isEndValid || saving
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {saving ? "Guardando..." : "Guardar"}
                          </Button>

                          <Button
                            onClick={() => removeTimeSlot(rule)}
                            size="sm"
                            variant="destructive"
                            className="p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
