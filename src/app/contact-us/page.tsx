export default function ContactUsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Contáctanos</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Información de Contacto
          </h2>
          <div className="space-y-3">
            <p className="text-gray-600">
              <strong>Email:</strong> info@floraurora-salud.com
            </p>
            <p className="text-gray-600">
              <strong>Teléfono:</strong> +56 9 1234 5678
            </p>
            <p className="text-gray-600">
              <strong>Horario:</strong> Lunes a Viernes, 9:00 - 18:00
            </p>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Envíanos un Mensaje
          </h2>
          <p className="text-gray-600">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en
            contactarnos. Nuestro equipo estará encantado de ayudarte.
          </p>
        </div>
      </div>
    </div>
  );
}
