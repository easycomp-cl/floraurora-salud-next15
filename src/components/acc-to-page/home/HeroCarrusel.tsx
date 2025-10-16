"use client";
import logoImg from "../../Fotos/logo.png";
import React, { useState } from "react";
import Image from "next/image";
import trabajoImg from "../../Fotos/trabajo.jpg";

// Estructura de un banner
import { StaticImageData } from "next/image";
type Banner = {
  titulo: string;
  descripcion?: string;
  subtitulo?: string;
  botonTexto?: string;
  botonUrl?: string;
  imagen: string | StaticImageData; // URL o import de imagen
};

// Ejemplo de banners administrables (puedes reemplazar por props o datos dinámicos)
const banners: Banner[] = [
  {
    titulo: "FlorAurora Salud",
    descripcion: "Cuidamos el bienestar de las personas, desde la raíz",
    botonTexto: "Agenda una consulta",
    botonUrl: "/agenda",
    imagen: trabajoImg,
  },
];

export default function HeroCarrusel() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => setCurrent((current + 1) % banners.length);
  const prevSlide = () =>
    setCurrent((current - 1 + banners.length) % banners.length);

  const banner = banners[current];

  return (
    <section className="hero-carrusel-adapt">
      <div className="hero-carrusel-img-side">
        <Image
          src={banner.imagen}
          alt="Equipo de trabajo FlorAurora"
          fill
          style={{ objectFit: "cover" }}
          className="hero-carrusel-img"
          priority
        />
      </div>
      <div className="hero-carrusel-content-side">
        <div className="hero-logo">
          <Image
            src={logoImg}
            alt="Logo FlorAurora Salud"
            width={64}
            height={64}
            priority
          />
        </div>
        <h1>{banner.titulo}</h1>
        {banner.subtitulo && <h2>{banner.subtitulo}</h2>}
        {banner.descripcion && <p>{banner.descripcion}</p>}
        {banner.botonTexto && banner.botonUrl && (
          <a href={banner.botonUrl} className="carrusel-btn">
            {banner.botonTexto}
          </a>
        )}
      </div>
      <button
        className="carrusel-arrow left"
        onClick={prevSlide}
        aria-label="Anterior"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        className="carrusel-arrow right"
        onClick={nextSlide}
        aria-label="Siguiente"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <style jsx>{`
        .hero-carrusel-adapt {
          position: relative;
          width: 100%;
          min-height: 350px;
          height: 100%;
          background: #d1f5f0;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
        }
        .hero-carrusel-img-side {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 350px;
          overflow: hidden;
        }
        .hero-carrusel-img :global(img) {
          object-fit: cover;
          width: 100% !important;
          height: 100% !important;
        }
        .hero-carrusel-content-side {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: rgba(209, 245, 240, 0.85);
          border-radius: 1rem 0 0 1rem;
          text-align: center;
          padding: 3rem 2rem;
          margin: 2rem 0 2rem 2rem;
          height: 100%;
        }
        .hero-logo {
          margin-bottom: 1.5rem;
        }
        .hero-carrusel-content-side h1 {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #002b2b;
        }
        .hero-carrusel-content-side h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
          color: #002b2b;
        }
        .hero-carrusel-content-side p {
          font-size: 1.3rem;
          margin-bottom: 2rem;
          color: #222;
        }
        .carrusel-btn {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.75rem 2rem;
          background: #009688;
          color: #fff;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.1rem;
          transition: background 0.2s;
        }
        .carrusel-btn:hover {
          background: #00796b;
        }
        .carrusel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          color: #009688;
          border: 2px solid rgba(0, 150, 136, 0.3);
          padding: 12px;
          cursor: pointer;
          z-index: 10;
          border-radius: 50%;
          pointer-events: auto;
          opacity: 0.8;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
        }
        .carrusel-arrow:hover {
          background: #009688;
          color: #fff;
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 150, 136, 0.3);
        }
        .carrusel-arrow:active {
          transform: translateY(-50%) scale(0.95);
        }
        .carrusel-arrow.left {
          left: 1rem;
        }
        .carrusel-arrow.right {
          right: 1rem;
        }
        @media (max-width: 900px) {
          .hero-carrusel-adapt {
            display: block;
            min-height: 350px;
            height: 100%;
            overflow: hidden;
          }
          .hero-carrusel-img-side {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            overflow: hidden;
          }
          .hero-carrusel-content-side {
            width: 100%;
            margin: 0;
            border-radius: 0;
            padding: 2rem 1rem;
            background: rgba(209, 245, 240, 0.85);
            position: absolute;
            top: 0;
            left: 0;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .carrusel-arrow {
            top: 50%;
            transform: translateY(-50%);
            opacity: 0.7;
          }
          .carrusel-arrow.left {
            left: 1rem;
            right: unset;
          }
          .carrusel-arrow.right {
            right: 1rem;
            left: unset;
          }
        }
        @media (max-width: 600px) {
          .hero-carrusel-content-side h1 {
            font-size: 2rem;
          }
          .hero-carrusel-content-side h2 {
            font-size: 1.2rem;
          }
          .hero-carrusel-content-side p {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
