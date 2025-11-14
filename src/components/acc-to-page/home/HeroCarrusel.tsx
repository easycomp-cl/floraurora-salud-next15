"use client";
import logoImg from "../../Fotos/logo.png";
import React from "react";
import Image from "next/image";
import trabajoImg from "../../Fotos/trabajo.jpg";
import bienestarImg from "../../Fotos/bienestar.jpg";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectFade, Autoplay } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "./HeroCarrusel.css";

// Estructura de un banner
import { StaticImageData } from "next/image";
type Banner = {
  titulo: string;
  descripcion?: string;
  subtitulo?: string;
  botonTexto?: string;
  botonUrl?: string;
  imagen: string | StaticImageData; // URL o import de imagen
  isQuote?: boolean; // Indica si es una diapositiva de frase
};

type RemoteCarouselItem = {
  id: number;
  title: string | null;
  message: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
};

type CarouselResponse = {
  data?: RemoteCarouselItem[];
};

// Array de frases de bienestar y psicología
const frasesBienestar = [
  "La mente es como un jardín: lo que cultives es lo que florecerá",
  "El bienestar empieza con pequeños pasos diarios",
  "Tu paz mental es una prioridad, no un lujo",
  "Cada día es una nueva oportunidad para crecer",
  "El autocuidado es el mejor regalo que puedes darte",
  "La salud mental es tan importante como la física",
  "Respira profundo: el presente es tu mejor aliado",
  "Tu bienestar emocional marca el ritmo de tu vida",
  "La transformación personal comienza con la autoconciencia",
  "Cultivar la paz interior es el camino hacia la felicidad",
];

export default function HeroCarrusel() {
  const [fraseSeleccionada, setFraseSeleccionada] = React.useState<string>(
    frasesBienestar[0]
  );
  const [remoteBanners, setRemoteBanners] = React.useState<Banner[]>([]);

  React.useEffect(() => {
    if (frasesBienestar.length < 2) {
      setFraseSeleccionada(frasesBienestar[0] ?? "");
      return;
    }

    setFraseSeleccionada((fraseActual) => {
      let nuevaFrase = fraseActual;

      while (nuevaFrase === fraseActual) {
        nuevaFrase =
          frasesBienestar[Math.floor(Math.random() * frasesBienestar.length)];
      }

      return nuevaFrase;
    });
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadCarousel = async () => {
      try {
        const response = await fetch("/api/public/carousel", { cache: "no-store" });
        if (!response.ok) return;
        const payload: CarouselResponse = await response.json();
        if (!isMounted) return;
        const mapped: Banner[] = (payload.data ?? []).map((item) => ({
          titulo: item.title ?? "FlorAurora Salud",
          descripcion: item.message ?? undefined,
          botonTexto: item.cta_label ?? undefined,
          botonUrl: item.cta_link ?? undefined,
          imagen: item.image_url ?? trabajoImg,
        }));
        setRemoteBanners(mapped);
      } catch (error) {
        console.warn("[HeroCarrusel] No se pudo cargar el carrusel dinámico", error);
      }
    };

    loadCarousel();
    return () => {
      isMounted = false;
    };
  }, []);

  const banners: Banner[] = React.useMemo(() => {
    const baseBanners =
      remoteBanners.length > 0
        ? remoteBanners
        : [
            {
              titulo: "FlorAurora Salud",
              descripcion: "Cuidamos el bienestar de las personas, desde la raíz",
              botonTexto: "Agenda una consulta",
              botonUrl: "/agenda",
              imagen: trabajoImg,
            },
          ];
    return [
      ...baseBanners,
      {
        titulo: fraseSeleccionada,
        imagen: bienestarImg,
        isQuote: true,
      },
    ];
  }, [remoteBanners, fraseSeleccionada]);

  return (
    <section className="hero-carrusel-adapt">
      <Swiper
        modules={[Navigation, EffectFade, Autoplay]}
        navigation={{
          prevEl: ".swiper-button-prev",
          nextEl: ".swiper-button-next",
        }}
        effect="fade"
        speed={800}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="mySwiper"
      >
        {banners.map((banner, index) => (
          <SwiperSlide
            key={index}
            className={banner.isQuote ? "quote-slide" : ""}
          >
            {!banner.isQuote ? (
              <>
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
                <div className="hero-carrusel-img-side">
                  <Image
                    src={banner.imagen}
                    alt="Equipo de trabajo FlorAurora"
                    fill
                    sizes="(max-width: 900px) 100vw, 45vw"
                    style={{ objectFit: "cover" }}
                    className="hero-carrusel-img"
                    priority={index === 0}
                  />
                </div>
              </>
            ) : (
              <>
                <div
                  className="hero-carrusel-img-side"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <Image
                    src={banner.imagen}
                    alt="Imagen de bienestar"
                    fill
                    sizes="(max-width: 900px) 100vw, 80vw"
                    style={{ objectFit: "cover" }}
                    className="hero-carrusel-img"
                    priority={index === 0}
                  />
                </div>
                <div className={`quote-slide`}>
                  <div className="quote-container">
                    <h2 className="quote-text">{banner.titulo}</h2>
                  </div>
                </div>
              </>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Botones de navegación personalizados */}
      <button
        className="carrusel-arrow left swiper-button-prev"
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
        className="carrusel-arrow right swiper-button-next"
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
          min-height: 500px;
          height: 100%;
          background: #d1f5f0;
          overflow: hidden;
        }
        /* Cada slide controla su propio layout: evita que el contenedor padre se divida en dos columnas */
        .swiper-slide {
          display: grid;
          grid-template-columns: 55% 45%; /* contenido a la izquierda, imagen a la derecha */
          align-items: stretch;
          min-height: 500px;
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
          filter: brightness(0.7);
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
          height: 80%;
        }
        .hero-logo {
          margin-bottom: 1.5rem;
        }
        .hero-carrusel-content-side h1 {
          font-size: 5rem;
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
            position: relative;
          }
          .swiper-slide {
            display: block;
            min-height: 420px;
            position: relative;
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
        .quote-slide {
          position: absolute !important;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(4px);
          width: 80%;
          max-width: 1000px;
          max-height: 70vh; /* no ocupar todo el alto, limitar altura */
          height: auto;
          overflow: auto; /* si el contenido crece, permitir scroll dentro de la caja */
          border-radius: 1rem;
          z-index: 3;
          padding: 2rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .quote-container {
          padding: 3rem;
          text-align: center;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .quote-text {
          color: #002b2b !important;
          font-size: 2.5rem !important;
          line-height: 1.4;
          font-weight: 500;
          font-style: italic;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 900px) {
          .quote-slide {
            width: 90%;
            padding: 1rem;
          }
        }
        @media (max-width: 768px) {
          .quote-text {
            font-size: 2rem !important;
          }
        }
        @media (max-width: 480px) {
          .quote-text {
            font-size: 1.5rem !important;
          }
          .quote-container {
            padding: 1rem;
          }
        }

        /* Animaciones de deslizamiento (doble render: from / to) */
        .slides-layer {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: stretch;
        }

        /* from = slide saliente, to = slide entrante */
        .slide.from.left {
          animation: outToLeft 0.5s ease-in-out forwards;
        }
        .slide.to.left {
          animation: inFromRight 0.5s ease-in-out forwards;
        }

        .slide.from.right {
          animation: outToRight 0.5s ease-in-out forwards;
        }
        .slide.to.right {
          animation: inFromLeft 0.5s ease-in-out forwards;
        }

        @keyframes outToLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        @keyframes inFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes outToRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes inFromLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
