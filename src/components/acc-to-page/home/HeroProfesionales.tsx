"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Imports de imágenes de profesionales de ejemplo comentados - Solo se usan profesionales de la base de datos
// import prof1 from "../../Fotos/Ps. Gianina Soto.jpg";
// import prof2 from "../../Fotos/Ps. Jaime Correa.png";
// import prof3 from "../../Fotos/Ps. Sandra Herrera.jpg";
import {
  Users,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import ProfessionalDetailDialog from "@/components/professional/ProfessionalDetailDialog";
import { supabaseTyped } from "@/utils/supabase/client";
import type { Professional } from "@/lib/types/appointment";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { useUserProfile } from "@/lib/hooks/useUserProfile";

// Tipos para los datos de Supabase
interface ProfessionalTitleData {
  id: number;
  title_name: string;
}

interface UserData {
  name: string;
  last_name: string;
  email: string;
  phone_number: string;
  avatar_url: string | null;
  gender: string | null;
}

interface ProfessionalSpecialtyData {
  specialties: {
    name: string;
  } | null;
}

// Tipo para los datos que vienen de Supabase (puede variar según la consulta)
type ProfessionalFromDB = {
  id: number;
  profile_description: string | null;
  plan_type: string | null;
  monthly_plan_expires_at: string | null;
  approach_id: number | null;
  therapeutic_approaches?: {
    id: number;
    name: string;
    description: string | null;
  } | {
    id: number;
    name: string;
    description: string | null;
  }[] | null;
  professional_titles: ProfessionalTitleData | ProfessionalTitleData[];
  users: UserData | UserData[];
} & Record<string, unknown>;

// Profesionales de ejemplo (prueba) - COMENTADOS: Solo se usan profesionales de la base de datos
/*
const exampleProfessionals = [
  {
    id: -1,
    name: "Gianina",
    last_name: "Soto",
    title_name: "Psicoterapia",
    profile_description:
      "La Ps. Soto cuenta con más de 15 años de experiencia en las áreas de psicología y salud mental.",
    avatar_url: prof1.src,
    specialties: [],
    university: "U. de Chile",
  },
  {
    id: -2,
    name: "Jaime",
    last_name: "Correa",
    title_name: "Psicoterapia Psicoanalítica",
    profile_description:
      "Como Psicólogo se especializa en psicología con enfoque psicoanalítico.",
    avatar_url: prof2.src,
    specialties: [],
    university: "U. Mayor",
  },
  {
    id: -3,
    name: "Sandra",
    last_name: "Herrera",
    title_name: "Psicoterapia Sistémica",
    profile_description:
      "Con más de una década de experiencia, la Ps. Herrera es la residente experta en salud mental.",
    avatar_url: prof3.src,
    specialties: [],
    university: "USACH",
  },
];
*/

export default function HeroProfesionales() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthState();
  const { isPatient } = useUserProfile();
  const [dbProfessionals, setDbProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mapeo de profesionales de ejemplo - COMENTADO: Solo se usan profesionales de la base de datos
  /*
  const professionalMapping: {
    [key: number]: { professionalId: number; areaName: string };
  } = {
    [-1]: { professionalId: 1, areaName: "Psicología" }, // Gianina Soto
    [-2]: { professionalId: 2, areaName: "Psicología" }, // Jaime Correa
    [-3]: { professionalId: 3, areaName: "Psicología" }, // Sandra Herrera
  };
  */

  const handleBookAppointment = (professional: Professional) => {
    if (authLoading) return;

    // Solo profesionales de BD
    const areaName = professional.title_name || "Psicología";
    const professionalId = professional.id;

    if (isAuthenticated && user) {
      if (isPatient === true) {
        const params = new URLSearchParams({
          area: areaName,
          professionalId: professionalId.toString(),
        });
        router.push(`/dashboard/appointments?${params.toString()}`);
      } else {
        router.push("/dashboard");
      }
      return;
    }

    const params = new URLSearchParams({
      area: areaName,
      professionalId: professionalId.toString(),
    });
    const redirectUrl = `/dashboard/appointments?${params.toString()}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  };

  // Cargar profesionales con plan mensual activo
  useEffect(() => {
    const loadMonthlyProfessionals = async () => {
      try {
        setIsLoading(true);

        // Obtener profesionales con plan mensual activo
        const { data, error } = await supabaseTyped
          .from("professionals")
          .select(
            `
            id,
            profile_description,
            plan_type,
            monthly_plan_expires_at,
            approach_id,
            therapeutic_approaches(
              id,
              name,
              description
            ),
            professional_titles!inner(
              id,
              title_name
            ),
            users!inner(
              name,
              last_name,
              email,
              phone_number,
              avatar_url,
              gender
            )
          `
          )
          .eq("is_active", true)
          .eq("users.is_active", true)
          .or("plan_type.is.null,plan_type.eq.monthly")
          .order("id", { ascending: true });

        if (error) {
          console.error("Error cargando profesionales:", error);
          setDbProfessionals([]);
          return;
        }

        if (!data || data.length === 0) {
          setDbProfessionals([]);
          return;
        }

        // Filtrar solo los que tienen plan mensual activo (monthly_plan_expires_at > ahora) o plan_type null (prueba)
        const now = new Date().toISOString();
        const activeProfessionals = data.filter((prof: ProfessionalFromDB) => {
          // Si plan_type es null, es de prueba (incluirlo)
          if (!prof.plan_type || prof.plan_type === null) return true;
          // Si plan_type es monthly, verificar que monthly_plan_expires_at esté en el futuro
          if (prof.plan_type === "monthly") {
            if (!prof.monthly_plan_expires_at) return false;
            const expiresAt = new Date(prof.monthly_plan_expires_at);
            const nowDate = new Date(now);
            return expiresAt > nowDate;
          }
          return false;
        });

        // Obtener especialidades y datos académicos para cada profesional
        const professionalsWithSpecialties = await Promise.all(
          activeProfessionals.map(async (prof: ProfessionalFromDB) => {
            const professionalId = Number(prof.id);
            
            const { data: specialtiesData } = await supabaseTyped
              .from("professional_specialties")
              .select(
                `
                specialties(
                  name
                )
              `
              )
              .eq("professional_id", professionalId);

            const specialties =
              (specialtiesData as ProfessionalSpecialtyData[] | null)
                ?.map((ps: ProfessionalSpecialtyData) => {
                  const specialty = ps.specialties;
                  return specialty?.name || null;
                })
                .filter((name): name is string => Boolean(name)) || [];

            // Supabase puede devolver arrays o objetos únicos dependiendo de la consulta
            // Con !inner debería ser un objeto único, pero TypeScript lo trata como array
            const usersData = Array.isArray(prof.users)
              ? prof.users[0]
              : prof.users;
            const users = usersData as {
              name?: string;
              last_name?: string;
              email?: string;
              phone_number?: string;
              avatar_url?: string;
              gender?: string;
            };
            const titlesData = Array.isArray(prof.professional_titles)
              ? prof.professional_titles[0]
              : prof.professional_titles;
            const professionalTitles = titlesData as {
              title_name?: string;
              id?: number;
            };

            // Obtener enfoque terapéutico
            const therapeuticApproaches = prof.therapeutic_approaches;
            let approach: {
              id: number;
              name: string;
              description: string | null;
            } | undefined = undefined;

            if (therapeuticApproaches) {
              const approachData = Array.isArray(therapeuticApproaches)
                ? therapeuticApproaches[0]
                : therapeuticApproaches;

              if (approachData && typeof approachData === "object") {
                const approachObj = approachData as {
                  id?: unknown;
                  name?: unknown;
                  description?: unknown | null;
                };
                if (approachObj.id && approachObj.name) {
                  approach = {
                    id: Number(approachObj.id),
                    name: String(approachObj.name),
                    description: approachObj.description
                      ? String(approachObj.description)
                      : null,
                  };
                }
              }
            }

            const approachId = prof.approach_id ? Number(prof.approach_id) : null;

            // Obtener datos académicos desde el endpoint API
            let academicData: {
              university?: string;
              profession?: string;
              study_year_start?: string;
              study_year_end?: string;
              extra_studies?: string;
              degree_copy_url?: string | null;
              professional_certificate_url?: string | null;
              additional_certificates_urls?: string[] | null;
            } = {};

            try {
              const response = await fetch(
                `/api/public/professional-academic-data/${professionalId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (response.ok) {
                const result = await response.json();
                if (result.data) {
                  academicData = result.data;
                }
              }
            } catch (error) {
              // Silently fail - academic data is optional
            }

            return {
              id: professionalId,
              user_id: String(professionalId),
              name: String(users?.name || ""),
              last_name: String(users?.last_name || ""),
              email: String(users?.email || ""),
              phone_number: String(users?.phone_number || ""),
              title_name: String(professionalTitles?.title_name || ""),
              title_id: Number(professionalTitles?.id || 0),
              profile_description: String(prof.profile_description || ""),
              avatar_url: users?.avatar_url
                ? String(users.avatar_url)
                : undefined,
              gender: users?.gender ? String(users.gender) : undefined,
              specialties: specialties,
              is_active: true,
              created_at: new Date().toISOString(),
              approach_id: approachId,
              approach: approach,
              ...academicData,
            };
          })
        );

        setDbProfessionals(professionalsWithSpecialties);
      } catch (error) {
        console.error("Error cargando profesionales:", error);
        setDbProfessionals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthlyProfessionals();
  }, []);

  // Solo usar profesionales de la base de datos (profesionales de ejemplo comentados)
  const allProfessionals = dbProfessionals;

  // Hook para detectar tamaño de pantalla
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Determinar cuántos mostrar según el tamaño de pantalla
  const itemsPerPage = isMobile ? 1 : isTablet ? 2 : 3;
  const maxIndex = Math.max(0, allProfessionals.length - itemsPerPage);

  // Resetear índice cuando cambia el tamaño de pantalla
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(0);
    }
  }, [isMobile, isTablet, maxIndex, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const showNavigation = allProfessionals.length > itemsPerPage;

  return (
    <section className="bg-gradient-to-br from-teal-100/50 via-white to-teal-50/30 py-16 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full mb-6 md:mb-8 shadow-lg">
            <Users className="size-12 md:size-14 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Conoce a los Profesionales
          </h3>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
        </div>

        <div className="relative px-8 md:px-12 lg:px-16">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando profesionales...</p>
            </div>
          ) : (
            <>
              {/* Navegación izquierda */}
              {showNavigation && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 lg:-translate-x-6 z-10 bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-teal-200"
                  aria-label="Profesional anterior"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                </button>
              )}

              {/* Grid de profesionales */}
              <div className="relative overflow-hidden min-h-[500px] md:min-h-[500px] pb-4 md:pb-6">
                {/* Contenedor móvil - muestra uno a la vez con transición suave */}
                {isMobile ? (
                  <div className="relative w-full h-full min-h-[500px] px-4">
                    {allProfessionals.map((professional, index) => {
                      const fullName =
                        `${professional.name} ${professional.last_name}`.trim() ||
                        professional.email ||
                        "Profesional";

                      const avatarSrc = professional.avatar_url || undefined;

                      const isActive = index === currentIndex;
                      const isNext = index === currentIndex + 1;
                      const isPrev = index === currentIndex - 1;

                      return (
                        <div
                          key={professional.id}
                          className={`absolute inset-x-4 top-0 bottom-0 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all duration-700 ease-out h-full ${
                            isActive
                              ? "opacity-100 translate-x-0 scale-100 z-10"
                              : isNext
                                ? "opacity-0 translate-x-full scale-95 z-0"
                                : isPrev
                                  ? "opacity-0 -translate-x-full scale-95 z-0"
                                  : "opacity-0 translate-x-full scale-95 z-0"
                          }`}
                        >
                          <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-teal-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200 flex-shrink-0">
                            {avatarSrc ? (
                              <Image
                                src={avatarSrc}
                                alt={fullName}
                                width={128}
                                height={128}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Users className="w-16 h-16 text-teal-400" />
                            )}
                          </div>
                          <h4 className="font-bold text-xl text-teal-900 mb-2 text-center">
                            {fullName}
                          </h4>
                          <p className="text-sm font-semibold text-teal-700 mb-3 uppercase tracking-wide text-center">
                            {professional.title_name || "Profesional"}
                          </p>
                          <div className="mb-4 flex-grow min-h-0">
                            <p className="text-sm text-gray-600 leading-relaxed overflow-hidden text-center w-full" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical' as const,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {professional.profile_description ||
                                "Profesional certificado con experiencia en terapia online."}
                            </p>
                          </div>
                          <div className="mb-4 flex-shrink-0">
                            {"university" in professional &&
                            professional.university ? (
                              <span className="text-sm font-medium text-teal-600 bg-teal-50 px-4 py-2 rounded-full">
                                {String(professional.university)}
                              </span>
                            ) : professional.specialties &&
                              professional.specialties.length > 0 ? (
                              <div className="flex flex-wrap gap-2 justify-center">
                                {professional.specialties
                                  .slice(0, 2)
                                  .map((specialty, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex gap-2 w-full mt-auto">
                            <button
                              onClick={() => {
                                setSelectedProfessional(professional as Professional);
                                setIsDialogOpen(true);
                              }}
                              className="flex-1 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-2.5 px-4 rounded-lg font-semibold transition-all cursor-pointer flex-shrink-0 text-sm"
                            >
                              Ver más
                            </button>
                            <button
                              onClick={() => handleBookAppointment(professional)}
                              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer flex-shrink-0 text-sm"
                            >
                              <Calendar className="size-4" />
                              Agendar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Contenedor desktop/tablet - grid responsivo con deslizamiento suave */
                  <div className="relative w-full flex justify-center">
                    <div
                      className="relative overflow-visible"
                      style={{
                        width: isTablet
                          ? "calc(45% * 2 + 5%)"
                          : "calc(30% * 3 + 4%)",
                        maxWidth: isTablet
                          ? "calc(400px * 2 + 24px)"
                          : "calc(350px * 3 + 32px)",
                        marginLeft: "2%",
                        paddingBottom: "1.5rem",
                      }}
                    >
                      <div
                        className="flex transition-transform duration-700 ease-in-out items-stretch"
                        style={{
                          transform: isTablet
                            ? `translateX(calc(-${currentIndex} * 50%))`
                            : `translateX(calc(-${currentIndex} * 33.33%))`,
                          minHeight: "500px",
                          width: isTablet
                            ? "calc(45% * 2 + 5%)"
                            : "calc(32% * 3 + 4%)",
                          maxWidth: isTablet
                            ? "calc(400px * 2 + 24px)"
                            : "calc(380px * 3 + 32px)",
                          paddingBottom: "1.5rem",
                        }}
                      >
                        {allProfessionals.map((professional, index) => {
                          const fullName =
                            `${professional.name} ${professional.last_name}`.trim() ||
                            professional.email ||
                            "Profesional";

                          const avatarSrc = professional.avatar_url || undefined;

                          const isVisible = isTablet
                            ? index >= currentIndex && index < currentIndex + 2
                            : index >= currentIndex && index < currentIndex + 3;
                          const positionInView = index - currentIndex;
                          const animationDelay = positionInView * 80;

                          return (
                            <div
                              key={professional.id}
                              className="flex-shrink-0 h-full"
                              style={{
                                width: isTablet ? "45%" : "30%",
                                marginRight:
                                  index < allProfessionals.length - 1
                                    ? isTablet
                                      ? "5%"
                                      : "2%"
                                    : "0",
                                maxWidth: isTablet ? "400px" : "350px",
                                transition: `opacity 0.5s ease-out ${animationDelay}ms, transform 0.5s ease-out ${animationDelay}ms`,
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible
                                  ? `translateY(0)`
                                  : `translateY(20px)`,
                              }}
                            >
                              <div
                                className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center h-full w-full transform transition-all duration-500 ease-in-out hover:shadow-2xl hover:-translate-y-1"
                                style={{
                                  boxSizing: "border-box",
                                  minHeight: "500px",
                                }}
                              >
                                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-teal-400 shadow-lg flex items-center justify-center bg-gradient-to-br from-teal-100 to-teal-200 flex-shrink-0">
                                  {avatarSrc ? (
                                    <Image
                                      src={avatarSrc}
                                      alt={fullName}
                                      width={128}
                                      height={128}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <Users className="w-16 h-16 text-teal-400" />
                                  )}
                                </div>
                                <h4 className="font-bold text-xl text-teal-900 mb-2 text-center w-full">
                                  {fullName}
                                </h4>
                                <p className="text-sm font-semibold text-teal-700 mb-3 uppercase tracking-wide text-center w-full break-words">
                                  {professional.title_name || "Profesional"}
                                </p>
                                <div className="mb-4 flex-grow min-h-0">
                                  <p className="text-sm text-gray-600 leading-relaxed w-full break-words overflow-hidden text-center" style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical' as const,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {professional.profile_description ||
                                      "Profesional certificado con experiencia en terapia online."}
                                  </p>
                                </div>
                                <div className="mb-4 flex-shrink-0 w-full flex justify-center">
                                  {"university" in professional &&
                                  professional.university ? (
                                    <span className="text-sm font-medium text-teal-600 bg-teal-50 px-4 py-2 rounded-full whitespace-nowrap">
                                      {String(professional.university)}
                                    </span>
                                  ) : professional.specialties &&
                                    professional.specialties.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 justify-center">
                                      {professional.specialties
                                        .slice(0, 2)
                                        .map((specialty, idx) => (
                                          <span
                                            key={idx}
                                            className="text-xs font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full break-words"
                                          >
                                            {specialty}
                                          </span>
                                        ))}
                                    </div>
                                  ) : null}
                                </div>
                                <div className="flex gap-2 w-full mt-auto">
                                  <button
                                    onClick={() => {
                                      setSelectedProfessional(professional as Professional);
                                      setIsDialogOpen(true);
                                    }}
                                    className="flex-1 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer flex-shrink-0 text-xs"
                                  >
                                    Ver más
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleBookAppointment(professional)
                                    }
                                    className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2 px-3 text-sm rounded-lg flex items-center justify-center gap-1.5 shadow-md transform transition-all hover:scale-105 cursor-pointer flex-shrink-0"
                                  >
                                    <Calendar className="size-3.5" />
                                    Agendar
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navegación derecha */}
              {showNavigation && (
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 lg:translate-x-6 z-10 bg-white rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-teal-200"
                  aria-label="Siguiente profesional"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                </button>
              )}

              {/* Indicadores de página (solo en móvil) */}
              {showNavigation && isMobile && (
                <div className="flex justify-center gap-2 mt-6">
                  {allProfessionals.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentIndex
                          ? "bg-teal-600 w-6"
                          : "bg-teal-300 hover:bg-teal-400"
                      }`}
                      aria-label={`Ir a profesional ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Botón para ver más profesionales */}
        <div className="text-center mt-10 md:mt-12">
          <Link
            href="/professionals"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Ver Todos los Profesionales
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Dialog de información detallada del profesional */}
      <ProfessionalDetailDialog
        professional={selectedProfessional}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onBookAppointment={handleBookAppointment}
      />
    </section>
  );
}
