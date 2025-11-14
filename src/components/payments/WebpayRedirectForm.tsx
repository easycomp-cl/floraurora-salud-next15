"use client";

import { useEffect } from "react";

interface WebpayRedirectFormProps {
  token: string;
  url: string;
}

/**
 * Componente que redirige automáticamente al usuario a Webpay
 * usando un formulario POST según las especificaciones de Transbank
 */
export default function WebpayRedirectForm({ token, url }: WebpayRedirectFormProps) {
  useEffect(() => {
    // Crear formulario dinámicamente y enviarlo
    const form = document.createElement("form");
    form.method = "POST";
    form.action = url;

    // Agregar el token como campo oculto
    const tokenInput = document.createElement("input");
    tokenInput.type = "hidden";
    tokenInput.name = "token_ws";
    tokenInput.value = token;
    form.appendChild(tokenInput);

    // Agregar el formulario al DOM y enviarlo
    document.body.appendChild(form);
    form.submit();

    // Limpiar el formulario después de enviarlo
    return () => {
      document.body.removeChild(form);
    };
  }, [token, url]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 className="text-xl font-semibold text-gray-900">
          Redirigiendo a Webpay...
        </h2>
        <p className="text-gray-600">
          Serás redirigido al formulario de pago seguro de Transbank en unos momentos.
        </p>
        <p className="text-sm text-gray-500">
          Si no eres redirigido automáticamente, haz clic en el botón de abajo.
        </p>
        <form method="POST" action={url} className="mt-4">
          <input type="hidden" name="token_ws" value={token} />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ir a Webpay
          </button>
        </form>
      </div>
    </div>
  );
}

