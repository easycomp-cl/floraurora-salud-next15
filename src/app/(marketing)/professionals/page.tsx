export default function ProfessionalsPage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-green-600 to-teal-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Profesionales
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Conoce al equipo de profesionales de la salud, psicólogos especializados, todos certificados y con experiencia en terapia online.
          </p>
        </div>
      </section>

      {/* Professionals Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dr. María González */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Dra. María González
                </h3>
                <p className="text-blue-600 font-semibold mb-3">
                  Psicóloga Clínica
                </p>
                <p className="text-gray-600 mb-4">
                  Especialista en terapia cognitivo-conductual con más de 8 años
                  de experiencia en el tratamiento de ansiedad, depresión y
                  trastornos del estado de ánimo.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terapia Individual
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Adultos y Adolescentes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Español e Inglés
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Agendar con María
                </button>
              </div>
            </div>

            {/* Dr. Carlos Rodríguez */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-green-100 to-teal-200 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Dr. Carlos Rodríguez
                </h3>
                <p className="text-green-600 font-semibold mb-3">
                  Psicólogo de Parejas
                </p>
                <p className="text-gray-600 mb-4">
                  Experto en terapia sistémica y familiar con especialización en
                  mediación de conflictos y fortalecimiento de relaciones.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terapia de Pareja
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    10+ años de experiencia
                  </div>
                </div>
                <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                  Agendar con Carlos
                </button>
              </div>
            </div>

            {/* Dra. Ana Silva */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
                <svg
                  className="w-24 h-24 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Dra. Ana Silva
                </h3>
                <p className="text-purple-600 font-semibold mb-3">
                  Psicóloga Infantil
                </p>
                <p className="text-gray-600 mb-4">
                  Especialista en desarrollo infantil y adolescente con enfoque
                  en trastornos del comportamiento y apoyo emocional familiar.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Niños y Adolescentes
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-green-500 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Certificada en TCC
                  </div>
                </div>
                <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  Agendar con Ana
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para comenzar tu camino hacia el bienestar?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Nuestros profesionales están aquí para ayudarte. Agenda tu primera
            sesión y descubre cómo podemos apoyarte en tu crecimiento personal.
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
            Agendar Primera Sesión
          </button>
        </div>
      </section>
    </div>
  );
}
