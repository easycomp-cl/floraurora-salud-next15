import React from "react";
import Image from "next/image";
import logoImge from "../../Fotos/logo2.png";

export default function HeroCompromiso() {
  return (
    <section className="relative py-12 px-4 md:px-16 text-center bg-white">
      <div className="absolute inset-0 w-full h-full z-0 bg-no-repeat bg-cover bg-center bg-fixed md:bg-[url('/ruta/fondo-escritorio.jpg')] bg-[url('/ruta/fondo-movil.jpg')] opacity-20 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-3xl mx-auto">
        <div className="mb-2">
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={128}
            height={128}
            className="mx-auto"
            priority
          />
        </div>
        <h2 className="text-3xl font-bold text-primary-900">
          Comprometidos contigo
        </h2>
        <p className="text-lg text-primary-700">
          FlorAurora Salud tiene el compromiso inquebrantable con el bienestar
          de las personas, por lo que pone a disposición un servicio online que
          conecta a consultantes con profesionales de la salud, a través de una
          plataforma confiable y segura, que entrega una experiencia única y
          cercana en el vínculo terapéutico.
        </p>
        <button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded shadow">
          Más información
        </button>
      </div>
    </section>
  );
}
