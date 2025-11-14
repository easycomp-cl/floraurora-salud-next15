"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminService } from "@/lib/types/admin";
import ServiceForm, { buildServiceDefaults, type ServiceFormValues } from "./ServiceForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge, CalendarClock, CircleDollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServicesResponse {
  data: AdminService[];
  total: number;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  try {
    return format(new Date(value), "dd MMM yyyy", { locale: es });
  } catch {
    return value;
  }
}

export default function ServicesManagement() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [titles, setTitles] = useState<Array<{ id: number; title_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<AdminService | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/services", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudieron obtener los servicios");
      }
      const payload = (await response.json()) as ServicesResponse;
      setServices(payload.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al cargar los servicios.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTitles = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/professional-titles", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setTitles(data.data || []);
      }
    } catch (err) {
      console.warn("No se pudieron cargar los títulos:", err);
    }
  }, []);

  useEffect(() => {
    loadServices();
    loadTitles();
  }, [loadServices, loadTitles]);

  const handleCreate = async (values: ServiceFormValues) => {
    try {
      setIsSubmitting(true);
      setDialogError(null);
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo crear el servicio");
      }

      setMessage("Servicio creado correctamente.");
      setIsCreateOpen(false);
      await loadServices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al crear el servicio.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (values: ServiceFormValues) => {
    if (!selectedService) return;
    try {
      setIsSubmitting(true);
      setDialogError(null);
      const response = await fetch(`/api/admin/services/${selectedService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo actualizar el servicio");
      }

      setMessage("Servicio actualizado correctamente.");
      setIsEditOpen(false);
      setSelectedService(null);
      await loadServices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al actualizar el servicio.";
      setDialogError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (service: AdminService) => {
    if (!window.confirm(`¿Seguro que deseas desactivar el servicio "${service.name}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo desactivar el servicio");
      }

      setMessage("Servicio desactivado correctamente.");
      await loadServices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al desactivar el servicio.";
      setError(message);
    }
  };

  const handleActivate = async (service: AdminService) => {
    if (!window.confirm(`¿Seguro que deseas activar el servicio "${service.name}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/services/${service.id}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? "No se pudo activar el servicio");
      }

      setMessage("Servicio activado correctamente.");
      await loadServices();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error inesperado al activar el servicio.";
      setError(message);
    }
  };

  // Memoizar los defaultValues para el formulario de edición
  const editFormDefaults = useMemo(() => {
    if (!selectedService) return undefined;
    return {
      ...buildServiceDefaults({
        name: selectedService.name,
        slug: selectedService.slug,
        description: selectedService.description ?? "",
        price: selectedService.price,
        currency: selectedService.currency,
        duration_minutes: selectedService.duration_minutes,
        is_active: selectedService.is_active,
        valid_from: selectedService.valid_from ?? undefined,
        valid_to: selectedService.valid_to ?? undefined,
      }),
      id: selectedService.id,
    };
  }, [selectedService]);

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Especialidades disponibles
            </CardTitle>
            <p className="text-sm text-gray-500">
              Visualiza las especialidades disponibles organizadas por área profesional.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setDialogError(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setMessage(null);
                setIsCreateOpen(true);
              }}>
                Crear servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Nuevo servicio</DialogTitle>
                <DialogDescription>
                  Configura el detalle del servicio que estará visible para pacientes y profesionales.
                </DialogDescription>
              </DialogHeader>
                      <ServiceForm
                        mode="create"
                        onSubmit={handleCreate}
                        onCancel={() => setIsCreateOpen(false)}
                        isSubmitting={isSubmitting}
                        error={dialogError}
                        availableTitles={titles}
                      />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-10 text-center text-gray-500">Cargando servicios...</div>
          ) : services.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No se han configurado servicios aún.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`rounded-xl border p-5 shadow-sm ${
                    service.is_active 
                      ? "border-gray-200 bg-white" 
                      : "border-gray-300 bg-gray-50 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      {service.title_name && (
                        <p className="text-xs text-primary font-medium mt-1">
                          Área: {service.title_name}
                        </p>
                      )}
                      {!service.title_name && (
                        <p className="text-xs text-gray-400 mt-1">Sin área asignada</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        service.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Badge className="h-3.5 w-3.5" />
                      {service.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {service.description && (
                    <p className="mt-3 text-sm text-gray-600">{service.description}</p>
                  )}

                  <div className="mt-4 grid gap-2 text-xs text-gray-600">
                    {service.price !== undefined && service.price > 0 && (
                      <div className="flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4 text-primary" />
                        <span>
                          {service.price} {service.currency}
                        </span>
                      </div>
                    )}
                    {service.duration_minutes !== undefined && service.duration_minutes > 0 && (
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        <span>
                          {service.duration_minutes} minutos
                          {service.valid_from || service.valid_to ? (
                            <> · {formatDate(service.valid_from)} → {formatDate(service.valid_to)}</>
                          ) : null}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Dialog
                      open={isEditOpen && selectedService?.id === service.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setIsEditOpen(false);
                          setSelectedService(null);
                          setDialogError(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedService(service);
                            setIsEditOpen(true);
                            setMessage(null);
                          }}
                        >
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Editar servicio</DialogTitle>
                          <DialogDescription>
                            Actualiza la información del servicio y su vigencia.
                          </DialogDescription>
                        </DialogHeader>
                        <ServiceForm
                          mode="edit"
                          defaultValues={editFormDefaults}
                          onSubmit={handleUpdate}
                          onCancel={() => {
                            setIsEditOpen(false);
                            setSelectedService(null);
                          }}
                          isSubmitting={isSubmitting}
                          error={dialogError}
                          availableTitles={titles}
                        />
                      </DialogContent>
                    </Dialog>

                    {service.is_active ? (
                      <Button variant="outline" size="sm" onClick={() => handleDeactivate(service)}>
                        Desactivar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleActivate(service)}>
                        Activar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

