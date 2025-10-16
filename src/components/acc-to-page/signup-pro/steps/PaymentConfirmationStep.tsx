"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

interface PaymentConfirmationStepProps {
  onPrevious: () => void;
}

type ConfirmationStatus = "processing" | "success" | "failed";

export default function PaymentConfirmationStep({
  onPrevious,
}: PaymentConfirmationStepProps) {
  const [confirmationStatus, setConfirmationStatus] =
    useState<ConfirmationStatus>("processing");

  // Generar número de solicitud aleatorio
  const requestNumber = Math.floor(Math.random() * 900000) + 100000;

  // Simular el proceso de envío automáticamente al montar el componente
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Simular éxito o fallo aleatorio (en producción esto vendría del servidor)
      const success = Math.random() > 0.1; // 90% de éxito
      setConfirmationStatus(success ? "success" : "failed");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetrySubmission = () => {
    setConfirmationStatus("processing");
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% de éxito en reintento
      setConfirmationStatus(success ? "success" : "failed");
    }, 1500);
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
                  Número de Solicitud: #{requestNumber}
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Guarda este número para futuras consultas
                </p>
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
                  Posibles causas:
                </h4>
                <ul className="text-sm text-red-700 space-y-1 text-left">
                  <li>• Problemas de conectividad</li>
                  <li>• Error en el servidor</li>
                  <li>• Archivos demasiado grandes</li>
                  <li>• Información incompleta</li>
                </ul>
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
