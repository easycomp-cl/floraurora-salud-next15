"use client";

import Image from "next/image";
import { Check, User } from "lucide-react";
import logoImge from "../../../components/Fotos/logo.png";
import equipoImg from "../../../components/Fotos/Equipo.png";

export default function ProfessionalsPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header Section con estilo similar a Nosotros */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={equipoImg}
          alt="Equipo de Profesionales FlorAurora"
          fill
          priority
          className="object-cover brightness-90"
        />
        {/* Overlay oscuro pero balanceado para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/65 via-teal-900/70 to-gray-900/65" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={80}
            height={80}
            className="absolute top-6 left-6 md:top-8 md:left-8 z-20 rounded-lg shadow-xl bg-white p-2"
            priority
          />
          
          {/* Contenido principal */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
                Profesionales
              </h1>
              <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full shadow-lg"></div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed drop-shadow-xl font-normal">
                Conoce al equipo de profesionales de la salud, psicólogos especializados, todos certificados y con experiencia en terapia online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Grid */}
      <section className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Dr. María González */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dra. María González
                </h3>
                <p className="text-blue-600 font-semibold mb-4 text-lg">
                  Psicóloga Clínica
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Especialista en terapia cognitivo-conductual con más de 8 años
                  de experiencia en el tratamiento de ansiedad, depresión y
                  trastornos del estado de ánimo.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Individual
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Adultos y Adolescentes
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Español e Inglés
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
                  Agendar con María
                </button>
              </div>
            </div>

            {/* Dr. Carlos Rodríguez */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-teal-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dr. Carlos Rodríguez
                </h3>
                <p className="text-teal-600 font-semibold mb-4 text-lg">
                  Psicólogo de Parejas
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Experto en terapia sistémica y familiar con especialización en
                  mediación de conflictos y fortalecimiento de relaciones.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia de Pareja
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    10+ años de experiencia
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg">
                  Agendar con Carlos
                </button>
              </div>
            </div>

            {/* Dra. Ana Silva */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-purple-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dra. Ana Silva
                </h3>
                <p className="text-purple-600 font-semibold mb-4 text-lg">
                  Psicóloga Infantil
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Especialista en desarrollo infantil y adolescente con enfoque
                  en trastornos del comportamiento y apoyo emocional familiar.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Niños y Adolescentes
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Certificada en TCC
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg">
                  Agendar con Ana
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-teal-100/50 via-teal-50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 md:px-12 md:py-14 transform transition-all hover:shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide mb-6">
              ¿Listo para comenzar tu camino hacia el bienestar?
            </h2>
            <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
              Nuestros profesionales están aquí para ayudarte. Agenda tu primera
              sesión y descubre cómo podemos apoyarte en tu crecimiento personal.
            </p>
            <button className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg">
              Agendar Primera Sesión
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
