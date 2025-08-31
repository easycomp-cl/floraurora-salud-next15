// mover el hero.tsx aquí
import React from "react";
import Image from "next/image";
import niceImg from "../../Fotos/trabajo.jpg";
import logoImge from "../../Fotos/logoImge.jpg";
// Puedes reemplazar estas imágenes por las de cada profesional
import prof1 from "../../Fotos/nice.jpg";
import prof2 from "../../Fotos/nice.jpg";
import prof3 from "../../Fotos/nice.jpg";




export default function Hero() {
  return (
    <>
      {/* Hero Section: logo siempre visible, foto de fondo */}
    <section className="relative min-h-[350px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* Fondo izquierdo celeste en desktop, imagen de fondo en mobile */}
        <div className="absolute inset-0 w-full h-full z-0 flex">
          {/* Izquierda celeste */}
      <div className="hidden md:block w-1/2 h-full bg-teal-100" />
          {/* Derecha imagen */}
          <div className="w-full md:w-1/2 h-full relative">
            <Image
              src={niceImg}
              alt="Fondo Hero FlorAurora Salud"
              fill
              className="object-cover object-center md:object-right md:opacity-100 opacity-40 transition-opacity duration-300"
              priority
            />
          </div>
        </div>
        {/* Contenido sobre el fondo */}
        <div className="relative z-10 w-full flex justify-center md:justify-start">
          {/* Contenedor centrado en el bloque celeste */}
          <div
            className="flex flex-col items-center md:items-start justify-center gap-4 max-w-xl w-full px-6 py-10 md:px-12 md:py-0 md:ml-0 md:mr-auto md:w-1/2"
          >
            <Image src={logoImge} alt="Logo FlorAurora Salud" width={80} height={80} className="mb-4" priority />
            <h1 className="text-4xl md:text-5xl font-bold text-primary-900 leading-tight text-center md:text-left">
              FlorAurora <br /> Salud
            </h1>
            <p className="text-lg md:text-xl text-primary-700 mb-4 text-center md:text-left">
              Cuidamos el bienestar de las personas,<br />desde la raíz
            </p>
            <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded shadow w-fit">
              Agenda una consulta
            </button>
          </div>
        </div>
      </section>

      {/* Comprometidos contigo - preparado para fondo responsive y logo arriba */}
      <section
        className="relative py-12 px-4 md:px-16 text-center bg-white"
      >
        {/* Fondo responsive: reemplaza bg-[url()] por la imagen que quieras */}
        <div className="absolute inset-0 w-full h-full z-0 bg-no-repeat bg-cover bg-center bg-fixed md:bg-[url('/ruta/fondo-escritorio.jpg')] bg-[url('/ruta/fondo-movil.jpg')] opacity-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4 max-w-3xl mx-auto">
          <div className="mb-2">
            <Image src={logoImge} alt="Logo FlorAurora Salud" width={64} height={64} className="mx-auto" priority />
          </div>
          <h2 className="text-3xl font-bold text-primary-900">Comprometidos contigo</h2>
          <p className="text-lg text-primary-700">
            FlorAurora Salud es el servicio online de atención psicológica y médica más confiable del país. Contamos con un equipo de expertos altamente capacitados, plataformas modernas y un compromiso inquebrantable con el bienestar de nuestros pacientes.
          </p>
          <button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded shadow">
            Más información
          </button>
        </div>
      </section>

      {/* Nuestros servicios */}
      <section className="bg-teal-100 py-12 px-4 md:px-16">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-xl font-semibold text-teal-900 mb-2 uppercase tracking-wide">Nuestros servicios</h3>
          <p className="mb-8 text-lg text-teal-900">FlorAurora Salud ofrece atención de primera.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Servicio 1 */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <Image
                src={logoImge}
                alt="Logo FlorAurora Salud"
                width={48}
                height={48}
                className="object-contain mb-2"
                priority
              />
              <h4 className="font-bold text-lg text-teal-900 mb-1">Psicoterapia Infanto Juvenil</h4>
              <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">
                Agendar
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2"/><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14"/></svg>
              </button>
            </div>
            {/* Servicio 2 */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <Image
                src={logoImge}
                alt="Logo FlorAurora Salud"
                width={48}
                height={48}
                className="object-contain mb-2"
                priority
              />
              <h4 className="font-bold text-lg text-teal-900 mb-1">Psicoterapia Adultos</h4>
              <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">
                Agendar
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2"/><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14"/></svg>
              </button>
            </div>
            {/* Servicio 3 */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <Image
                src={logoImge}
                alt="Logo FlorAurora Salud"
                width={48}
                height={48}
                className="object-contain mb-2"
                priority
              />
              <h4 className="font-bold text-lg text-teal-900 mb-1">Terapia de Pareja</h4>
              <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">
                Agendar
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2"/><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14"/></svg>
              </button>
            </div>
            {/* Servicio 4 */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
              <Image
                src={logoImge}
                alt="Logo FlorAurora Salud"
                width={48}
                height={48}
                className="object-contain mb-2"
                priority
              />
              <h4 className="font-bold text-lg text-teal-900 mb-1">Evaluación y Psicodiagnóstico</h4>
              <button className="mt-2 bg-purple-700 hover:bg-purple-800 text-white py-1 px-4 rounded flex items-center gap-2">
                Agendar
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" stroke="#fff" strokeWidth="2" rx="2"/><path stroke="#fff" strokeWidth="2" d="M8 7v2m8-2v2M5 11h14"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Conoce a nuestros profesionales */}
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
    </>
  );
}
 