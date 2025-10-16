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
import { AcademicDataFormData } from "@/lib/validations/professional-signup";

interface AcademicDataStepProps {
  data: AcademicDataFormData;
  onChange: (data: AcademicDataFormData) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
}

export default function AcademicDataStep({
  data,
  onChange,
  errors,
  onNext,
  onPrevious,
}: AcademicDataStepProps) {
  const handleInputChange = (
    field: keyof AcademicDataFormData,
    value: string
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(); // Siempre llamar onNext, la validación se maneja en el padre
  };

  return (
    <Card className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <CardHeader>
        <CardTitle className="text-xl">Datos Académicos</CardTitle>
        <CardDescription>
          Información sobre tu formación académica y profesional. Todos los
          campos marcados con * son obligatorios.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Consejo:</strong> Si tienes estudios adicionales como
            diplomados o especialidades, inclúyelos en el campo correspondiente.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:gap-6">
            <div className="grid gap-2">
              <Label htmlFor="university">Universidad *</Label>
              <Input
                id="university"
                value={data.university}
                onChange={(e) =>
                  handleInputChange("university", e.target.value)
                }
                placeholder="Universidad de..."
              />
              {errors.university && (
                <p className="text-sm text-red-600">{errors.university}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profession">Profesión/Carrera *</Label>
              <Input
                id="profession"
                value={data.profession}
                onChange={(e) =>
                  handleInputChange("profession", e.target.value)
                }
                placeholder="Psicología, Medicina, etc."
              />
              {errors.profession && (
                <p className="text-sm text-red-600">{errors.profession}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="grid gap-2">
                <Label htmlFor="study_year_start">Año de inicio *</Label>
                <Input
                  id="study_year_start"
                  value={data.study_year_start}
                  onChange={(e) =>
                    handleInputChange("study_year_start", e.target.value)
                  }
                  placeholder="2015"
                  maxLength={4}
                />
                {errors.study_year_start && (
                  <p className="text-sm text-red-600">
                    {errors.study_year_start}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="study_year_end">Año de término *</Label>
                <Input
                  id="study_year_end"
                  value={data.study_year_end}
                  onChange={(e) =>
                    handleInputChange("study_year_end", e.target.value)
                  }
                  placeholder="2020"
                  maxLength={4}
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
                Estudios y especialidades adicionales
              </Label>
              <textarea
                id="extra_studies"
                value={data.extra_studies}
                onChange={(e) =>
                  handleInputChange("extra_studies", e.target.value)
                }
                placeholder="Diplomados, postítulos, especialidades, etc."
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.extra_studies && (
                <p className="text-sm text-red-600">{errors.extra_studies}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="superintendence_number">
                N° inscripción Superintendencia de Salud *
              </Label>
              <Input
                id="superintendence_number"
                value={data.superintendence_number}
                onChange={(e) =>
                  handleInputChange("superintendence_number", e.target.value)
                }
                placeholder="Ej: 123456"
              />
              {errors.superintendence_number && (
                <p className="text-sm text-red-600">
                  {errors.superintendence_number}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onPrevious}
                className="flex-1"
              >
                Anterior
              </Button>
              <Button type="submit" className="flex-1">
                Continuar
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
