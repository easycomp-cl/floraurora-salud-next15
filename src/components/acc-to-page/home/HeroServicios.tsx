import React from "react";
import Image from "next/image";
import icoInfantoJuvenil from "../../Fotos/infanto-juvenil.png";
import icoAdultos from "../../Fotos/adultos.png";
import icoPareja from "../../Fotos/pareja.png";
import icoEvaluacion from "../../Fotos/evaluacion.png";
import { Calendar } from "lucide-react";

export default function HeroServicios() {
  return (
    <section className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Nuestros Servicios
          </h3>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full mb-4"></div>
          <p className="text-lg md:text-xl text-teal-900 max-w-3xl mx-auto">
            FlorAurora Salud ofrece atención de primera calidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Servicio 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoInfantoJuvenil}
                alt="Psicoterapia Infanto Juvenil"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Psicoterapia <br /> Infanto Juvenil
            </h4>
            <button className="mt-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transform transition-all hover:scale-105">
              <Calendar className="size-4" />
              Agendar
            </button>
          </div>

          {/* Servicio 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoAdultos}
                alt="Psicoterapia Adultos"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Psicoterapia <br /> Adultos
            </h4>
            <button className="mt-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transform transition-all hover:scale-105">
              <Calendar className="size-4" />
              Agendar
            </button>
          </div>

          {/* Servicio 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoPareja}
                alt="Terapia de Pareja"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Terapia <br /> de Pareja
            </h4>
            <button className="mt-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transform transition-all hover:scale-105">
              <Calendar className="size-4" />
              Agendar
            </button>
          </div>

          {/* Servicio 4 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoEvaluacion}
                alt="Evaluación y Psicodiagnóstico"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Evaluación y <br /> Psicodiagnóstico
            </h4>
            <button className="mt-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transform transition-all hover:scale-105">
              <Calendar className="size-4" />
              Agendar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
