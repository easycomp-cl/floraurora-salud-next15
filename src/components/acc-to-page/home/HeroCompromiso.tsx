"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import logoImge from "../../Fotos/logo2.png";
import { Heart } from "lucide-react";

export default function HeroCompromiso() {
  return (
    <section className="relative py-16 md:py-20 px-4 md:px-8 text-center bg-gradient-to-br from-teal-50 via-white to-teal-50/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 md:mb-8 shadow-lg">
            <Heart
              className="size-12 md:size-14 text-white"
              strokeWidth={2}
              fill="currentColor"
            />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Comprometidos contigo
          </h2>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl px-8 py-10 md:px-12 md:py-14 text-center transform transition-all hover:shadow-2xl max-w-4xl mx-auto">
          <div className="mb-6">
            <Image
              src={logoImge}
              alt="Logo FlorAurora Salud"
              width={160}
              height={160}
              className="mx-auto"
              priority
            />
          </div>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
            FlorAurora Salud tiene el compromiso inquebrantable con el bienestar
            de las personas, por lo que pone a disposición un servicio online
            que conecta a consultantes con profesionales de la salud, a través
            de una plataforma confiable y segura, que entrega una experiencia
            única y cercana en el vínculo terapéutico.
          </p>
          <Link
            href="/about"
            className="inline-block mt-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform transition-all hover:scale-105"
          >
            Más información
          </Link>
        </div>
      </div>
    </section>
  );
}
