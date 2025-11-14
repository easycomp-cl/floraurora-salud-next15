import React from "react";
import Image from "next/image";
import prof1 from "../../Fotos/Ps. Gianina Soto.jpg";
import prof2 from "../../Fotos/Ps. Jaime Correa.png";
import prof3 from "../../Fotos/Ps. Sandra Herrera.jpg";
import { Users } from "lucide-react";

export default function HeroProfesionales() {
  return (
    <section className="bg-gradient-to-br from-teal-100/50 via-white to-teal-50/30 py-16 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 md:mb-8 shadow-lg">
            <Users className="size-12 md:size-14 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Conoce a los Profesionales
          </h3>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Profesional 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-teal-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
              <Image
                src={prof1}
                alt="Ps. Gianina Soto"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-2 text-center">
              Ps. Gianina Soto
            </h4>
            <p className="text-sm font-semibold text-teal-700 mb-3 uppercase tracking-wide">
              Psicoterapia
            </p>
            <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
              La Ps. Soto cuenta con más de 15 años de experiencia en las áreas
              de psicología y salud mental.
            </p>
            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
              U. de Chile
            </span>
          </div>
          
          {/* Profesional 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-teal-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
              <Image
                src={prof2}
                alt="Ps. Jaime Correa"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-2 text-center">
              Ps. Jaime Correa
            </h4>
            <p className="text-sm font-semibold text-teal-700 mb-3 uppercase tracking-wide">
              Psicoterapia Psicoanalítica
            </p>
            <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
              Como Psicólogo se especializa en psicología con enfoque psicoanalítico.
            </p>
            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
              U. Mayor
            </span>
          </div>
          
          {/* Profesional 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-teal-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200">
              <Image
                src={prof3}
                alt="Ps. Sandra Herrera"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-2 text-center">
              Ps. Sandra Herrera
            </h4>
            <p className="text-sm font-semibold text-teal-700 mb-3 uppercase tracking-wide">
              Psicoterapia Sistémica
            </p>
            <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed">
              Con más de una década de experiencia, la Ps. Herrera es la
              residente experta en salud mental.
            </p>
            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
              USACH
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
