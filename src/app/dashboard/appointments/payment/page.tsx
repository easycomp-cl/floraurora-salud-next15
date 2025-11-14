"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import WebpayRedirectForm from "@/components/payments/WebpayRedirectForm";

/**
 * Página intermedia que maneja la redirección a Webpay
 * Esta página muestra un loading mientras redirige al usuario al formulario de pago de Transbank
 */
export default function PaymentRedirectPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const url = searchParams.get("url");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !url) {
      setError("Información de pago incompleta. Por favor, intenta nuevamente.");
    }
  }, [token, url]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-sm p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-red-600">Error</h1>
          <p className="text-gray-600">{error}</p>
          <a
            href="/dashboard/appointments"
            className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Volver a agendar
          </a>
        </div>
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return <WebpayRedirectForm token={token} url={decodeURIComponent(url)} />;
}

