import React from "react";
import Image from "next/image";
import icoInfantoJuvenil from "../../Fotos/infanto-juvenil.png";
import icoAdultos from "../../Fotos/adultos.png";
import icoPareja from "../../Fotos/pareja.png";
import icoEvaluacion from "../../Fotos/evaluacion.png";

export default function HeroServicios() {
  return (
    <section className="bg-teal-100 py-12 px-4 md:px-16">
      <div className="max-w-5xl mx-auto">
        <h3 className="text-xl font-semibold text-teal-900 mb-2 uppercase tracking-wide">Nuestros servicios</h3>
        <p className="mb-8 text-lg text-teal-900">FlorAurora Salud ofrece atención de primera.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Servicio 1 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <Image src={icoInfantoJuvenil} alt="Logo FlorAurora Salud" width={48} height={48} className="object-contain mb-2" priority />
            <h4 className="font-bold text-lg text-teal-900 mb-1 text-center">Psicoterapia <br /> Infanto Juvenil</h4>
            <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">Agendar<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2" /><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14" /></svg></button>
          </div>
          {/* Servicio 2 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <Image src={icoAdultos} alt="Logo FlorAurora Salud" width={48} height={48} className="object-contain mb-2" priority />
            <h4 className="font-bold text-lg text-teal-900 mb-1 text-center">Psicoterapia <br /> Adultos</h4>
            <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">Agendar<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2" /><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14" /></svg></button>
          </div>
          {/* Servicio 3 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <Image src={icoPareja} alt="Logo FlorAurora Salud" width={48} height={48} className="object-contain mb-2" priority />
            <h4 className="font-bold text-lg text-teal-900 mb-1 text-center">Terapia <br /> de Pareja</h4>
            <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">Agendar<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2" /><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14" /></svg></button>
          </div>
          {/* Servicio 4 */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
            <Image src={icoEvaluacion} alt="Logo FlorAurora Salud" width={48} height={48} className="object-contain mb-2" priority />
            <h4 className="font-bold text-lg text-teal-900 mb-1 text-center">Evaluación y <br /> Psicodiagnóstico</h4>
            <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">Agendar<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2" /><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14" /></svg></button>
          </div>
        </div>
      </div>
    </section>
  );
}
