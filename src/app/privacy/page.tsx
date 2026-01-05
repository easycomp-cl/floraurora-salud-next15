import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad - FlorAurora Salud",
  description:
    "Política de privacidad y protección de datos de FlorAurora Salud",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Política de Privacidad
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Información General
              </h2>
              <p className="text-gray-600 mb-4">
                En FlorAurora Salud, valoramos y protegemos su privacidad. Esta
                política describe cómo recopilamos, utilizamos, almacenamos y
                protegemos su información personal cuando utiliza nuestra
                plataforma de servicios de salud mental.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Información que Recopilamos
              </h2>
              <p className="text-gray-600 mb-4">
                Recopilamos los siguientes tipos de información:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>
                  <strong>Información de registro:</strong> Nombre, email,
                  teléfono
                </li>
                <li>
                  <strong>Información de perfil:</strong> Fecha de nacimiento,
                  dirección, RUT
                </li>
                <li>
                  <strong>Información de salud:</strong> Datos médicos
                  relevantes para el tratamiento
                </li>
                <li>
                  <strong>Información de uso:</strong> Registros de sesiones y
                  actividad en la plataforma
                </li>
                <li>
                  <strong>Información técnica:</strong> Dirección IP, tipo de
                  dispositivo, navegador
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Cómo Utilizamos su Información
              </h2>
              <p className="text-gray-600 mb-4">
                Utilizamos su información personal para:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>
                  Proporcionar y mejorar nuestros servicios de salud mental
                </li>
                <li>
                  Conectarlo con profesionales de la salud mental apropiados
                </li>
                <li>Programar y gestionar citas</li>
                <li>Procesar pagos y facturación</li>
                <li>
                  Comunicarnos con usted sobre servicios y actualizaciones
                </li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Compartir Información
              </h2>
              <p className="text-gray-600 mb-4">
                No vendemos, alquilamos ni compartimos su información personal
                con terceros, excepto en las siguientes circunstancias:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>
                  Con profesionales de la salud mental para proporcionar
                  servicios
                </li>
                <li>
                  Con proveedores de servicios que nos ayudan a operar la
                  plataforma
                </li>
                <li>
                  Cuando sea requerido por ley o para proteger nuestros derechos
                </li>
                <li>Con su consentimiento explícito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Seguridad de la Información
              </h2>
              <p className="text-gray-600 mb-4">
                Implementamos medidas de seguridad técnicas, administrativas y
                físicas para proteger su información personal, incluyendo:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de sistemas de seguridad</li>
                <li>Capacitación del personal en protección de datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. Sus Derechos
              </h2>
              <p className="text-gray-600 mb-4">Usted tiene derecho a:</p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Acceder a su información personal</li>
                <li>Corregir información inexacta</li>
                <li>Eliminar su información personal</li>
                <li>Restringir el procesamiento de su información</li>
                <li>Portabilidad de datos</li>
                <li>Oponerse al procesamiento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. Retención de Datos
              </h2>
              <p className="text-gray-600 mb-4">
                Conservamos su información personal durante el tiempo necesario
                para cumplir con los propósitos descritos en esta política,
                cumplir con obligaciones legales, resolver disputas y hacer
                cumplir nuestros acuerdos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. Cookies y Tecnologías Similares
              </h2>
              <p className="text-gray-600 mb-4">
                Utilizamos cookies y tecnologías similares para mejorar su
                experiencia en nuestra plataforma, analizar el uso y
                personalizar el contenido. Puede configurar su navegador para
                rechazar cookies, aunque esto puede afectar la funcionalidad.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. Cambios a esta Política
              </h2>
              <p className="text-gray-600 mb-4">
                Podemos actualizar esta política de privacidad ocasionalmente.
                Le notificaremos sobre cambios significativos a través de la
                plataforma o por email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. Contacto
              </h2>
              <p className="text-gray-600 mb-4">
                Si tiene preguntas sobre esta política de privacidad o desea
                ejercer sus derechos, puede contactarnos en:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacidad@floraurorasalud.cl
                  <br />
                  <strong>Teléfono:</strong> +1 (555) 123-4567
                  <br />
                  <strong>Dirección:</strong> [Dirección de la empresa]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
