"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { AdminRole, AdminUser } from "@/lib/types/admin";
import { passwordSchema } from "@/lib/validations/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type UserFormMode = "create" | "edit";

export interface UserFormValues {
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  rut: string;
  role: AdminRole;
  password?: string;
}

interface UserFormProps {
  mode: UserFormMode;
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (values: UserFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "professional", label: "Profesional" },
  { value: "patient", label: "Paciente" },
];

const emptyDefaults: UserFormValues = {
  name: "",
  last_name: "",
  email: "",
  phone_number: "",
  rut: "",
  role: "patient",
  password: "",
};

export function buildUserFormDefaults(user?: AdminUser): UserFormValues {
  if (!user) {
    return emptyDefaults;
  }

  return {
    name: user.name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
    phone_number: user.phone_number ?? "",
    rut: "",
    role: user.role,
    password: "",
  };
}

export default function UserForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  error,
}: UserFormProps) {
  const formDefaults = useMemo(() => {
    if (defaultValues) {
      return { ...emptyDefaults, ...defaultValues };
    }
    return emptyDefaults;
  }, [defaultValues]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    defaultValues: formDefaults,
  });

  useEffect(() => {
    reset(formDefaults);
  }, [formDefaults, reset]);

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Nombre"
            {...register("name", { required: "El nombre es obligatorio" })}
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellido</Label>
          <Input
            id="last_name"
            placeholder="Apellido"
            {...register("last_name", { required: "El apellido es obligatorio" })}
          />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.cl"
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Correo inválido",
              },
            })}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Teléfono</Label>
          <Input id="phone_number" placeholder="+56 9 1234 5678" {...register("phone_number")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rut">RUT (opcional)</Label>
          <Input id="rut" placeholder="12.345.678-9" {...register("rut")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <select
            id="role"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            {...register("role")}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {mode === "create" && (
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input
              id="password"
              type="password"
              placeholder="Contraseña temporal"
              {...register("password", {
                required: "La contraseña es obligatoria",
                validate: (value) => {
                  if (!value?.trim()) return "La contraseña es obligatoria";
                  const result = passwordSchema.safeParse(value);
                  return result.success ? true : result.error.issues[0]?.message ?? "Contraseña inválida";
                },
              })}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Mín. 6 caracteres, al menos 1 mayúscula, 1 número. No solo números ni solo letras.
            </p>
          </div>
        )}
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
          {isSubmitting ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

