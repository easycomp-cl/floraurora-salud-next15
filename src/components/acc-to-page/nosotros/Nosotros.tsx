"use client";


import NosotrosHeader from "./NosotrosHeader";
import NuestraMision from "./NuestraMision";
import NuestraVision from "./NuestraVision";

export default function Nosotros() {
  return (
    <section className="w-full">
      <NosotrosHeader />
      <NuestraMision />
      <div className="h-px bg-teal-500/60" />
      <NuestraVision />
    </section>
  );
}
