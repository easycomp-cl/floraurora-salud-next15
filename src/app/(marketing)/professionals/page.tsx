"use client";

import Image from "next/image";
import { Check, User, X, FileText, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import { appointmentService } from "@/lib/services/appointmentService";
import { useState, useEffect } from "react";
import type { Professional } from "@/lib/types/appointment";
import logoImge from "../../../components/Fotos/logo.png";
import equipoImg from "../../../components/Fotos/psicologos.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfessionalsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthState();
  const [isPatient, setIsPatient] = useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [dbProfessionals, setDbProfessionals] = useState<Professional[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Verificar si el usuario es paciente
  useEffect(() => {
    let isMounted = true;

    const checkUserRole = async () => {
      if (!isAuthenticated || !user) {
        setIsPatient(null);
        return;
      }

      try {
        setIsCheckingRole(true);
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!isMounted) return;
        
        const role = profile?.role ?? null;
        setIsPatient(role === 2); // role 2 = paciente
      } catch (error) {
        console.error("Error verificando rol del usuario:", error);
        if (isMounted) {
          setIsPatient(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingRole(false);
        }
      }
    };

    checkUserRole();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Cargar profesionales de la base de datos
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        setIsLoadingProfessionals(true);
        // Obtener profesionales de todas las áreas (sin filtro)
        // Necesitamos obtenerlos por área y combinarlos
        const areas = await appointmentService.getAreas();
        const allProfessionals: Professional[] = [];
        
        for (const area of areas) {
          try {
            const professionals = await appointmentService.getProfessionals(area.id);
            allProfessionals.push(...professionals);
          } catch (error) {
            console.error(`Error cargando profesionales del área ${area.title_name}:`, error);
          }
        }
        
        setDbProfessionals(allProfessionals);
      } catch (error) {
        console.error("Error cargando profesionales:", error);
        setDbProfessionals([]);
      } finally {
        setIsLoadingProfessionals(false);
      }
    };

    loadProfessionals();
  }, []);

  // Mapeo de profesionales hardcodeados a IDs
  // IMPORTANTE: Dr. Carlos Rodríguez debe usar los datos del profesional "rafa"
  // Reemplazar el professionalId con el ID real del profesional "rafa" de la base de datos
  // COMENTADO: Profesionales de ejemplo removidos - solo se muestran profesionales de la base de datos
  /*
  const professionalMapping: { [key: string]: { professionalId: number; areaName: string } } = {
    "carlos": {
      professionalId: 1, // TODO: Reemplazar con el ID real del profesional "rafa" de la tabla professionals
      areaName: "Psicología"
    },
    "maria": {
      professionalId: 2, // ID temporal
      areaName: "Psicología"
    },
    "ana": {
      professionalId: 3, // ID temporal
      areaName: "Psicología"
    }
  };
  */

  const handleBookWithProfessional = (professionalKey: string, professionalId?: number, areaName?: string) => {
    if (isLoading || isCheckingRole) {
      return;
    }

    // Si se pasa un professionalId y areaName directamente (profesionales de BD)
    if (professionalId && areaName) {
      if (isAuthenticated && user) {
        if (isPatient === true) {
          const params = new URLSearchParams({
            area: areaName,
            professionalId: professionalId.toString()
          });
          router.push(`/dashboard/appointments?${params.toString()}`);
        } else {
          router.push("/dashboard");
        }
        return;
      }
      const params = new URLSearchParams({
        area: areaName,
        professionalId: professionalId.toString()
      });
      const redirectUrl = `/dashboard/appointments?${params.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // Para profesionales de ejemplo
    // COMENTADO: Profesionales de ejemplo removidos - solo se muestran profesionales de la base de datos
    /*
    const professional = professionalMapping[professionalKey];
    if (!professional) {
      return;
    }

    // Si el usuario está autenticado
    if (isAuthenticated && user) {
      // Solo los pacientes pueden agendar citas
      if (isPatient === true) {
        const params = new URLSearchParams({
          area: professional.areaName,
          professionalId: professional.professionalId.toString()
        });
        router.push(`/dashboard/appointments?${params.toString()}`);
      } else {
        // Si no es paciente (profesional o admin), redirigir al dashboard
        router.push("/dashboard");
      }
      return;
    }

    // Si no está autenticado, redirigir al login con redirect
    const params = new URLSearchParams({
      area: professional.areaName,
      professionalId: professional.professionalId.toString()
    });
    const redirectUrl = `/dashboard/appointments?${params.toString()}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    */
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header Section con estilo similar a Nosotros */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={equipoImg}
          alt="Equipo de Profesionales FlorAurora"
          fill
          priority
          className="object-cover brightness-90 transform scale-110 md:object-[center_75%]"
        />
        {/* Overlay oscuro pero balanceado para mejor legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/65 via-teal-900/70 to-gray-900/65" />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 md:px-8 flex flex-col items-center justify-center md:justify-start md:pt-20 lg:pt-24 text-center">
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
                Profesionales
              </h1>
              <div className="w-32 h-1.5 bg-teal-400 mx-auto rounded-full shadow-lg"></div>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-lg md:text-xl lg:text-2xl text-white leading-relaxed drop-shadow-xl font-normal">
                Conoce al equipo de profesionales de la salud, psicólogos especializados, todos certificados y con experiencia en terapia online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Grid */}
      <section className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          {isLoadingProfessionals ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Cargando profesionales...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* COMENTADO: Profesionales de ejemplo removidos - solo se muestran profesionales de la base de datos */}
            {/* Dr. María González */}
            {/* 
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-indigo-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dra. María González
                </h3>
                <p className="text-blue-600 font-semibold mb-4 text-lg">
                  Psicóloga Clínica
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Especialista en terapia cognitivo-conductual con más de 8 años
                  de experiencia en el tratamiento de ansiedad, depresión y
                  trastornos del estado de ánimo.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Individual
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Adultos y Adolescentes
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Español e Inglés
                  </div>
                </div>
                <button 
                  onClick={() => handleBookWithProfessional("maria")}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Agendar con María
                </button>
              </div>
            </div>
            */}

            {/* Dr. Carlos Rodríguez */}
            {/* 
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600/80 to-teal-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dr. Carlos Rodríguez
                </h3>
                <p className="text-teal-600 font-semibold mb-4 text-lg">
                  Psicólogo de Parejas
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Experto en terapia sistémica y familiar con especialización en
                  mediación de conflictos y fortalecimiento de relaciones.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia de Pareja
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    10+ años de experiencia
                  </div>
                </div>
                <button 
                  onClick={() => handleBookWithProfessional("carlos")}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Agendar con Carlos
                </button>
              </div>
            </div>
            */}

            {/* Dra. Ana Silva */}
            {/* 
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="h-64 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 to-purple-700/80"></div>
                <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Dra. Ana Silva
                </h3>
                <p className="text-purple-600 font-semibold mb-4 text-lg">
                  Psicóloga Infantil
                </p>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Especialista en desarrollo infantil y adolescente con enfoque
                  en trastornos del comportamiento y apoyo emocional familiar.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Niños y Adolescentes
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Terapia Familiar
                  </div>
                  <div className="flex items-center text-sm md:text-base text-gray-600">
                    <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                    Certificada en TCC
                  </div>
                </div>
                <button 
                  onClick={() => handleBookWithProfessional("ana")}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  Agendar con Ana
                </button>
              </div>
            </div>
            */}

            {/* Profesionales de la base de datos */}
            {dbProfessionals.map((professional) => {
              const fullName = `${professional.name} ${professional.last_name}`.trim();
              const gradientColors = [
                "from-blue-400 to-indigo-600",
                "from-teal-400 to-teal-600",
                "from-purple-400 to-purple-600",
                "from-pink-400 to-rose-600",
                "from-green-400 to-emerald-600",
                "from-orange-400 to-amber-600",
              ];
              const gradientIndex = professional.id % gradientColors.length;
              const gradient = gradientColors[gradientIndex];
              const bgColors = [
                "from-blue-600/80 to-indigo-700/80",
                "from-teal-600/80 to-teal-700/80",
                "from-purple-600/80 to-purple-700/80",
                "from-pink-600/80 to-rose-700/80",
                "from-green-600/80 to-emerald-700/80",
                "from-orange-600/80 to-amber-700/80",
              ];
              const bgOverlay = bgColors[gradientIndex];
              const buttonColors = [
                "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                "from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800",
                "from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
                "from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800",
                "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
                "from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800",
              ];
              const buttonGradient = buttonColors[gradientIndex];
              const titleColor = [
                "text-blue-600",
                "text-teal-600",
                "text-purple-600",
                "text-pink-600",
                "text-green-600",
                "text-orange-600",
              ];
              const titleColorClass = titleColor[gradientIndex];
              const borderColor = [
                "border-blue-600 text-blue-600 hover:bg-blue-50",
                "border-teal-600 text-teal-600 hover:bg-teal-50",
                "border-purple-600 text-purple-600 hover:bg-purple-50",
                "border-pink-600 text-pink-600 hover:bg-pink-50",
                "border-green-600 text-green-600 hover:bg-green-50",
                "border-orange-600 text-orange-600 hover:bg-orange-50",
              ];
              const borderColorClass = borderColor[gradientIndex];

              return (
                <div
                  key={professional.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className={`h-64 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${bgOverlay}`}></div>
                    {professional.avatar_url ? (
                      <Image
                        src={professional.avatar_url}
                        alt={fullName}
                        fill
                        className="object-cover relative z-10"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <User className="w-24 h-24 text-white relative z-10" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                      {professional.name && professional.last_name
                        ? `${professional.name} ${professional.last_name}`
                        : professional.name || professional.email || "Profesional"}
                    </h3>
                    <p className={`${titleColorClass} font-semibold mb-4 text-lg`}>
                      {professional.title_name || "Profesional"}
                    </p>
                    <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3">
                      {professional.profile_description || "Profesional certificado con experiencia en terapia online."}
                    </p>
                    {professional.specialties && professional.specialties.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {professional.specialties.slice(0, 3).map((specialty, idx) => (
                          <div key={idx} className="flex items-center text-sm md:text-base text-gray-600">
                            <Check className="w-5 h-5 text-teal-500 mr-2 flex-shrink-0" />
                            {specialty}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedProfessional(professional);
                          setIsDialogOpen(true);
                        }}
                        className={`flex-1 border-2 ${borderColorClass} py-2.5 rounded-lg font-semibold transition-all cursor-pointer`}
                      >
                        Ver más
                      </button>
                      <button
                        onClick={() => handleBookWithProfessional("", professional.id, professional.title_name)}
                        className={`flex-1 bg-gradient-to-r ${buttonGradient} text-white py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer`}
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </section>

      {/* Dialog de información detallada del profesional */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedProfessional && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-bold text-gray-900">
                  {selectedProfessional.name && selectedProfessional.last_name
                    ? `${selectedProfessional.name} ${selectedProfessional.last_name}`
                    : selectedProfessional.name || selectedProfessional.email || "Profesional"}
                </DialogTitle>
                <DialogDescription className="text-lg">
                  {selectedProfessional.title_name || "Profesional"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Imagen y información básica */}
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="relative w-full md:w-64 h-64 rounded-2xl overflow-hidden flex-shrink-0">
                    {selectedProfessional.avatar_url ? (
                      <Image
                        src={selectedProfessional.avatar_url}
                        alt={selectedProfessional.name || "Profesional"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                        <User className="w-32 h-32 text-white" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {/* Calificación */}
                    {selectedProfessional.rating && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        <span className="font-semibold text-lg">{selectedProfessional.rating.toFixed(1)}</span>
                        <span className="text-gray-500">Calificación</span>
                      </div>
                    )}

                    {/* Descripción del perfil */}
                    {(selectedProfessional.profile_description || selectedProfessional.bio) && (
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900">Sobre el profesional</h3>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedProfessional.profile_description || selectedProfessional.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Especialidades */}
                {selectedProfessional.specialties && selectedProfessional.specialties.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Especialidades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProfessional.specialties.map((specialty, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700 bg-teal-50 p-3 rounded-lg">
                          <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                          <span>{specialty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón de agendar */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsDialogOpen(false);
                      handleBookWithProfessional("", selectedProfessional.id, selectedProfessional.title_name);
                    }}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-8 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Agendar cita con {selectedProfessional.name || "este profesional"}
                  </button>
                </div>

                {/* Currículum */}
                {selectedProfessional.resume_url && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Documentos</h3>
                    <a
                      href={selectedProfessional.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                    >
                      <FileText className="w-5 h-5" />
                      Ver currículum
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-teal-100/50 via-teal-50 to-teal-200/30 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-10 md:px-12 md:py-14 transform transition-all hover:shadow-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide mb-6">
              ¿Listo para comenzar tu camino hacia el bienestar?
            </h2>
            <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-3xl mx-auto">
              Nuestros profesionales están aquí para ayudarte. Agenda tu primera
              sesión y descubre cómo podemos apoyarte en tu crecimiento personal.
            </p>
            <button 
              onClick={() => router.push("/dashboard/appointments")}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Agendar Primera Sesión
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
