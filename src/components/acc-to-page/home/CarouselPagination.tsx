"use client";

import React, { useEffect, useState } from "react";

interface CarouselPaginationProps {
  totalSlides: number;
  activeIndex: number;
  autoplayDelay: number;
  onSlideClick: (index: number) => void;
}

export default function CarouselPagination({
  totalSlides,
  activeIndex,
  autoplayDelay,
  onSlideClick,
}: CarouselPaginationProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (totalSlides <= 1) return;

    setProgress(0);

    const interval = 50; // Actualizar cada 50ms para animación suave
    // Ajustar el delay para que coincida exactamente con el cambio de slide
    // El timer en HeroCarrusel tiene un delay de 1000ms antes de iniciarse
    // y luego un intervalo ajustado, pero queremos que la animación visual
    // termine justo cuando cambia el slide, así que usamos el delay completo menos el delay inicial
    const transitionDelay = 1000; // Delay antes de iniciar el timer (ajustado para velocidad de transición de 800ms)
    const adjustedDelay = autoplayDelay - transitionDelay;
    const steps = Math.max(1, Math.floor(adjustedDelay / interval));
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        setProgress(100); // Asegurar que llegue al 100% justo antes de cambiar
        // No resetear aquí, dejar que el cambio de activeIndex lo haga
      }
    }, interval);

    return () => {
      clearInterval(timer);
    };
  }, [activeIndex, autoplayDelay, totalSlides]);

  if (totalSlides <= 1) return null;

  return (
    <div className="carousel-pagination">
      {Array.from({ length: totalSlides }).map((_, index) => {
        const isActive = index === activeIndex;
        const circumference = 2 * Math.PI * 8; // Radio de 8px
        const offset = circumference - (progress / 100) * circumference;

        return (
          <button
            key={index}
            className={`pagination-dot ${isActive ? "active" : ""}`}
            onClick={() => {
              // No pausar, solo hacer clic y dejar que el useEffect maneje el reinicio
              onSlideClick(index);
            }}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          >
            <svg
              className="pagination-dot-svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              {/* Círculo de fondo */}
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="2"
              />
              {/* Círculo activo con progreso */}
              {isActive && (
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="pagination-progress"
                  style={{
                    transition: "stroke-dashoffset 0.05s linear",
                  }}
                />
              )}
            </svg>
            {/* Punto central */}
            <div className="pagination-dot-inner" />
          </button>
        );
      })}
      <style jsx>{`
        .carousel-pagination {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.75rem;
          align-items: center;
          justify-content: center;
          z-index: 10;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 2rem;
        }

        .pagination-dot {
          position: relative;
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .pagination-dot:hover {
          transform: scale(1.2);
        }

        .pagination-dot:active {
          transform: scale(0.9);
        }

        .pagination-dot-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .pagination-dot-inner {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transition:
            background 0.3s ease,
            transform 0.3s ease;
        }

        .pagination-dot.active .pagination-dot-inner {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.2);
        }

        .pagination-progress {
          transform: rotate(-90deg);
          transform-origin: center;
        }

        @media (max-width: 768px) {
          .carousel-pagination {
            bottom: 1rem;
            gap: 0.5rem;
            padding: 0.4rem 0.8rem;
          }

          .pagination-dot {
            width: 16px;
            height: 16px;
          }

          .pagination-dot-svg {
            width: 16px;
            height: 16px;
          }

          .pagination-dot-svg circle {
            r: 6;
            stroke-width: 1.5;
          }

          .pagination-dot-inner {
            width: 6px;
            height: 6px;
          }
        }
      `}</style>
    </div>
  );
}
