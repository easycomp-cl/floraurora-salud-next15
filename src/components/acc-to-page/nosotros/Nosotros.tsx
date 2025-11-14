"use client";

import NosotrosHeader from "./NosotrosHeader";
import NuestraMision from "./NuestraMision";
import NuestraVision from "./NuestraVision";


export default function Nosotros() {
  return (
    <section className="w-full bg-white">
      <NosotrosHeader />
      <NuestraMision />
      <div className="h-0.5 bg-gradient-to-r from-transparent via-teal-300 to-transparent max-w-4xl mx-auto" />
      <NuestraVision />
    </section>
  );
}
