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
import { DocumentsFormData } from "@/lib/validations/professional-signup";

interface DocumentsStepProps {
  data: DocumentsFormData;
  onChange: (data: DocumentsFormData) => void;
  errors: Record<string, string>;
  onNext: () => void;
  onPrevious: () => void;
}

export default function DocumentsStep({
  data,
  onChange,
  errors,
  onNext,
  onPrevious,
}: DocumentsStepProps) {
  const handleFileChange = (
    field: keyof DocumentsFormData,
    file: File | null
  ) => {
    onChange({
      ...data,
      [field]: file,
    });
  };

  const handleAdditionalCertificatesChange = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      onChange({
        ...data,
        additional_certificates: fileArray,
      });
    }
  };

  const removeAdditionalCertificate = (index: number) => {
    const newCertificates =
      data.additional_certificates?.filter((_, i) => i !== index) || [];
    onChange({
      ...data,
      additional_certificates: newCertificates,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(); // Siempre llamar onNext, la validación se maneja en el padre
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <CardHeader>
        <CardTitle className="text-xl">Documentos Requeridos</CardTitle>
        <CardDescription>
          Sube los documentos necesarios para verificar tu identidad y
          formación. El título universitario, copia de cédula de identidad y certificado profesional son obligatorios.
        </CardDescription>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Consejo:</strong> Asegúrate de que los documentos sean
            legibles y estén en formato PDF, PNG, JPG o JPEG. Tamaño máximo: 5MB
            por archivo.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:gap-8">
            <div className="grid gap-2">
              <Label htmlFor="degree_copy">
                Copia del título universitario *
              </Label>
              <Input
                id="degree_copy"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) =>
                  handleFileChange("degree_copy", e.target.files?.[0] || null)
                }
              />
              {data.degree_copy && (
                <p className="text-sm text-green-600">
                  Archivo seleccionado: {data.degree_copy.name} (
                  {formatFileSize(data.degree_copy.size)})
                </p>
              )}
              {errors.degree_copy && (
                <p className="text-sm text-red-600">{errors.degree_copy}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, PNG, JPG, JPEG. Tamaño máximo: 5MB
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="id_copy">Copia de cédula de identidad *</Label>
              <Input
                id="id_copy"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) =>
                  handleFileChange("id_copy", e.target.files?.[0] || null)
                }
              />
              {data.id_copy && (
                <p className="text-sm text-green-600">
                  Archivo seleccionado: {data.id_copy.name} (
                  {formatFileSize(data.id_copy.size)})
                </p>
              )}
              {errors.id_copy && (
                <p className="text-sm text-red-600">{errors.id_copy}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, PNG, JPG, JPEG. Tamaño máximo: 5MB
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professional_certificate">
                Certificado profesional *
              </Label>
              <Input
                id="professional_certificate"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) =>
                  handleFileChange(
                    "professional_certificate",
                    e.target.files?.[0] || null
                  )
                }
              />
              {data.professional_certificate && (
                <p className="text-sm text-green-600">
                  Archivo seleccionado: {data.professional_certificate.name} (
                  {formatFileSize(data.professional_certificate.size)})
                </p>
              )}
              {errors.professional_certificate && (
                <p className="text-sm text-red-600">
                  {errors.professional_certificate}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, PNG, JPG, JPEG. Tamaño máximo: 5MB
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="additional_certificates">
                Certificados adicionales (opcional)
              </Label>
              <Input
                id="additional_certificates"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                multiple
                onChange={(e) =>
                  handleAdditionalCertificatesChange(e.target.files)
                }
              />
              {data.additional_certificates &&
                data.additional_certificates.length > 0 && (
                  <div className="space-y-2">
                    {data.additional_certificates.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-green-600">
                            {file.name} ({formatFileSize(file.size)})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdditionalCertificate(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              {errors.additional_certificates && (
                <p className="text-sm text-red-600">
                  {errors.additional_certificates}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Puedes subir hasta 5 certificados adicionales (diplomados,
                especialidades, etc.). Formatos permitidos: PDF, PNG, JPG, JPEG.
                Tamaño máximo: 5MB por archivo.
              </p>
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
