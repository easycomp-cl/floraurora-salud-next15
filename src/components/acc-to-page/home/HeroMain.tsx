import React from "react";
import Image from "next/image";
import niceImg from "../../Fotos/trabajo.jpg";
import logoImge from "../../Fotos/logo.png";

export default function HeroMain() {
  return (
    <section className="relative min-h-[350px] md:min-h-[400px] w-full overflow-hidden grid md:grid-cols-2">
      {/* Fondo y foto */}
      <div className="absolute inset-0 w-full h-full z-0 grid md:grid-cols-2">
        <div className="hidden md:block w-full h-full bg-teal-100" />
        <div className="w-full h-full relative">
          <Image
            src={niceImg}
            alt="Fondo Hero FlorAurora Salud"
            fill
            className="object-cover object-center md:object-right md:opacity-100 opacity-40 transition-opacity duration-300"
            priority
          />
        </div>
      </div>
      {/* Contenido principal centrado en la columna izquierda */}
      <div className="relative z-10 flex items-center justify-center w-full">
        <div className="flex flex-col items-center justify-center gap-4 max-w-xl w-full px-6 py-10 md:px-12 md:py-0">
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={80}
            height={80}
            className="mb-4"
            priority
          />
          <h1 className="text-4xl md:text-5xl font-bold text-primary-900 leading-tight text-center">
            FlorAurora <br /> Salud
          </h1>
          <p className="text-lg md:text-xl text-primary-700 mb-4 text-center">
            Cuidamos el bienestar de las personas,<br />desde la raíz
          </p>
          <button className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded shadow w-fit">
            Agenda una consulta
          </button>
        </div>
      </div>
      
      {/* Columna derecha vacía para mantener el espacio */}
      <div className="hidden md:block" />
    </section>
  );
}
