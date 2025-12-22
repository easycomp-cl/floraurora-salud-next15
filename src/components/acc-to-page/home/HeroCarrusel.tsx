"use client";
import logoImg from "../../Fotos/logo.png";
import React from "react";
import Image from "next/image";
import trabajoImg from "../../Fotos/trabajo.jpg";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, EffectFade, Autoplay } from "swiper/modules";
import CarouselPagination from "./CarouselPagination";

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

// Array de frases de bienestar y psicología (comentado - no se usa actualmente)
// const frasesBienestar = [
//   "La mente es como un jardín: lo que cultives es lo que florecerá",
//   "El bienestar empieza con pequeños pasos diarios",
//   "Tu paz mental es una prioridad, no un lujo",
//   "Cada día es una nueva oportunidad para crecer",
//   "El autocuidado es el mejor regalo que puedes darte",
//   "La salud mental es tan importante como la física",
//   "Respira profundo: el presente es tu mejor aliado",
//   "Tu bienestar emocional marca el ritmo de tu vida",
//   "La transformación personal comienza con la autoconciencia",
//   "Cultivar la paz interior es el camino hacia la felicidad",
// ];

// Función helper para normalizar URLs
const normalizeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;

  // Si ya tiene protocolo (http:// o https://), usar tal cual
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Si empieza con www., agregar https://
  if (url.startsWith("www.")) {
    return `https://${url}`;
  }

  // Si es una ruta relativa (empieza con /), mantenerla como está
  if (url.startsWith("/")) {
    return url;
  }

  // Para cualquier otra cosa, asumir que es un dominio y agregar https://
  // Pero solo si parece una URL (contiene un punto o es un dominio válido)
  if (url.includes(".") && !url.includes(" ")) {
    return `https://${url}`;
  }

  // Si no parece una URL válida, tratarla como ruta relativa
  return url.startsWith("/") ? url : `/${url}`;
};

type SwiperInstance = {
  realIndex: number;
  slideNext: () => void;
  slidePrev: () => void;
  slideToLoop: (index: number) => void;
  destroyed: boolean;
  animating: boolean;
  params: {
    navigation?: {
      prevEl?: HTMLElement | string | null;
      nextEl?: HTMLElement | string | null;
    };
  };
  navigation?: {
    prevEl?: HTMLElement | string | null;
    nextEl?: HTMLElement | string | null;
    update: () => void;
  };
};

export default function HeroCarrusel() {
  const [remoteBanners, setRemoteBanners] = React.useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const prevButtonRef = React.useRef<HTMLButtonElement>(null);
  const nextButtonRef = React.useRef<HTMLButtonElement>(null);
  const swiperRef = React.useRef<SwiperInstance | null>(null);
  const autoplayTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Comentado: Selección aleatoria de frases
  // React.useEffect(() => {
  //   if (frasesBienestar.length < 2) {
  //     setFraseSeleccionada(frasesBienestar[0] ?? "");
  //     return;
  //   }

  //   setFraseSeleccionada((fraseActual) => {
  //     let nuevaFrase = fraseActual;

  //     while (nuevaFrase === fraseActual) {
  //       nuevaFrase =
  //         frasesBienestar[Math.floor(Math.random() * frasesBienestar.length)];
  //     }

  //     return nuevaFrase;
  //   });
  // }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadCarousel = async () => {
      try {
        const response = await fetch("/api/public/carousel", {
          cache: "no-store",
        });
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
        console.warn(
          "[HeroCarrusel] No se pudo cargar el carrusel dinámico",
          error
        );
      }
    };

    loadCarousel();
    return () => {
      isMounted = false;
    };
  }, []);

  const banners: Banner[] = React.useMemo(() => {
    // Banner principal hardcoded (siempre presente)
    const hardcodedBanners: Banner[] = [
      {
        titulo: "FlorAurora Salud",
        descripcion: "Cuidamos el bienestar de las personas, desde la raíz",
        botonTexto: "Agenda una consulta",
        botonUrl: "/agenda",
        imagen: trabajoImg,
      },
    ];

    // Combinar banners hardcoded + banners de la API
    const allBanners = [...hardcodedBanners, ...remoteBanners];

    // Comentado: Agregar la slide de frase al final
    // return [
    //   ...allBanners,
    //   {
    //     titulo: fraseSeleccionada,
    //     imagen: bienestarImg,
    //     isQuote: true,
    //   },
    // ];

    // Retornar solo los banners sin la slide de frase
    return allBanners;
  }, [remoteBanners]); // Removido fraseSeleccionada de las dependencias

  // Timer personalizado para autoplay - se reinicia cuando cambia el slide
  React.useEffect(() => {
    if (banners.length <= 1) {
      // Limpiar timer si solo hay un banner
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      return;
    }

    if (!swiperRef.current) {
      return;
    }

    // Limpiar timer anterior
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

    // Crear nuevo timer para avanzar automáticamente después de un pequeño delay
    // Esto asegura que el timer se reinicie correctamente después de cada cambio de slide
    const timer = setTimeout(() => {
      if (
        swiperRef.current &&
        banners.length > 1 &&
        !swiperRef.current.destroyed
      ) {
        // El intervalo debe ser 5000ms menos el delay para que el tiempo total sea exactamente 5000ms
        // Esto asegura que la animación visual termine justo cuando cambia el slide
        autoplayTimerRef.current = setInterval(() => {
          if (swiperRef.current && !swiperRef.current.destroyed) {
            swiperRef.current.slideNext();
          }
        }, 5000 - 1000); // 4000ms para que el tiempo total sea exactamente 5000ms (1000ms delay + 4000ms intervalo)
      }
    }, 1000); // Delay ajustado para la nueva velocidad de transición (800ms + margen)

    return () => {
      clearTimeout(timer);
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [activeIndex, banners.length]);

  // Actualizar navegación cuando los banners cambien y Swiper esté listo
  React.useEffect(() => {
    if (
      swiperRef.current &&
      banners.length > 1 &&
      prevButtonRef.current &&
      nextButtonRef.current
    ) {
      const swiper = swiperRef.current;
      try {
        // Configurar la navegación solo si es un objeto NavigationOptions
        if (
          swiper.params.navigation &&
          typeof swiper.params.navigation === "object"
        ) {
          swiper.params.navigation.prevEl = prevButtonRef.current;
          swiper.params.navigation.nextEl = nextButtonRef.current;
        }

        // Solo actualizar si la navegación está completamente inicializada
        // Verificar que los elementos sean válidos antes de actualizar
        if (
          swiper.navigation &&
          swiper.navigation.prevEl &&
          swiper.navigation.nextEl &&
          typeof swiper.navigation.prevEl !== "string" &&
          typeof swiper.navigation.nextEl !== "string"
        ) {
          try {
            swiper.navigation.update();
          } catch {
            // Ignorar errores de actualización si los elementos no están completamente listos
          }
        }
      } catch (error) {
        // Silenciar errores de navegación si los elementos no están listos
        console.warn("Error actualizando navegación de Swiper:", error);
      }
    }
  }, [banners.length]);

  return (
    <section className="hero-carrusel-adapt">
      <Swiper
        modules={[Navigation, EffectFade, Autoplay]}
        navigation={false}
        effect="fade"
        speed={800}
        fadeEffect={{
          crossFade: true,
        }}
        allowTouchMove={true}
        resistance={true}
        resistanceRatio={0}
        autoplay={false}
        loop={banners.length > 1}
        className="mySwiper"
        onSlideChange={(swiper) => {
          setActiveIndex(swiper.realIndex);
        }}
        onSwiper={(swiper) => {
          setActiveIndex(swiper.realIndex);
          swiperRef.current = swiper as SwiperInstance;
        }}
      >
        {banners.map((banner, index) => {
          const isDynamicBanner =
            !banner.isQuote &&
            typeof banner.imagen === "string" &&
            banner.imagen.startsWith("http");
          return (
            <SwiperSlide
              key={index}
              className={
                banner.isQuote
                  ? "quote-slide"
                  : isDynamicBanner
                    ? "dynamic-banner-slide"
                    : ""
              }
            >
              {!banner.isQuote ? (
                <>
                  {/* Para banners hardcoded: mantener diseño original de 2 columnas */}
                  {typeof banner.imagen !== "string" ||
                  !banner.imagen.startsWith("http") ? (
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
                          <a
                            href={normalizeUrl(banner.botonUrl)}
                            className="carrusel-btn"
                            target={
                              banner.botonUrl?.startsWith("http")
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              banner.botonUrl?.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
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
                    /* Para banners dinámicos de la API: usar el mismo formato que las frases de bienestar */
                    <>
                      <div
                        className="hero-carrusel-img-side"
                        style={{ gridColumn: "1 / -1", position: "relative" }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            zIndex: 1,
                            pointerEvents: "none",
                          }}
                        />
                        <Image
                          src={banner.imagen}
                          alt={banner.titulo || "Banner FlorAurora"}
                          fill
                          sizes="(max-width: 900px) 100vw, 80vw"
                          style={{
                            objectFit: "cover",
                            filter: "brightness(0.6)",
                          }}
                          className="hero-carrusel-img"
                          priority={index === 0}
                        />
                      </div>
                      <div className="quote-slide">
                        <div className="quote-container">
                          {banner.titulo && (
                            <h2 className="quote-text">{banner.titulo}</h2>
                          )}
                          {banner.descripcion && (
                            <p className="quote-description">
                              {banner.descripcion}
                            </p>
                          )}
                          {banner.botonTexto && banner.botonUrl && (
                            <a
                              href={normalizeUrl(banner.botonUrl)}
                              className="carrusel-btn quote-btn"
                              target={
                                banner.botonUrl?.startsWith("http")
                                  ? "_blank"
                                  : undefined
                              }
                              rel={
                                banner.botonUrl?.startsWith("http")
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                            >
                              {banner.botonTexto}
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
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
          );
        })}
      </Swiper>

      {/* Botones de navegación personalizados - Siempre renderizados pero ocultos si solo hay un banner */}
      <button
        ref={prevButtonRef}
        className={`carrusel-arrow left swiper-button-prev ${banners.length <= 1 ? "hidden" : ""}`}
        aria-label="Anterior"
        style={{ display: banners.length <= 1 ? "none" : "flex" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (swiperRef.current && !swiperRef.current.animating) {
            // Limpiar completamente el timer cuando se hace clic manualmente
            if (autoplayTimerRef.current) {
              clearInterval(autoplayTimerRef.current);
              autoplayTimerRef.current = null;
            }
            swiperRef.current.slidePrev();
            // El timer se reiniciará automáticamente cuando activeIndex cambie en el useEffect
          }
        }}
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
        ref={nextButtonRef}
        className={`carrusel-arrow right swiper-button-next ${banners.length <= 1 ? "hidden" : ""}`}
        aria-label="Siguiente"
        style={{ display: banners.length <= 1 ? "none" : "flex" }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (swiperRef.current && !swiperRef.current.animating) {
            // Limpiar completamente el timer cuando se hace clic manualmente
            if (autoplayTimerRef.current) {
              clearInterval(autoplayTimerRef.current);
              autoplayTimerRef.current = null;
            }
            swiperRef.current.slideNext();
            // El timer se reiniciará automáticamente cuando activeIndex cambie en el useEffect
          }
        }}
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

      {/* Paginación con pelotitas */}
      {banners.length > 1 && (
        <CarouselPagination
          totalSlides={banners.length}
          activeIndex={activeIndex}
          autoplayDelay={5400}
          onSlideClick={(index) => {
            if (swiperRef.current) {
              // Limpiar completamente el timer cuando se hace clic manualmente
              if (autoplayTimerRef.current) {
                clearInterval(autoplayTimerRef.current);
                autoplayTimerRef.current = null;
              }
              swiperRef.current.slideToLoop(index);
              // El timer se reiniciará automáticamente cuando activeIndex cambie en el useEffect
            }
          }}
        />
      )}

      <style jsx>{`
        .hero-carrusel-adapt {
          position: relative;
          width: 100%;
          min-height: 500px;
          height: 100vh;
          max-height: 800px;
          background: #d1f5f0;
          overflow: hidden;
        }
        .hero-carrusel-adapt :global(.swiper) {
          width: 100%;
          height: 100%;
        }
        .hero-carrusel-adapt :global(.swiper-wrapper) {
          height: 100%;
        }
        /* Cada slide controla su propio layout: evita que el contenedor padre se divida en dos columnas */
        .swiper-slide {
          display: grid;
          grid-template-columns: 55% 45%; /* contenido a la izquierda, imagen a la derecha */
          align-items: stretch;
          min-height: 100%;
          height: 100%;
          position: relative;
        }
        /* Slide con imagen de fondo completa (banners dinámicos) */
        .dynamic-banner-slide {
          display: block !important;
          grid-template-columns: none !important;
        }
        .hero-carrusel-img-side {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 350px;
          overflow: hidden;
        }
        /* Cuando la imagen ocupa todo el slide */
        .dynamic-banner-slide .hero-carrusel-img-side {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 100%;
        }
        /* Overlay oscuro para imágenes de banners dinámicos */
        .dynamic-banner-slide .hero-carrusel-img-side::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 1;
          pointer-events: none;
        }
        .hero-carrusel-img :global(img) {
          object-fit: cover;
          width: 100% !important;
          height: 100% !important;
          filter: brightness(0.5);
        }
        /* Overlay oscuro para imágenes de banners dinámicos - duplicado eliminado */
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
            min-height: 500px;
            height: 70vh;
            max-height: 600px;
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
            min-height: 100%;
            height: 100%;
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
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent !important;
          backdrop-filter: none;
          z-index: 3;
          padding: 2rem;
          box-sizing: border-box;
        }
        .quote-container {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(12px);
          border-radius: 1rem;
          padding: 3rem 2.5rem;
          text-align: center;
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
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
        .quote-description {
          color: #002b2b !important;
          font-size: 1.5rem !important;
          line-height: 1.6;
          font-weight: 400;
          margin: 2rem 0 0 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        .quote-btn {
          margin-top: 2.5rem;
          display: inline-block;
        }
        @media (max-width: 900px) {
          .quote-slide {
            padding: 1.5rem;
          }
          .quote-container {
            width: 90%;
            padding: 2.5rem 2rem;
          }
        }
        @media (max-width: 768px) {
          .quote-text {
            font-size: 2rem !important;
          }
          .quote-description {
            font-size: 1.25rem !important;
            margin-top: 1.5rem;
          }
          .quote-btn {
            margin-top: 2rem;
          }
        }
        @media (max-width: 480px) {
          .quote-slide {
            padding: 1rem;
          }
          .quote-text {
            font-size: 1.5rem !important;
          }
          .quote-description {
            font-size: 1rem !important;
            margin-top: 1.25rem;
          }
          .quote-container {
            width: 95%;
            padding: 2rem 1.5rem;
            background: rgba(255, 255, 255, 0.65);
          }
          .quote-btn {
            margin-top: 1.75rem;
            padding: 0.6rem 1.5rem;
            font-size: 1rem;
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
