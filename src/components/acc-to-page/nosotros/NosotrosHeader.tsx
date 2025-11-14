"use client";

import Image from "next/image";
import logoImge from "../../Fotos/logo.png";
import niceImg from "../../Fotos/nosotros.jpg";

export default function NosotrosHeader() {
  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      <Image
        src={niceImg}
        alt="Equipo FlorAurora"
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
              Nosotros
            </h1>
            <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full shadow-lg"></div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed drop-shadow-xl font-normal">
              FlorAurora Salud es un servicio online que conecta a consultantes con profesionales de la salud, a través de una plataforma confiable y segura, que entrega una experiencia única y cercana en el vínculo terapéutico, con un compromiso inquebrantable con el bienestar de aquellos que más lo necesitan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
