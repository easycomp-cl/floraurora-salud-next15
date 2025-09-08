import React from "react";
import Image from "next/image";
import prof1 from "../../Fotos/Ps. Gianina Soto.jpg";
import prof2 from "../../Fotos/Ps. Jaime Correa.png";
import prof3 from "../../Fotos/Ps. Sandra Herrera.jpg";

export default function HeroProfesionales() {
  return (
    <section className="bg-teal-200 py-12 px-4 md:px-16">
      <div className="max-w-5xl mx-auto">
        <h3 className="text-3xl font-bold text-teal-900 mb-8 text-center">Conoce a nuestros profesionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profesional 1 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-teal-400 flex items-center justify-center bg-gray-200">
              <Image src={prof1} alt="Profesional 1" width={96} height={96} className="object-cover w-full h-full" />
            </div>
            <h4 className="font-bold text-lg text-teal-900 mb-1">Ps. Sandra Herrera</h4>
            <p className="text-sm text-teal-700 mb-1">PSICOTERAPIA SISTÉMICA</p>
            <p className="text-xs text-gray-600 mb-2">Con más de una década de experiencia, la Ps. Herrera es la residente experta en salud mental.</p>
            <span className="text-xs text-gray-500">USACH</span>
          </div>
          {/* Profesional 2 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-teal-400 flex items-center justify-center bg-gray-200">
              <Image src={prof2} alt="Profesional 2" width={96} height={96} className="object-cover w-full h-full" />
            </div>
            <h4 className="font-bold text-lg text-teal-900 mb-1">Ps. Jaime Correa</h4>
            <p className="text-sm text-teal-700 mb-1">PSICOTERAPIA PSICOANALÍTICA</p>
            <p className="text-xs text-gray-600 mb-2">Como Psicólogo se especializa en psicología.</p>
            <span className="text-xs text-gray-500">U. Mayor</span>
          </div>
          {/* Profesional 3 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-teal-400 flex items-center justify-center bg-gray-200">
              <Image src={prof3} alt="Profesional 3" width={96} height={96} className="object-cover w-full h-full" />
            </div>
            <h4 className="font-bold text-lg text-teal-900 mb-1">Ps. Gianina Soto</h4>
            <p className="text-sm text-teal-700 mb-1">PSICOTERAPIA</p>
            <p className="text-xs text-gray-600 mb-2">La Ps. Soto cuenta con más de 15 años de experiencia en las áreas de psicología y salud mental.</p>
            <span className="text-xs text-gray-500">U. de Chile</span>
          </div>
        </div>
      </div>
    </section>
  );
}
