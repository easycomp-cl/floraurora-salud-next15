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
        imagen: trabajoImg
    }
    ,
    {
        titulo: "Bienvenido a FlorAurora Salud",
        descripcion: "Esta es una prueba para el carrusel.",
        botonTexto: "Ver más",
        botonUrl: "/about",
        imagen: logoImg
    }
];

export default function HeroCarrusel() {
    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);

    const nextSlide = () => {
        setSliding(true);
        setTimeout(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
            setSliding(false);
        }, 400); // duración del efecto
    };
    const prevSlide = () => {
        setSliding(true);
        setTimeout(() => {
            setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
            setSliding(false);
        }, 400);
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [current]);

    const banner = banners[current];

    return (
    <section className="hero-carrusel-adapt" style={{ minHeight: '400px', height: '400px' }}>
            <div className={`hero-carrusel-img-side${sliding ? ' sliding' : ''}`}>
                <Image
                    src={banner.imagen}
                    alt="Equipo de trabajo FlorAurora"
                    fill
                    style={{ objectFit: "cover" }}
                    className="hero-carrusel-img"
                    priority
                />
            </div>
            <div className={`hero-carrusel-content-side${sliding ? ' sliding' : ''}`}>
                <div className="hero-logo">
                    <Image src={logoImg} alt="Logo FlorAurora Salud" width={64} height={64} priority />
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
            <button className="carrusel-arrow left" onClick={prevSlide} aria-label="Anterior">&#8592;</button>
            <button className="carrusel-arrow right" onClick={nextSlide} aria-label="Siguiente">&#8594;</button>
            <style jsx>{`
                .hero-carrusel-adapt {
                    position: relative;
                    width: 100%;
                    min-height: 400px;
                    height: 400px;
                    background: #d1f5f0;
                    overflow: hidden;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    align-items: stretch;
                }
                .hero-carrusel-img-side {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    min-height: 400px;
                    overflow: hidden;
                    transition: transform 0.4s cubic-bezier(.77,0,.18,1);
                }
                .hero-carrusel-img-side.sliding {
                    transform: translateX(-40px);
                }
                .hero-carrusel-img :global(img) {
                    object-fit: cover;
                    width: 100% !important;
                    height: 400px !important;
                }
                .hero-carrusel-content-side {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: rgba(209,245,240,0.85);
                    border-radius: 1rem 0 0 1rem;
                    text-align: center;
                    padding: 3rem 2rem;
                    margin: 2rem 0 2rem 2rem;
                    height: 100%;
                    transition: transform 0.4s cubic-bezier(.77,0,.18,1);
                }
                .hero-carrusel-content-side.sliding {
                    transform: translateX(-40px);
                }
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
                .carrusel-arrow:hover {
    background: rgba(0,0,0,0.7);
    opacity: 1;
}
                .carrusel-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(0,0,0,0.2);
                    color: #fff;
                    border: none;
                    font-size: 2rem;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    cursor: pointer;
                    z-index: 50;
                    border-radius: 50%;
                    pointer-events: auto;
                    opacity: 0.3;
                    transition: background 0.2s, opacity 0.2s;
}
                .carrusel-arrow.left { left: 1rem; }
                .carrusel-arrow.right { right: 1rem; }
                @media (max-width: 900px) {
                    .hero-carrusel-adapt {
                        display: block;
                        min-height: 220px;
                        height: 220px;
                    }
                    .hero-carrusel-img-side {
                        position: absolute;
                        top: 0; left: 0; width: 100%; height: 120px;
                        max-height: 120px;
                        z-index: 0;
                        min-height: 120px;
                        overflow: hidden;
                    }
                    .hero-carrusel-img :global(img) {
                        height: 120px !important;
                    }
                    .hero-carrusel-content-side {
                        width: 100%;
                        margin: 0;
                        border-radius: 0;
                        padding: 4rem 2rem;
                        background: rgba(209,245,240,0.85);
                        position: relative;
                        z-index: 2;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                       }
                       .hero-carrusel-content-side h1 {
                           font-size: 2rem;
                       }
                       .hero-carrusel-content-side h2 {
                           font-size: 1.2rem;
                       }
                       .hero-carrusel-content-side p {
                           font-size: 1.5rem;
                    }
                    .carrusel-arrow {
                        top: 50%;
                        transform: translateY(-50%);
                        opacity: 0.7;
                    }
                    .carrusel-arrow.left { left: 1rem; right: unset; }
                    .carrusel-arrow.right { right: 1rem; left: unset; }
                }
                    /* Eliminado el bloque de 600px para que el tamaño se mantenga igual en ambos media queries */
            `}</style>
        </section>
    );
}
