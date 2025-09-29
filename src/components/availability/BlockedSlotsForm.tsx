"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockedSlot, BlockedSlotForm } from "@/lib/types/availability";
import { AvailabilityService } from "@/lib/services/availabilityService";
import { Plus, Trash2, Calendar, Clock, AlertTriangle } from "lucide-react";

interface BlockedSlotsFormProps {
  professionalId: number;
  onUpdate: () => void;
}

export function BlockedSlotsForm({
  professionalId,
  onUpdate,
}: BlockedSlotsFormProps) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BlockedSlotForm>({
    starts_at: "",
    ends_at: "",
    reason: "",
  });

  const loadBlockedSlots = useCallback(async () => {
    try {
      setLoading(true);
      const slots = await AvailabilityService.getBlockedSlots(professionalId);
      setBlockedSlots(slots);
    } catch (error) {
      console.error("Error al cargar bloques de tiempo:", error);
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    loadBlockedSlots();
  }, [professionalId, loadBlockedSlots]);

  const handleInputChange = (field: keyof BlockedSlotForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.starts_at || !formData.ends_at) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    const startDate = new Date(formData.starts_at);
    const endDate = new Date(formData.ends_at);

    if (startDate >= endDate) {
      alert("La fecha de inicio debe ser anterior a la fecha de fin");
      return;
    }

    try {
      setSaving(true);
      const newBlockedSlot = await AvailabilityService.createBlockedSlot({
        professional_id: professionalId,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        reason: formData.reason || undefined,
      });

      setBlockedSlots((prev) => [...prev, newBlockedSlot]);
      setFormData({ starts_at: "", ends_at: "", reason: "" });
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error("Error al crear bloque de tiempo:", error);
      alert("Error al crear el bloque de tiempo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slot: BlockedSlot) => {
    if (!slot.id) return;

    if (
      !confirm("¿Estás seguro de que quieres eliminar este bloque de tiempo?")
    ) {
      return;
    }

    try {
      await AvailabilityService.deleteBlockedSlot(slot.id);
      setBlockedSlots((prev) => prev.filter((s) => s.id !== slot.id));
      onUpdate();
    } catch (error) {
      console.error("Error al eliminar bloque de tiempo:", error);
      alert("Error al eliminar el bloque de tiempo");
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bloques de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Cargando bloques de tiempo...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Bloques de Tiempo
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configura períodos donde no estarás disponible (vacaciones, citas
          médicas, etc.)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Bloques Configurados</h3>
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancelar" : "Agregar Bloque"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 border rounded-lg bg-gray-50"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="starts_at">Fecha y Hora de Inicio</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) =>
                    handleInputChange("starts_at", e.target.value)
                  }
                  min={getCurrentDateTime()}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ends_at">Fecha y Hora de Fin</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => handleInputChange("ends_at", e.target.value)}
                  min={formData.starts_at || getCurrentDateTime()}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Ej: Vacaciones, Cita médica, etc."
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? "Guardando..." : "Guardar Bloque"}
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

        {blockedSlots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay bloques de tiempo configurados</p>
            <p className="text-sm">
              Agrega períodos donde no estarás disponible
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedSlots.map((slot) => {
              const startFormatted = formatDateTime(slot.starts_at);
              const endFormatted = formatDateTime(slot.ends_at);

              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{startFormatted.date}</span>
                      <Clock className="h-4 w-4 text-gray-500 ml-2" />
                      <span>{startFormatted.time}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{endFormatted.date}</span>
                      <Clock className="h-4 w-4 text-gray-500 ml-2" />
                      <span>{endFormatted.time}</span>
                    </div>
                    {slot.reason && (
                      <span className="text-sm text-gray-600 italic">
                        ({slot.reason})
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleDelete(slot)}
                    size="sm"
                    variant="destructive"
                    className="p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
