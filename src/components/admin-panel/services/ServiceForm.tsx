"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ServiceFormMode = "create" | "edit";

export interface ServiceFormValues {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  valid_from?: string | null;
  valid_to?: string | null;
  title_id?: number | null;
}

interface ServiceFormProps {
  mode: ServiceFormMode;
  defaultValues?: Partial<ServiceFormValues> & { id?: number };
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  availableTitles?: Array<{ id: number; title_name: string }>;
}

const defaultValues: ServiceFormValues = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "CLP",
  duration_minutes: 50,
  is_active: true,
  valid_from: undefined,
  valid_to: undefined,
};

export function buildServiceDefaults(values?: Partial<ServiceFormValues>): ServiceFormValues {
  return {
    ...defaultValues,
    ...values,
  };
}

export default function ServiceForm({
  mode,
  defaultValues: providedDefaults,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
  availableTitles = [],
}: ServiceFormProps) {
  // Usamos una clave estable basada en los valores importantes para detectar cambios
  const defaultsKey = useMemo(
    () => providedDefaults?.id ?? providedDefaults?.name ?? "new",
    [providedDefaults?.id, providedDefaults?.name]
  );

  const formDefaults = useMemo(
    () => buildServiceDefaults(providedDefaults),
    [providedDefaults]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    defaultValues: formDefaults,
  });

  // Solo resetear cuando cambie la clave (id o name), no en cada render
  useEffect(() => {
    const currentDefaults = buildServiceDefaults(providedDefaults);
    reset(currentDefaults);
    // reset de react-hook-form es estable, no necesita estar en dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultsKey]);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Ej. Sesión psicológica"
            {...register("name", { required: "El nombre es obligatorio" })}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title_id">Área/Título</Label>
          <select
            id="title_id"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            {...register("title_id", {
              valueAsNumber: true,
            })}
          >
            <option value="">Seleccionar área</option>
            {availableTitles.map((title) => (
              <option key={title.id} value={title.id}>
                {title.title_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            placeholder="sesion-psicologica"
            {...register("slug")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            className="min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            placeholder="Detalle del servicio, objetivos y duración."
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...register("price", {
              valueAsNumber: true,
              required: "El precio es obligatorio",
            })}
          />
          {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input id="currency" placeholder="CLP" {...register("currency")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duración (minutos)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="1"
            {...register("duration_minutes", {
              valueAsNumber: true,
              required: "La duración es obligatoria",
            })}
          />
          {errors.duration_minutes && (
            <p className="text-sm text-red-600">{errors.duration_minutes.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Disponible</Label>
          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              {...register("is_active")}
            />
            <span className="text-sm text-gray-600">Servicio visible para los pacientes</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_from">Vigencia desde</Label>
          <Input id="valid_from" type="date" {...register("valid_from")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_to">Vigencia hasta</Label>
          <Input id="valid_to" type="date" {...register("valid_to")} />
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : mode === "create" ? "Crear servicio" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

