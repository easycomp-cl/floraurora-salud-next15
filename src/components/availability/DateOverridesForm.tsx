"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AvailabilityOverride,
  DateOverrideForm,
  TimeSlot,
  COMMON_TIME_SLOTS,
} from "@/lib/types/availability";
import { AvailabilityService } from "@/lib/services/availabilityService";
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DateOverridesFormProps {
  professionalId: number;
  onUpdate: () => void;
}

export function DateOverridesForm({
  professionalId,
  onUpdate,
}: DateOverridesFormProps) {
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<DateOverrideForm>({
    for_date: "",
    timeSlots: [{ id: "temp-1", start_time: "08:00", end_time: "17:00" }],
    is_available: true,
  });

  useEffect(() => {
    loadOverrides();
  }, [professionalId]);

  const loadOverrides = async () => {
    try {
      setLoading(true);
      const overridesData = await AvailabilityService.getAvailabilityOverrides(
        professionalId
      );
      setOverrides(overridesData);
    } catch (error) {
      console.error("Error al cargar excepciones de fecha:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof DateOverrideForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `temp-${Date.now()}`,
      start_time: "08:00",
      end_time: "17:00",
    };
    setFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot],
    }));
  };

  const updateTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.for_date || formData.timeSlots.length === 0) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar que todos los horarios sean válidos
    const invalidSlots = formData.timeSlots.filter(
      (slot) =>
        !AvailabilityService.validateTimeSlot(slot.start_time, slot.end_time) ||
        !AvailabilityService.validateHourFormat(slot.start_time) ||
        !AvailabilityService.validateHourFormat(slot.end_time)
    );

    if (invalidSlots.length > 0) {
      alert(
        "Algunos horarios no son válidos. Solo se permiten horas completas (ej: 09:00, 10:00) y deben estar dentro del rango 08:00-00:00."
      );
      return;
    }

    try {
      setSaving(true);

      // Crear una excepción para cada horario
      for (const slot of formData.timeSlots) {
        await AvailabilityService.createAvailabilityOverride({
          professional_id: professionalId,
          for_date: formData.for_date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: formData.is_available,
        });
      }

      // Recargar la lista
      await loadOverrides();
      setFormData({
        for_date: "",
        timeSlots: [{ id: "temp-1", start_time: "08:00", end_time: "17:00" }],
        is_available: true,
      });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error("Error al crear excepción de fecha:", error);
      alert("Error al crear la excepción de fecha");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (override: AvailabilityOverride) => {
    if (!override.id) return;

    if (
      !confirm("¿Estás seguro de que quieres eliminar esta excepción de fecha?")
    ) {
      return;
    }

    try {
      await AvailabilityService.deleteAvailabilityOverride(override.id);
      setOverrides((prev) => prev.filter((o) => o.id !== override.id));
      onUpdate();
    } catch (error) {
      console.error("Error al eliminar excepción de fecha:", error);
      alert("Error al eliminar la excepción de fecha");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Agrupar excepciones por fecha
  const groupedOverrides = overrides.reduce((acc, override) => {
    const date = override.for_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(override);
    return acc;
  }, {} as Record<string, AvailabilityOverride[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Excepciones de Fecha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            Cargando excepciones de fecha...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Excepciones de Fecha
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configura horarios especiales para fechas específicas (días festivos,
          horarios extendidos, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Excepciones Configuradas</h3>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancelar" : "Agregar Excepción"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 border rounded-lg bg-gray-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="for_date">Fecha</Label>
                <Input
                  id="for_date"
                  type="date"
                  value={formData.for_date}
                  onChange={(e) =>
                    handleInputChange("for_date", e.target.value)
                  }
                  min={getCurrentDate()}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <Label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.is_available}
                    onChange={() => handleInputChange("is_available", true)}
                    className="text-blue-600"
                  />
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Disponible
                </Label>
                <Label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.is_available}
                    onChange={() => handleInputChange("is_available", false)}
                    className="text-blue-600"
                  />
                  <XCircle className="h-4 w-4 text-red-600" />
                  No Disponible
                </Label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Horarios</Label>
                <Button
                  type="button"
                  onClick={addTimeSlot}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Horario
                </Button>
              </div>

              <div className="space-y-2">
                {formData.timeSlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 p-2 bg-white rounded border"
                  >
                    <Clock className="h-4 w-4 text-gray-500" />
                    <select
                      value={slot.start_time}
                      onChange={(e) =>
                        updateTimeSlot(index, "start_time", e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {COMMON_TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-500">a</span>
                    <select
                      value={slot.end_time}
                      onChange={(e) =>
                        updateTimeSlot(index, "end_time", e.target.value)
                      }
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {COMMON_TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    {formData.timeSlots.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        size="sm"
                        variant="destructive"
                        className="p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Guardando..." : "Guardar Excepción"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {Object.keys(groupedOverrides).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay excepciones de fecha configuradas</p>
            <p className="text-sm">
              Agrega horarios especiales para fechas específicas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedOverrides).map(([date, dateOverrides]) => (
              <div key={date} className="border rounded-lg p-4">
                <h4 className="font-medium text-lg mb-3">{formatDate(date)}</h4>
                <div className="space-y-2">
                  {dateOverrides.map((override) => (
                    <div
                      key={override.id}
                      className="flex items-center justify-between p-3 bg-white rounded border"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {override.is_available ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {override.is_available
                              ? "Disponible"
                              : "No Disponible"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            {override.start_time} - {override.end_time}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleDelete(override)}
                        size="sm"
                        variant="destructive"
                        className="p-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
