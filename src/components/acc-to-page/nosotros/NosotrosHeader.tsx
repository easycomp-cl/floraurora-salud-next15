"use client";

import Image from "next/image";
import logoImge from "../../Fotos/logo.png";
import niceImg from "../../Fotos/nosotros.jpg";

export default function NosotrosHeader() {
  return (
    <div className="relative h-[340px] md:h-[420px]">
      <Image
        src={niceImg}
        alt="Equipo FlorAurora"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-white/55" />
      <div className="relative z-10 h-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center">
        <Image
          src={logoImge}
          alt="Logo FlorAurora Salud"
          width={70}
          height={70}
          className="absolute top-6 left-6 z-20 rounded-md shadow-md bg-white"
          priority
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 w-full text-center">
          Nosotros
        </h1>
        <p className="mt-4 max-w-3xl text-base md:text-lg text-gray-700">
          FlorAurora Salud es un servicio online que conecta a consultantes con profesionales de la salud, a través de una plataforma confiable y segura, que entrega una experiencia única y cercana en el vínculo terapéutico, con un compromiso inquebrantable con el bienestar de aquellos que más lo necesitan.
        </p>
      </div>
    </div>
  );
}
