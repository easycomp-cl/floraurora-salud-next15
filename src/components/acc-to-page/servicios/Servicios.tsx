"use client";

import { User, Heart, Users, Check, Eye } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import logoImge from "../../Fotos/logo.png";
import serviciosImg from "../../Fotos/servicios.jpg";

export default function Servicios() {
  const pathname = usePathname();
  const [highlightedService, setHighlightedService] = useState<string | null>(null);
  
  // Ref para el hero
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Refs para cada servicio
  const infantoJuvenilRef = useRef<HTMLDivElement>(null);
  const adultosRef = useRef<HTMLDivElement>(null);
  const parejaRef = useRef<HTMLDivElement>(null);
  const evaluacionRef = useRef<HTMLDivElement>(null);
  
  // Ref para rastrear si estamos haciendo scroll manual
  const isManualScrollRef = useRef(false);

  // Función de scroll suave personalizada con offset opcional
  const smoothScrollTo = useCallback((element: HTMLElement, duration: number = 800, offset: number = 0) => {
    const start = window.pageYOffset;
    const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
    const target = elementTop + offset; // Aplicar offset (negativo para subir más)
    const distance = target - start;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Función de easing (easeInOutCubic)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      window.scrollTo(0, start + distance * ease);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, []);

  const scrollToService = useCallback((hash: string, fromExternalPage: boolean = false) => {
    if (!hash) return;

    // Mapeo de hash a refs
    const refMap: { [key: string]: React.RefObject<HTMLDivElement | null> } = {
      "psicoterapia-infanto-juvenil": infantoJuvenilRef,
      "psicoterapia-adultos": adultosRef,
      "terapia-pareja": parejaRef,
      "evaluacion-psicodiagnostico": evaluacionRef,
    };

    const targetRef = refMap[hash];
    
    if (!targetRef?.current) return;

    if (fromExternalPage) {
      // Si venimos de otra página, primero ir al hero, luego al servicio
      // Primero ir al top instantáneamente
      window.scrollTo({ top: 0, behavior: "instant" });
      
      // Esperar un momento para asegurar que estamos en el top
      setTimeout(() => {
        // Scroll suave al hero
        if (heroRef?.current) {
          smoothScrollTo(heroRef.current, 600);
          
          // Después de scroll al hero, ir al servicio con offset para no ocultar el logo
          setTimeout(() => {
            if (targetRef.current) {
              // Offset negativo de 100px para que no oculte el logo del servicio
              smoothScrollTo(targetRef.current, 800, -100);
              
              // Activar efecto de destacado después de 300ms
              setTimeout(() => {
                setHighlightedService(hash);
                
                // Remover el efecto después de 1 segundo
                setTimeout(() => {
                  setHighlightedService(null);
                }, 1000);
              }, 300);
            }
          }, 700); // Esperar a que termine el scroll al hero
        } else {
          // Si no hay hero, ir directo al servicio después del top con offset
          setTimeout(() => {
            if (targetRef.current) {
              smoothScrollTo(targetRef.current, 800, -100);
              // Activar efecto de destacado después de 1 segundo
              setTimeout(() => {
                setHighlightedService(hash);
                setTimeout(() => {
                  setHighlightedService(null);
                }, 1000);
              }, 1000);
            }
          }, 300);
        }
      }, 100);
    } else {
      // Si ya estamos en la página, ir directo al servicio con scroll suave
      // Offset negativo de 80px para centrar mejor el servicio
      smoothScrollTo(targetRef.current, 800, -80);
      
      // Activar efecto de destacado después de 300ms
      setTimeout(() => {
        setHighlightedService(hash);
        
        // Remover el efecto después de 1 segundo
        setTimeout(() => {
          setHighlightedService(null);
        }, 1000);
      }, 300);
    }
  }, [smoothScrollTo]);

  useEffect(() => {
    // Marcar que estamos en la página de servicios
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isOnServicesPage', 'true');
      
      // Prevenir el scroll automático del navegador si hay hash
      const hash = window.location.hash.slice(1);
      if (hash) {
        // Prevenir scroll automático - ir al top inmediatamente
        window.scrollTo(0, 0);
        // Remover el hash temporalmente para prevenir scroll automático
        const originalHash = window.location.hash;
        window.history.replaceState(null, '', window.location.pathname);
        
        // Restaurar el hash después de un momento
        setTimeout(() => {
          window.history.replaceState(null, '', originalHash);
        }, 50);
      }
    }

    // Función para manejar el scroll al servicio
    const handleScrollToService = (fromExternal: boolean = false) => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        scrollToService(hash, fromExternal);
      }
    };

    // Esperar a que la página esté completamente renderizada
    const handleInitialScroll = () => {
      // Esperar un poco más para asegurar que todos los refs estén listos
      setTimeout(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
          // Verificar si venimos de otra página (no estábamos en /services antes)
          const wasOnServicesPage = sessionStorage.getItem('wasOnServicesPage') === 'true';
          
          if (!wasOnServicesPage) {
            // Venimos de otra página: primero al hero, luego al servicio
            handleScrollToService(true);
          } else {
            // Ya estábamos en la página: directo al servicio
            handleScrollToService(false);
          }
        }
      }, 500); // Dar tiempo suficiente para que los refs estén disponibles
    };

    // Escuchar cambios en el hash (cuando se navega desde la misma página)
    const handleHashChange = () => {
      // Si estamos manejando el scroll manualmente, ignorar este evento
      if (isManualScrollRef.current) {
        isManualScrollRef.current = false;
        return;
      }
      
      const hash = window.location.hash.slice(1);
      if (hash) {
        const isOnServicesPage = window.location.pathname === '/services';
        if (isOnServicesPage) {
          // Prevenir scroll automático restaurando posición
          const savedScrollY = sessionStorage.getItem('savedScrollY');
          if (savedScrollY) {
            window.scrollTo(0, parseInt(savedScrollY));
            sessionStorage.removeItem('savedScrollY');
          }
          
          // Hacer nuestro scroll suave
          setTimeout(() => {
            handleScrollToService(false);
          }, 50);
        }
      }
    };

    // Escuchar clics en enlaces con hash
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href*="#"]') as HTMLAnchorElement;
      if (link && link.href.includes('/services#')) {
        const hash = new URL(link.href).hash.slice(1);
        if (hash) {
          // Capturar si estamos en la página de servicios ANTES de que Next.js actualice la URL
          const isOnServicesPage = window.location.pathname === '/services';
          
          if (isOnServicesPage) {
            // Si estamos en la misma página, prevenir el scroll automático del navegador
            e.preventDefault();
            e.stopPropagation();
            
            // Guardar la posición actual del scroll antes de que cambie
            const currentScrollY = window.scrollY;
            sessionStorage.setItem('savedScrollY', currentScrollY.toString());
            
            // Marcar que estamos haciendo scroll manual
            isManualScrollRef.current = true;
            
            // Actualizar la URL sin hacer scroll automático
            window.history.pushState(null, '', link.href);
            
            // Prevenir cualquier scroll automático que pueda ocurrir inmediatamente
            requestAnimationFrame(() => {
              window.scrollTo(0, currentScrollY);
              
              // Esperar un frame más para asegurar que no hay scroll automático
              requestAnimationFrame(() => {
                window.scrollTo(0, currentScrollY);
                
                // Ahora hacer nuestro scroll suave después de un pequeño delay
                setTimeout(() => {
                  handleScrollToService(false);
                }, 100);
              });
            });
          } else {
            // Si venimos de otra página, dejar que Next.js maneje la navegación
            setTimeout(() => {
              handleScrollToService(true);
            }, 250);
          }
        }
      }
    };

    // Esperar a que el DOM esté completamente cargado antes de hacer scroll inicial
    if (document.readyState === 'complete') {
      handleInitialScroll();
    } else {
      window.addEventListener('load', handleInitialScroll);
    }

    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener('load', handleInitialScroll);
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname, scrollToService]);

  // Efecto separado para limpiar cuando salimos de la página
  useEffect(() => {
    return () => {
      // Cuando el componente se desmonta, limpiar el marcador y guardar que estábamos aquí
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('isOnServicesPage');
        // Solo marcar wasOnServicesPage si realmente estábamos en /services
        if (pathname === '/services') {
          sessionStorage.setItem('wasOnServicesPage', 'true');
        } else {
          sessionStorage.removeItem('wasOnServicesPage');
        }
      }
    };
  }, [pathname]);

  // Función para obtener las clases de destacado
  const getHighlightClasses = (serviceId: string) => {
    if (highlightedService === serviceId) {
      return "ring-4 ring-teal-400 ring-offset-4 scale-105 shadow-2xl";
    }
    return "";
  };
  return (
    <section id="servicios" className="w-full bg-white">
      {/* Header con estilo similar a Nosotros */}
      <div ref={heroRef} className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={serviciosImg}
          alt="Servicios FlorAurora"
          fill
          priority
          className="object-cover brightness-90"
        />
        {/* Overlay oscuro pero balanceado para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/65 via-teal-900/70 to-gray-900/65" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <Image
            src={logoImge}
            alt="Logo FlorAurora Salud"
            width={80}
            height={80}
            className="absolute top-6 left-6 md:top-8 md:left-8 z-20 rounded-lg shadow-xl bg-white p-2"
            priority
          />
          
          {/* Contenido principal */}
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
                Nuestros Servicios
              </h1>
              <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full shadow-lg"></div>
      </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed drop-shadow-xl font-normal">
                Contamos con distintas especialidades en atención de salud mental para ajustarnos a tus necesidades.
        </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas con estilo mejorado */}
      <div className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid gap-8 grid-cols-1">
        {/* Tarjeta 1 */}
            <div 
              id="psicoterapia-infanto-juvenil" 
              ref={infantoJuvenilRef}
              className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${getHighlightClasses("psicoterapia-infanto-juvenil")}`}
            >
          <div className="flex-1 flex flex-col">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-6 shadow-lg">
                  <User className="size-8 md:size-10 text-white" strokeWidth={2} />
            </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              PSICOTERAPIA INFANTO JUVENIL
            </h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              La psicoterapia Infanto juvenil es una intervención psicológica
              orientada a diagnosticar y tratar problemas emocionales,
              conductuales, sociales y del desarrollo tanto en niños como en
              adolescentes, a través de herramientas adecuadas a la edad del
              paciente, trabajando con la familia cada vez que fuere necesario.
              Contamos con profesionales capacitados para responder a las
              necesidades psicoterapéuticas tanto de niños como adolescentes.
            </p>
                <ul className="space-y-2 text-gray-600 text-sm md:text-base mb-6">
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Ansiedad y estrés
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Depresión
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Problemas de
                autoestima
              </li>
            </ul>
          </div>
              <button className="mt-auto w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg">
            Agendar Sesión
          </button>
        </div>

        {/* Tarjeta 2 */}
            <div 
              id="psicoterapia-adultos" 
              ref={adultosRef}
              className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${getHighlightClasses("psicoterapia-adultos")}`}
            >
          <div className="flex-1 flex flex-col">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 shadow-lg">
                  <Heart className="size-8 md:size-10 text-white" strokeWidth={2} />
            </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">PSICOTERAPIA ADULTOS</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              La psicoterapia es una intervención a través de técnicas
              psicológicas y dialógicas, que tiene como finalidad aliviar
              conflictos emocionales, así como la comprensión y modificación de
              pensamientos y conductas disfuncionales que pudieran afectar en
              relaciones interpersonales, toma de decisiones y confrontación de
              situaciones de la vida cotidiana.Te invitamos a conocer a los
              profesionales que trabajan en FlorAurora.
            </p>
                <ul className="space-y-2 text-gray-600 text-sm md:text-base mb-6">
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Comunicación
                efectiva
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Resolución de
                conflictos
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Intimidad emocional
              </li>
            </ul>
          </div>
              <button className="mt-auto w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold py-3 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg">
            Agendar Sesión
          </button>
        </div>

        {/* Tarjeta 3 */}
            <div 
              id="terapia-pareja" 
              ref={parejaRef}
              className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${getHighlightClasses("terapia-pareja")}`}
            >
          <div className="flex-1 flex flex-col">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mb-6 shadow-lg">
                  <Users className="size-8 md:size-10 text-white" strokeWidth={2} />
            </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">TERAPIA DE PAREJA</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              llevada a cabo por psicólogos formados en este tipo de
              intervención, y su objetivo es el desarrollo de una mejor
              comunicación, la modificación de conductas poco funcionales en el
              vínculo y la construcción de una relación saludable y
              satisfactoria, respondiendo a las necesidades de ambos miembros de
              la pareja. El psicólogo a cargo cumple con un rol neutral que
              favorece la construcción de dichas habilidades.
            </p>
                <ul className="space-y-2 text-gray-600 text-sm md:text-base mb-6">
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Dinámicas
                familiares
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Resolución de
                conflictos
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Comunicación
                familiar
              </li>
            </ul>
          </div>
              <button className="mt-auto w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg">
            Agendar Sesión
          </button>
        </div>
        {/* Tarjeta 4: Evaluación y Psicodiagnóstico */}
            <div 
              id="evaluacion-psicodiagnostico" 
              ref={evaluacionRef}
              className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${getHighlightClasses("evaluacion-psicodiagnostico")}`}
            >
          <div className="flex-1 flex flex-col">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-6 shadow-lg">
                  <Eye className="size-8 md:size-10 text-white" strokeWidth={2} />
            </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              EVALUACIÓN Y PSICODIAGNÓSTICO
            </h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">
              Es el proceso llevado a cabo por un psicólogo especializado para
              comprender la estructura de personalidad, funcionamiento cognitivo
              y posibles trastornos en un individuo, a través de un proceso
              metódico y estructurado y la aplicación de baterías y test para
              cada necesidad específica.
            </p>
                <ul className="space-y-2 text-gray-600 text-sm md:text-base mb-6">
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Evaluación de
                personalidad
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Diagnóstico de
                trastornos
              </li>
              <li className="flex items-center gap-2">
                    <Check className="text-teal-500 w-5 h-5 flex-shrink-0" /> Aplicación de test
                psicológicos
              </li>
            </ul>
          </div>
              <button className="mt-auto w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold py-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg">
            Agendar Sesión
          </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
