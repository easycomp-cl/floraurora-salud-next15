"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NotificationTemplate, NotificationChannel } from "@/lib/types/adminConfig";

const channelOptions: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Correo electrónico" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface TemplateFormState {
  channel: NotificationChannel;
  template_key: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
  is_active: boolean;
}

const defaultFormState: TemplateFormState = {
  channel: "email",
  template_key: "",
  name: "",
  subject: "",
  body: "",
  variables: "",
  is_active: true,
};

export default function NotificationTemplatesPanel() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<TemplateFormState>(defaultFormState);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/templates", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudieron obtener las plantillas");
      }
      const payload = await response.json();
      setTemplates(payload.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar las plantillas.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openDialog = (template?: NotificationTemplate) => {
    setDialogError(null);
    setSuccess(null);
    if (template) {
      setEditingId(template.id);
      setFormState({
        channel: template.channel,
        template_key: template.template_key,
        name: template.name,
        subject: template.subject ?? "",
        body: template.body,
        variables: template.variables.join(", "),
        is_active: template.is_active,
      });
    } else {
      setEditingId(null);
      setFormState(defaultFormState);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setDialogError(null);
      const payload = {
        ...formState,
        variables: formState.variables
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await fetch(
        editingId ? `/api/admin/templates/${editingId}` : "/api/admin/templates",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error ?? "No se pudo guardar la plantilla");
      }

      setSuccess("Plantilla guardada correctamente.");
      setIsDialogOpen(false);
      await loadTemplates();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al guardar la plantilla.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo desactivar la plantilla");
      }

      setSuccess("Plantilla desactivada correctamente.");
      await loadTemplates();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al desactivar la plantilla.";
      setError(message);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Plantillas de notificaciones
          </CardTitle>
          <CardDescription>
            Administra los mensajes que se envían por correo electrónico y WhatsApp.
          </CardDescription>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>Crear plantilla</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar plantilla de notificación" : "Nueva plantilla de notificación"}
              </DialogTitle>
              <DialogDescription>
                Define los contenidos y variables disponibles. Usa <code>{"{{ variable }}"}</code> en el texto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="channel">Canal</Label>
                  <select
                    id="channel"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={formState.channel}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        channel: event.target.value as NotificationChannel,
                      }))
                    }
                  >
                    {channelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="template_key">Identificador</Label>
                  <Input
                    id="template_key"
                    placeholder="ej: appointment_confirmed"
                    value={formState.template_key}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, template_key: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre visible</Label>
                  <Input
                    id="name"
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Asunto (correo)</Label>
                  <Input
                    id="subject"
                    value={formState.subject}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, subject: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="body">Contenido</Label>
                <textarea
                  id="body"
                  className="min-h-[160px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  value={formState.body}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, body: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="variables">Variables (separadas por coma)</Label>
                  <Input
                    id="variables"
                    placeholder="paciente, profesional, fecha"
                    value={formState.variables}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, variables: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="is_active">Estado</Label>
                  <select
                    id="is_active"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    value={String(formState.is_active)}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        is_active: event.target.value === "true",
                      }))
                    }
                  >
                    <option value="true">Activa</option>
                    <option value="false">Inactiva</option>
                  </select>
                </div>
              </div>

              {dialogError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {dialogError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 bg-white text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Plantilla</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Canal</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Variables</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Estado</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Cargando plantillas...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Aún no existen plantillas configuradas.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id}>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500">{template.template_key}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{template.channel}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {template.variables.length > 0 ? template.variables.join(", ") : "Sin variables"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          template.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {template.is_active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDialog(template)}>
                          Editar
                        </Button>
                        {template.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(template.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

