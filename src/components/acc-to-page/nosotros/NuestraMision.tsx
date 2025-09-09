"use client";

import { Target } from "lucide-react";
import React from "react";

export default function NuestraMision() {
  return (
    <section className="bg-teal-400/80 border-t border-teal-500">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <h3 className="text-left text-slate-900 font-semibold tracking-widest">
          NUESTRA MISIÓN
        </h3>
        <div className="mt-6 md:mt-8 bg-white rounded-2xl shadow-md px-6 py-8 md:px-10 md:py-10 text-center">
          <Target className="mx-auto size-14 text-teal-400" strokeWidth={1.5} />
          <p className="mt-4 md:mt-6 text-gray-600 max-w-3xl mx-auto">
            Entregar un servicio online que permita conectar a profesionales de la salud con consultantes, a través de una plataforma tecnológica moderna y eficiente, garantizando calidad, seguridad y confianza en el vínculo.
          </p>
        </div>
      </div>
    </section>
  );
}
