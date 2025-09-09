"use client";

import { Eye } from "lucide-react";
import React from "react";

export default function NuestraVision() {
  return (
    <section className="bg-teal-300/80">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <h3 className="text-left text-slate-900 font-semibold tracking-widest">
          NUESTRA VISIÓN
        </h3>
        <div className="mt-6 md:mt-8 bg-white rounded-2xl shadow-md px-6 py-8 md:px-10 md:py-10 text-center">
          <Eye className="mx-auto size-14 text-teal-400" strokeWidth={1.5} />
          <p className="mt-4 md:mt-6 text-gray-600 max-w-3xl mx-auto">
            Consolidarnos como una empresa líder en servicios de calidad, que inspire confianza, además de innovar tecnológicamente, con el compromiso de la salud y el bienestar de nuestros clientes.
          </p>
        </div>
      </div>
    </section>
  );
}
