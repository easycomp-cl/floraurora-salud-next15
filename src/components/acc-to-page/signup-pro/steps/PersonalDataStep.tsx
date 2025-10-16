"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PersonalDataFormData,
  formatRUT,
  formatPhone,
} from "@/lib/validations/professional-signup";

interface PersonalDataStepProps {
  data: PersonalDataFormData;
  onChange: (data: PersonalDataFormData) => void;
  errors: Record<string, string>;
  onNext: () => void;
}

export default function PersonalDataStep({
  data,
  onChange,
  errors,
  onNext,
}: PersonalDataStepProps) {
  const handleInputChange = (
    field: keyof PersonalDataFormData,
    value: string
  ) => {
    let formattedValue = value;

    if (field === "rut") {
      formattedValue = formatRUT(value);
    } else if (field === "phone_number") {
      formattedValue = formatPhone(value);
    }

    onChange({
      ...data,
      [field]: formattedValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(); // Siempre llamar onNext, la validación se maneja en el padre
  };

  return (
    <Card className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <CardHeader>
        <CardTitle className="text-xl">Datos Personales</CardTitle>
        <CardDescription>
          Completa tu información personal básica. Todos los campos marcados con
          * son obligatorios.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Consejo:</strong> Asegúrate de que todos los datos sean
            correctos, ya que serán verificados durante el proceso de
            aprobación.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Nombres *</Label>
                <Input
                  id="first_name"
                  value={data.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  placeholder="Juan Carlos"
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name_p">Apellido Paterno *</Label>
                <Input
                  id="last_name_p"
                  value={data.last_name_p}
                  onChange={(e) =>
                    handleInputChange("last_name_p", e.target.value)
                  }
                  placeholder="Pérez"
                />
                {errors.last_name_p && (
                  <p className="text-sm text-red-600">{errors.last_name_p}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name_m">Apellido Materno *</Label>
                <Input
                  id="last_name_m"
                  value={data.last_name_m}
                  onChange={(e) =>
                    handleInputChange("last_name_m", e.target.value)
                  }
                  placeholder="González"
                />
                {errors.last_name_m && (
                  <p className="text-sm text-red-600">{errors.last_name_m}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                value={data.rut}
                onChange={(e) => handleInputChange("rut", e.target.value)}
                placeholder="12.345.678-9"
              />
              {errors.rut && (
                <p className="text-sm text-red-600">{errors.rut}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
              <Input
                id="birth_date"
                type="date"
                value={data.birth_date}
                onChange={(e) =>
                  handleInputChange("birth_date", e.target.value)
                }
              />
              {errors.birth_date && (
                <p className="text-sm text-red-600">{errors.birth_date}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="ejemplo@dominio.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone_number">Número de Teléfono *</Label>
              <Input
                id="phone_number"
                value={data.phone_number}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
                placeholder="+56912345678"
              />
              {errors.phone_number && (
                <p className="text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
