"use client";

import Image from "next/image";
import { Target, Eye } from "lucide-react";
import React from "react";
import niceImg from "../../Fotos/trabajo.jpg";
import logoImge from "../../Fotos/logo.png";
import prof1 from "../../Fotos/nice.jpg";
import prof2 from "../../Fotos/nice.jpg";
import prof3 from "../../Fotos/nice.jpg";

export default function Nosotros() {
  return (
    <section className="w-full">
      {/* Header con imagen */}
      <div className="relative h-[340px] md:h-[420px]">
        {/* Pon tu imagen en /public/about/header.jpg */}
        <Image
          src={niceImg}
          alt="Equipo FlorAurora"
          fill
          priority
          className="object-cover"
        />
        {/* Overlay para contraste */}
        <div className="absolute inset-0 bg-white/55" />
        {/* Contenido */}
        <div className="relative z-10 h-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center">
          {/* Logo y título alineados horizontalmente */}
          {/* Logo fijo en la esquina superior izquierda */}
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={70}
            height={70}
            className="absolute top-6 left-6 z-20 rounded-md shadow-md bg-white"
            priority
          />
          {/* Título centrado */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 w-full text-center">
            Nosotros
          </h1>
          <p className="mt-4 max-w-3xl text-base md:text-lg text-gray-700">
            FlorAurora Salud es el servicio online de atención psicológica y
            médica más confiable del país. Contamos con un equipo de expertos
            altamente capacitados, plataformas modernas y un compromiso
            inquebrantable con el bienestar de nuestros pacientes.
          </p>
        </div>
      </div>

      {/* NUESTRA MISIÓN */}
      <section className="bg-teal-400/80 border-t border-teal-500">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h3 className="text-left text-slate-900 font-semibold tracking-widest">
            NUESTRA MISIÓN
          </h3>

          <div className="mt-6 md:mt-8 bg-white rounded-2xl shadow-md px-6 py-8 md:px-10 md:py-10 text-center">
            <Target
              className="mx-auto size-14 text-teal-400"
              strokeWidth={1.5}
            />
            <p className="mt-4 md:mt-6 text-gray-600 max-w-3xl mx-auto">
              Entregar un servicio online que permita conectar a profesionales
              de la salud con consultantes, a través de una plataforma
              tecnológica moderna y eficiente, garantizando calidad, seguridad y
              confianza en el vínculo.
            </p>
          </div>
        </div>
      </section>

      {/* Separador sutil */}
      <div className="h-px bg-teal-500/60" />

      {/* NUESTRA VISIÓN */}
      <section className="bg-teal-300/80">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <h3 className="text-left text-slate-900 font-semibold tracking-widest">
            NUESTRA VISIÓN
          </h3>

          <div className="mt-6 md:mt-8 bg-white rounded-2xl shadow-md px-6 py-8 md:px-10 md:py-10 text-center">
            <Eye className="mx-auto size-14 text-teal-400" strokeWidth={1.5} />
            <p className="mt-4 md:mt-6 text-gray-600 max-w-3xl mx-auto">
              Consolidarnos como una empresa líder en servicios de calidad, que
              inspire confianza, además de innovar tecnológicamente, con el
              compromiso de la salud y el bienestar de nuestros clientes.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}
