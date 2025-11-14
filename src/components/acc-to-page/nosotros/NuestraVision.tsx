"use client";

import { Eye } from "lucide-react";
import React from "react";

export default function NuestraVision() {
  return (
    <section className="bg-gradient-to-br from-teal-100/50 via-teal-50 to-teal-200/30 py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="text-center mb-10 md:mb-12">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Nuestra Visión
          </h3>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl px-8 py-10 md:px-12 md:py-14 text-center transform transition-all hover:shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 md:mb-8 shadow-lg">
            <Eye className="size-10 md:size-12 text-white" strokeWidth={2} />
          </div>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Consolidarnos como una empresa líder en servicios de calidad, que inspire confianza, además de innovar tecnológicamente, con el compromiso de la salud y el bienestar de nuestros clientes.
          </p>
        </div>
      </div>
    </section>
  );
}
