import React from "react";

interface SIIIconProps {
  className?: string;
}

/**
 * Icono SVG del logo SII (Servicio de Impuestos Internos)
 * Basado en el diseño oficial del SII, versión en escala de grises para el menú
 */
export default function SIIIcon({ className = "" }: SIIIconProps) {
  return (
    <svg
      viewBox="0 0 400 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(-16.073294,-694.83937)">
        {/* Letra "s" en gris */}
        <path
          d="m16.1 1011.2 0.4-72.2c0 0 12.8 4.7 23.6 10.4 46.1 19.9 65 10.1 69-4.2C116.1 919.9 95.1 893.9 72.5 877.1 34 848.7 17.7 819.6 30.1 776.6l68.2 0c-7 11.9-0.3 28.9 8.5 37.6 15.6 16.6 36.3 36.9 49.7 50 27.5 26.9 38.5 80.3 24.8 111.5-22.6 60.9-104.1 77.3-165.1 35.5z"
          fill="currentColor"
        />
        {/* Cuadrado gris integrado en la parte superior izquierda */}
        <rect y="694.8" x="98.3" height="81.7" width="81.7" fill="currentColor" />
        
        {/* Primera "i" - punto gris (más claro, simulando el naranja original) */}
        <circle r="40.9" cy="735.7" cx="257.4" fill="currentColor" opacity="0.6" />
        {/* Primera "i" - trazo vertical gris */}
        <rect y="795.4" x="216.5" height="239.4" width="81.7" fill="currentColor" />
        
        {/* Segunda "i" - punto gris (más claro, simulando el naranja original) */}
        <circle r="40.9" cy="735.7" cx="375.2" fill="currentColor" opacity="0.6" />
        {/* Segunda "i" - trazo vertical gris */}
        <rect y="795.4" x="334.3" height="239.4" width="81.7" fill="currentColor" />
      </g>
    </svg>
  );
}
