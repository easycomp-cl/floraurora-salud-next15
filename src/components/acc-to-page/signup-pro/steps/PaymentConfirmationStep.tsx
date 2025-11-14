"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { signupPro } from "@/lib/auth-actions";
import type {
  PersonalDataFormData,
  AcademicDataFormData,
  DocumentsFormData,
  PaymentPlanFormData,
} from "@/lib/validations/professional-signup";

// Función helper para subir archivos a través de la API (server-side con admin client)
const uploadFileToStorage = async (
  file: File,
  folder: string,
  tempUserId: string
): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("tempUserId", tempUserId);

    const response = await fetch("/api/upload/document", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error al subir archivo:", errorData.error || response.statusText);
      return null;
    }

    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error("Error al procesar archivo:", error);
    return null;
  }
};

interface PaymentConfirmationStepProps {
  onPrevious: () => void;
  stepData: {
    personalData: PersonalDataFormData;
    academicData: AcademicDataFormData;
    documents: DocumentsFormData;
    paymentPlan: PaymentPlanFormData;
  };
}

type ConfirmationStatus = "processing" | "success" | "failed";

export default function PaymentConfirmationStep({
  onPrevious,
  stepData,
}: PaymentConfirmationStepProps) {
  const router = useRouter();
  const [confirmationStatus, setConfirmationStatus] =
    useState<ConfirmationStatus>("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enviar formulario automáticamente al montar el componente
  useEffect(() => {
    const submitForm = async () => {
      try {
        setConfirmationStatus("processing");
        setErrorMessage(null);

        // Generar un ID temporal para organizar los archivos antes de crear el usuario
        const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // 1. Subir archivos directamente a Supabase Storage desde el cliente
        const uploadPromises: Promise<string | null>[] = [];
        
        if (stepData.documents.degree_copy) {
          uploadPromises.push(
            uploadFileToStorage(stepData.documents.degree_copy, "professional-degrees", tempUserId)
          );
        } else {
          uploadPromises.push(Promise.resolve(null));
        }

        if (stepData.documents.id_copy) {
          uploadPromises.push(
            uploadFileToStorage(stepData.documents.id_copy, "id-copies", tempUserId)
          );
        } else {
          uploadPromises.push(Promise.resolve(null));
        }

        if (stepData.documents.professional_certificate) {
          uploadPromises.push(
            uploadFileToStorage(stepData.documents.professional_certificate, "professional-certificates", tempUserId)
          );
        } else {
          uploadPromises.push(Promise.resolve(null));
        }

        const [degree_copy_url, id_copy_url, professional_certificate_url] = await Promise.all(uploadPromises);

        // Subir certificados adicionales si existen
        let additional_certificates_urls: string[] = [];
        if (stepData.documents.additional_certificates && stepData.documents.additional_certificates.length > 0) {
          const additionalUploadPromises = stepData.documents.additional_certificates.map((file) =>
            uploadFileToStorage(file, "additional-certificates", tempUserId)
          );
          const additionalUrls = await Promise.all(additionalUploadPromises);
          additional_certificates_urls = additionalUrls.filter((url): url is string => url !== null);
        }

        // 2. Crear FormData con todos los datos (sin archivos, solo URLs)
        const formData = new FormData();

        // Datos personales
        formData.append("first_name", stepData.personalData.first_name);
        formData.append("last_name_p", stepData.personalData.last_name_p);
        formData.append("last_name_m", stepData.personalData.last_name_m);
        formData.append("rut", stepData.personalData.rut);
        formData.append("birth_date", stepData.personalData.birth_date);
        formData.append("email", stepData.personalData.email);
        formData.append("phone_number", stepData.personalData.phone_number);

        // Datos académicos
        formData.append("university", stepData.academicData.university);
        formData.append("profession", stepData.academicData.profession);
        formData.append("study_year_start", stepData.academicData.study_year_start);
        formData.append("study_year_end", stepData.academicData.study_year_end);
        formData.append("extra_studies", stepData.academicData.extra_studies || "");
        formData.append("superintendence_number", stepData.academicData.superintendence_number);

        // URLs de archivos (ya subidos)
        if (degree_copy_url) {
          formData.append("degree_copy_url", degree_copy_url);
        }
        if (id_copy_url) {
          formData.append("id_copy_url", id_copy_url);
        }
        if (professional_certificate_url) {
          formData.append("professional_certificate_url", professional_certificate_url);
        }
        if (additional_certificates_urls.length > 0) {
          formData.append("additional_certificates_urls", JSON.stringify(additional_certificates_urls));
        }
        formData.append("temp_user_id", tempUserId); // Para reorganizar archivos después

        // 3. Enviar formulario (solo datos y URLs, no archivos)
        await signupPro(formData);

        // Si llegamos aquí, fue exitoso (signupPro redirige)
        setConfirmationStatus("success");
      } catch (error) {
        console.error("Error al enviar formulario:", error);
        setConfirmationStatus("failed");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Error al enviar la solicitud. Por favor intenta nuevamente."
        );
      }
    };

    submitForm();
  }, [stepData, router]);

  const handleRetrySubmission = async () => {
    try {
      setConfirmationStatus("processing");
      setErrorMessage(null);

      // Generar un ID temporal para organizar los archivos antes de crear el usuario
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      // 1. Subir archivos directamente a Supabase Storage desde el cliente
      const uploadPromises: Promise<string | null>[] = [];
      
      if (stepData.documents.degree_copy) {
        uploadPromises.push(
          uploadFileToStorage(stepData.documents.degree_copy, "professional-degrees", tempUserId)
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (stepData.documents.id_copy) {
        uploadPromises.push(
          uploadFileToStorage(stepData.documents.id_copy, "id-copies", tempUserId)
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (stepData.documents.professional_certificate) {
        uploadPromises.push(
          uploadFileToStorage(stepData.documents.professional_certificate, "professional-certificates", tempUserId)
        );
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      const [degree_copy_url, id_copy_url, professional_certificate_url] = await Promise.all(uploadPromises);

      // Subir certificados adicionales si existen
      let additional_certificates_urls: string[] = [];
      if (stepData.documents.additional_certificates && stepData.documents.additional_certificates.length > 0) {
        const additionalUploadPromises = stepData.documents.additional_certificates.map((file) =>
          uploadFileToStorage(file, "additional-certificates", tempUserId)
        );
        const additionalUrls = await Promise.all(additionalUploadPromises);
        additional_certificates_urls = additionalUrls.filter((url): url is string => url !== null);
      }

      // 2. Crear FormData con todos los datos (sin archivos, solo URLs)
      const formData = new FormData();

      // Datos personales
      formData.append("first_name", stepData.personalData.first_name);
      formData.append("last_name_p", stepData.personalData.last_name_p);
      formData.append("last_name_m", stepData.personalData.last_name_m);
      formData.append("rut", stepData.personalData.rut);
      formData.append("birth_date", stepData.personalData.birth_date);
      formData.append("email", stepData.personalData.email);
      formData.append("phone_number", stepData.personalData.phone_number);

      // Datos académicos
      formData.append("university", stepData.academicData.university);
      formData.append("profession", stepData.academicData.profession);
      formData.append("study_year_start", stepData.academicData.study_year_start);
      formData.append("study_year_end", stepData.academicData.study_year_end);
      formData.append("extra_studies", stepData.academicData.extra_studies || "");
      formData.append("superintendence_number", stepData.academicData.superintendence_number);

      // URLs de archivos (ya subidos)
      if (degree_copy_url) {
        formData.append("degree_copy_url", degree_copy_url);
      }
      if (id_copy_url) {
        formData.append("id_copy_url", id_copy_url);
      }
      if (professional_certificate_url) {
        formData.append("professional_certificate_url", professional_certificate_url);
      }
      if (additional_certificates_urls.length > 0) {
        formData.append("additional_certificates_urls", JSON.stringify(additional_certificates_urls));
      }
      formData.append("temp_user_id", tempUserId); // Para reorganizar archivos después

      // 3. Enviar formulario (solo datos y URLs, no archivos)
      await signupPro(formData);

      setConfirmationStatus("success");
    } catch (error) {
      console.error("Error al reintentar envío:", error);
      setConfirmationStatus("failed");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error al enviar la solicitud. Por favor intenta nuevamente."
      );
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          Enviando Solicitud
        </CardTitle>
        <CardDescription className="text-center">
          Por favor espera mientras enviamos tu solicitud de registro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-6">
          {confirmationStatus === "processing" && (
            <>
              <div className="flex justify-center">
                <Clock className="h-16 w-16 text-blue-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-600">
                  Enviando tu solicitud...
                </h3>
                <p className="text-muted-foreground">
                  Esto puede tomar unos momentos. Por favor no cierres esta
                  ventana.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>¿Qué está pasando?</strong>
                  <br />
                  Estamos enviando tu información y documentos a nuestro equipo
                  administrativo para su revisión.
                </p>
              </div>
            </>
          )}

          {confirmationStatus === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600">
                  ¡Solicitud Enviada Exitosamente!
                </h3>
                <p className="text-muted-foreground">
                  Tu solicitud de registro profesional ha sido enviada
                  correctamente
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  Próximos pasos:
                </h4>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>
                    • Recibirás un email de confirmación en los próximos minutos
                  </li>
                  <li>
                    • Nuestro equipo administrativo revisará tu solicitud en
                    24-48 horas
                  </li>
                  <li>
                    • Una vez aprobada, recibirás el enlace de acceso a la
                    plataforma
                  </li>
                  <li>
                    • El pago se realizará después de la aprobación y validación
                    de documentos
                  </li>
                  <li>
                    • Si necesitas ayuda, contáctanos en soporte@floraurora.cl
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => (window.location.href = "/")}
                >
                  Ir al Inicio
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = "/login")}
                >
                  Iniciar Sesión
                </Button>
              </div>
            </>
          )}

          {confirmationStatus === "failed" && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-600">
                  Error al Enviar Solicitud
                </h3>
                <p className="text-muted-foreground">
                  No pudimos enviar tu solicitud en este momento
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  Error:
                </h4>
                <p className="text-sm text-red-700">
                  {errorMessage || "No pudimos enviar tu solicitud en este momento. Por favor intenta nuevamente."}
                </p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={handleRetrySubmission}>
                  Intentar Envío Nuevamente
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onPrevious}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Selección de Plan
                </Button>
              </div>
            </>
          )}

          {confirmationStatus === "processing" && (
            <div className="pt-4">
              <Button variant="outline" onClick={onPrevious} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
