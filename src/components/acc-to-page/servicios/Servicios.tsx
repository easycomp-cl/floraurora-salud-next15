"use client";

import { User, Heart, Users, Check } from "lucide-react";
import Image from "next/image";
import { Target, Eye } from "lucide-react";
import React from "react";
import niceImg from "../../Fotos/trabajo.jpg";
import logoImge from "../../Fotos/logo.png";
import prof1 from "../../Fotos/nice.jpg";
import prof2 from "../../Fotos/nice.jpg";
import prof3 from "../../Fotos/nice.jpg";

export default function Servicios() {
  return (
    <section id="servicios" className="w-full relative">
      <div className="absolute left-8 top-8">
        <Image
          src={logoImge}
          alt="Logo FlorAurora"
          className="w-20 h-20 object-contain"
          width={80}
          height={80}
          priority
        />
      </div>
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold">Nuestros Servicios</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          Contamos con distintas especialidades en atención de salud mental para
          ajustarnos a tus necesidades.
        </p>
      </div>

      {/* Tarjetas */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid gap-8 md:grid-cols-4">
        {/* Tarjeta 1 */}
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="text-blue-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold">
              PSICOTERAPIA INFANTO JUVENIL
            </h3>
            <p className="mt-2 text-gray-600 text-sm">
              La psicoterapia Infanto juvenil es una intervención psicológica
              orientada a diagnosticar y tratar problemas emocionales,
              conductuales, sociales y del desarrollo tanto en niños como en
              adolescentes, a través de herramientas adecuadas a la edad del
              paciente, trabajando con la familia cada vez que fuere necesario.
              Contamos con profesionales capacitados para responder a las
              necesidades psicoterapéuticas tanto de niños como adolescentes.
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Ansiedad y estrés
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Depresión
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Problemas de
                autoestima
              </li>
            </ul>
          </div>
          <button className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition">
            Agendar Sesión
          </button>
        </div>

        {/* Tarjeta 2 */}
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Heart className="text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold">PSICOTERAPIA ADULTOS</h3>
            <p className="mt-2 text-gray-600 text-sm">
              La psicoterapia es una intervención a través de técnicas
              psicológicas y dialógicas, que tiene como finalidad aliviar
              conflictos emocionales, así como la comprensión y modificación de
              pensamientos y conductas disfuncionales que pudieran afectar en
              relaciones interpersonales, toma de decisiones y confrontación de
              situaciones de la vida cotidiana.Te invitamos a conocer a los
              profesionales que trabajan en FlorAurora.
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Comunicación
                efectiva
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Resolución de
                conflictos
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Intimidad emocional
              </li>
            </ul>
          </div>
          <button className="mt-6 w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition">
            Agendar Sesión
          </button>
        </div>

        {/* Tarjeta 3 */}
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="text-purple-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold">TERAPIA DE PAREJA</h3>
            <p className="mt-2 text-gray-600 text-sm">
              llevada a cabo por psicólogos formados en este tipo de
              intervención, y su objetivo es el desarrollo de una mejor
              comunicación, la modificación de conductas poco funcionales en el
              vínculo y la construcción de una relación saludable y
              satisfactoria, respondiendo a las necesidades de ambos miembros de
              la pareja. El psicólogo a cargo cumple con un rol neutral que
              favorece la construcción de dichas habilidades.
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Dinámicas
                familiares
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Resolución de
                conflictos
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Comunicación
                familiar
              </li>
            </ul>
          </div>
          <button className="mt-6 w-full bg-purple-600 text-white font-semibold py-2 rounded-md hover:bg-purple-700 transition">
            Agendar Sesión
          </button>
        </div>
        {/* Tarjeta 4: Evaluación y Psicodiagnóstico */}
        <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Eye className="text-yellow-600" />
            </div>
            <h3 className="mt-4 text-xl font-bold">
              EVALUACIÓN Y PSICODIAGNÓSTICO
            </h3>
            <p className="mt-2 text-gray-600 text-sm">
              Es el proceso llevado a cabo por un psicólogo especializado para
              comprender la estructura de personalidad, funcionamiento cognitivo
              y posibles trastornos en un individuo, a través de un proceso
              metódico y estructurado y la aplicación de baterías y test para
              cada necesidad específica.
            </p>
            <ul className="mt-4 space-y-2 text-gray-600 text-sm">
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Evaluación de
                personalidad
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Diagnóstico de
                trastornos
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-green-500 w-4 h-4" /> Aplicación de test
                psicológicos
              </li>
            </ul>
          </div>
          <button className="mt-6 w-full bg-yellow-600 text-white font-semibold py-2 rounded-md hover:bg-yellow-700 transition">
            Agendar Sesión
          </button>
        </div>
      </div>
    </section>
  );
}
