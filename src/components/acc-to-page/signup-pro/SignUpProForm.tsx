"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// signupPro se importa dinámicamente para evitar problemas con hot reload

const rutRegex = /^(\d{1,2}\.??\d{3}\.??\d{3}-[\dkK])$|^(\d{7,8}-[\dkK])$/;

const professionalSchema = z.object({
  first_name: z.string().min(2, "Nombres requeridos"),
  last_name_p: z.string().min(2, "Apellido paterno requerido"),
  last_name_m: z.string().min(2, "Apellido materno requerido"),
  rut: z.string().regex(rutRegex, "RUT inválido"),
  birth_date: z.string().min(1, "Fecha de nacimiento requerida"),
  university: z.string().min(2, "Universidad requerida"),
  study_year_start: z.string().regex(/^\d{4}$/, "Año inicio inválido"),
  study_year_end: z.string().regex(/^\d{4}$/, "Año fin inválido"),
  extra_studies: z
    .string()
    .max(2000, "Los estudios adicionales no pueden exceder 2000 caracteres")
    .optional()
    .default(""),
  superintendence_number: z.string().min(3, "Número de inscripción requerido"),
  email: z.string().email("Email inválido"),
  phone_number: z
    .string()
    .regex(
      /^\+\d{1,4}\d{6,10}$/,
      "Número de teléfono inválido (ej: +56912345678)"
    ),
});

export default function SignUpProForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setErrors({});
    setSubmitting(true);
    try {
      const toValidate = {
        first_name: (formData.get("first_name") as string) || "",
        last_name_p: (formData.get("last_name_p") as string) || "",
        last_name_m: (formData.get("last_name_m") as string) || "",
        rut: (formData.get("rut") as string) || "",
        birth_date: (formData.get("birth_date") as string) || "",
        university: (formData.get("university") as string) || "",
        study_year_start: (formData.get("study_year_start") as string) || "",
        study_year_end: (formData.get("study_year_end") as string) || "",
        extra_studies: (formData.get("extra_studies") as string) || "",
        superintendence_number:
          (formData.get("superintendence_number") as string) || "",
        email: (formData.get("email") as string) || "",
        phone_number: (formData.get("phone_number") as string) || "",
      };

      const parsed = professionalSchema.safeParse(toValidate);
      if (!parsed.success) {
        const flat = parsed.error.flatten();
        const fieldErrors: Record<string, string> = {};
        Object.entries(flat.fieldErrors).forEach(([key, msgs]) => {
          if (msgs && msgs[0]) fieldErrors[key] = msgs[0];
        });
        setErrors(fieldErrors);
        setSubmitting(false);
        return;
      }

      // Validación básica de archivo
      const file = formData.get("degree_copy") as File | null;
      if (!file || !file.size) {
        setErrors((e) => ({
          ...e,
          degree_copy: "Copia del título es requerida",
        }));
        setSubmitting(false);
        return;
      }
      const allowed = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
      ];
      if (!allowed.includes(file.type)) {
        setErrors((e) => ({
          ...e,
          degree_copy: "Formato inválido (PDF/JPG/PNG)",
        }));
        setSubmitting(false);
        return;
      }

      // Asegurar full_name para la acción del servidor
      const fullName =
        `${toValidate.first_name} ${toValidate.last_name_p} ${toValidate.last_name_m}`.trim();
      formData.set("full_name", fullName);

      // Enviar a la acción del servidor
      // Importar dinámicamente para evitar problemas con hot reload
      const { signupPro: signupProAction } = await import("@/lib/auth-actions");
      await signupProAction(formData);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">Registro de Profesional</CardTitle>
          <CardDescription>
            Completa tu información. Un administrador revisará tu solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit}>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">Nombres</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    placeholder="Juan Carlos"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600">{errors.first_name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name_p">Apellido Paterno</Label>
                  <Input
                    id="last_name_p"
                    name="last_name_p"
                    placeholder="Pérez"
                  />
                  {errors.last_name_p && (
                    <p className="text-sm text-red-600">{errors.last_name_p}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name_m">Apellido Materno</Label>
                  <Input
                    id="last_name_m"
                    name="last_name_m"
                    placeholder="González"
                  />
                  {errors.last_name_m && (
                    <p className="text-sm text-red-600">{errors.last_name_m}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rut">RUT</Label>
                <Input id="rut" name="rut" placeholder="12.345.678-9" />
                {errors.rut && (
                  <p className="text-sm text-red-600">{errors.rut}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input id="birth_date" name="birth_date" type="date" />
                {errors.birth_date && (
                  <p className="text-sm text-red-600">{errors.birth_date}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="university">Universidad</Label>
                <Input
                  id="university"
                  name="university"
                  placeholder="Universidad de..."
                />
                {errors.university && (
                  <p className="text-sm text-red-600">{errors.university}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="study_year_start">Año de inicio</Label>
                  <Input
                    id="study_year_start"
                    name="study_year_start"
                    placeholder="2015"
                  />
                  {errors.study_year_start && (
                    <p className="text-sm text-red-600">
                      {errors.study_year_start}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="study_year_end">Año de término</Label>
                  <Input
                    id="study_year_end"
                    name="study_year_end"
                    placeholder="2020"
                  />
                  {errors.study_year_end && (
                    <p className="text-sm text-red-600">
                      {errors.study_year_end}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="extra_studies">
                  Estudios y especialidades extra
                </Label>
                <textarea
                  id="extra_studies"
                  name="extra_studies"
                  placeholder="Diplomados, postítulos, especialidades, etc."
                  maxLength={2000}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@dominio.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone_number">
                  Número de Teléfono (con código de área)
                </Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  placeholder="+56912345678"
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-600">{errors.phone_number}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="superintendence_number">
                  N° inscripción Superintendencia de Salud
                </Label>
                <Input
                  id="superintendence_number"
                  name="superintendence_number"
                  placeholder="Ej: 123456"
                />
                {errors.superintendence_number && (
                  <p className="text-sm text-red-600">
                    {errors.superintendence_number}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="degree_copy">
                  Copia del título universitario (PDF/JPG/PNG)
                </Label>
                <Input
                  id="degree_copy"
                  name="degree_copy"
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                />
                {errors.degree_copy && (
                  <p className="text-sm text-red-600">{errors.degree_copy}</p>
                )}
              </div>

              {/* Recordatorio para reCAPTCHA */}
              <div className="grid gap-2">
                <Label htmlFor="recaptcha_placeholder">
                  reCAPTCHA (pendiente)
                </Label>
                <Input
                  id="recaptcha_placeholder"
                  name="recaptcha_placeholder"
                  placeholder="Aquí agregar reCAPTCHA v2/v3"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Recordatorio: integrar reCAPTCHA antes del envío definitivo.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
