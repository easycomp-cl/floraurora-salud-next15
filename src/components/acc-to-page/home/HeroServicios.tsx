"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { profileService } from "@/lib/services/profileService";
import icoInfantoJuvenil from "../../Fotos/infanto-juvenil.png";
import icoAdultos from "../../Fotos/adultos.png";
import icoPareja from "../../Fotos/pareja.png";
import icoEvaluacion from "../../Fotos/evaluacion.png";
import { Calendar, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HeroServicios() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthState();
  const [isPatient, setIsPatient] = React.useState<boolean | null>(null);
  const [isCheckingRole, setIsCheckingRole] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<string | null>(null);

  // Verificar si el usuario es paciente
  React.useEffect(() => {
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

  // Mapeo de servicios a nombres de especialidades en la BD
  const serviceMapping: { [key: string]: { serviceName: string; areaName: string } } = {
    "psicoterapia-infanto-juvenil": {
      serviceName: "Psicoterapia Infanto Juvenil",
      areaName: "Psicología"
    },
    "psicoterapia-adultos": {
      serviceName: "Psicoterapia Adultos",
      areaName: "Psicología"
    },
    "terapia-pareja": {
      serviceName: "Terapia de Pareja",
      areaName: "Psicología"
    },
    "evaluacion-psicodiagnostico": {
      serviceName: "Evaluación y Psicodiagnóstico",
      areaName: "Psicología"
    }
  };

  // Descripciones completas de cada servicio
  const serviceDescriptions: { [key: string]: string } = {
    "psicoterapia-infanto-juvenil": "La psicoterapia infanto-juvenil es un servicio especializado dirigido a niños y adolescentes que enfrentan desafíos emocionales, conductuales o de desarrollo. Nuestros profesionales utilizan técnicas adaptadas a cada etapa del desarrollo, creando un ambiente seguro y de confianza donde los menores pueden expresarse libremente. Trabajamos en colaboración con los padres y cuidadores para asegurar un apoyo integral que favorezca el bienestar emocional y el crecimiento saludable del niño o adolescente.",
    "psicoterapia-adultos": "La psicoterapia para adultos ofrece un espacio de acompañamiento profesional para personas que buscan mejorar su bienestar emocional y mental. A través de un proceso terapéutico personalizado, trabajamos en el manejo de ansiedad, depresión, estrés, traumas, problemas de autoestima y otros desafíos de la vida adulta. Nuestro enfoque se adapta a las necesidades individuales de cada persona, proporcionando herramientas y estrategias para enfrentar los retos cotidianos y alcanzar una mejor calidad de vida.",
    "terapia-pareja": "La terapia de pareja es un servicio diseñado para ayudar a las parejas a mejorar su comunicación, resolver conflictos y fortalecer su relación. Trabajamos con parejas que enfrentan dificultades en la comunicación, problemas de intimidad, conflictos recurrentes, crisis o simplemente desean fortalecer su vínculo. A través de técnicas especializadas, facilitamos el diálogo constructivo y ayudamos a identificar patrones que afectan la relación, promoviendo un ambiente de respeto, comprensión y crecimiento mutuo.",
    "evaluacion-psicodiagnostico": "La evaluación y psicodiagnóstico es un proceso sistemático de evaluación psicológica que permite identificar, diagnosticar y comprender diversos aspectos del funcionamiento psicológico de una persona. Utilizamos herramientas estandarizadas y técnicas de evaluación clínica para obtener información detallada sobre el estado emocional, cognitivo y conductual. Este servicio es fundamental para establecer diagnósticos precisos, planificar tratamientos adecuados y proporcionar recomendaciones específicas para el bienestar del paciente."
  };

  // Puntos clave de cada servicio
  const serviceKeyPoints: { [key: string]: string[] } = {
    "psicoterapia-infanto-juvenil": [
      "Ansiedad y estrés",
      "Depresión",
      "Problemas de autoestima"
    ],
    "psicoterapia-adultos": [
      "Comunicación efectiva",
      "Resolución de conflictos",
      "Intimidad emocional"
    ],
    "terapia-pareja": [
      "Dinámicas familiares",
      "Resolución de conflictos",
      "Comunicación familiar"
    ],
    "evaluacion-psicodiagnostico": [
      "Evaluación de personalidad",
      "Diagnóstico de trastornos",
      "Aplicación de test psicológicos"
    ]
  };

  // Mapeo de imágenes para cada servicio
  const serviceImages: { [key: string]: typeof icoInfantoJuvenil } = {
    "psicoterapia-infanto-juvenil": icoInfantoJuvenil,
    "psicoterapia-adultos": icoAdultos,
    "terapia-pareja": icoPareja,
    "evaluacion-psicodiagnostico": icoEvaluacion
  };

  const handleBookService = (serviceKey: string) => {
    if (isLoading || isCheckingRole) {
      return;
    }

    // Si el usuario está autenticado y es paciente, redirigir con parámetros
    if (isAuthenticated && user && isPatient === true) {
      const service = serviceMapping[serviceKey];
      if (service) {
        const params = new URLSearchParams({
          area: service.areaName,
          service: service.serviceName
        });
        router.push(`/dashboard/appointments?${params.toString()}`);
      } else {
        router.push("/dashboard/appointments");
      }
      return;
    }

    // Si no está autenticado, redirigir al login con redirect
    const service = serviceMapping[serviceKey];
    if (service) {
      const params = new URLSearchParams({
        area: service.areaName,
        service: service.serviceName
      });
      const redirectUrl = `/dashboard/appointments?${params.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      router.push("/login?redirect=/dashboard/appointments");
    }
  };

  return (
    <section className="bg-gradient-to-br from-teal-50 via-teal-100/50 to-teal-200/30 py-16 md:py-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-teal-900 tracking-wide uppercase mb-3">
            Nuestros Servicios
          </h3>
          <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full mb-4"></div>
          <p className="text-lg md:text-xl text-teal-900 max-w-3xl mx-auto">
            FlorAurora Salud ofrece atención de primera calidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Servicio 1 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoInfantoJuvenil}
                alt="Psicoterapia Infanto Juvenil"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Psicoterapia <br /> Infanto Juvenil
            </h4>
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button 
                onClick={() => setSelectedService("psicoterapia-infanto-juvenil")}
                className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-1.5 px-4 rounded-lg font-semibold transition-all cursor-pointer text-sm"
              >
                Ver más
              </button>
              <button 
                onClick={() => handleBookService("psicoterapia-infanto-juvenil")}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer text-sm"
              >
                <Calendar className="size-4" />
                Agendar
              </button>
            </div>
          </div>

          {/* Servicio 2 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoAdultos}
                alt="Psicoterapia Adultos"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Psicoterapia <br /> Adultos
            </h4>
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button 
                onClick={() => setSelectedService("psicoterapia-adultos")}
                className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-1.5 px-4 rounded-lg font-semibold transition-all cursor-pointer text-sm"
              >
                Ver más
              </button>
              <button 
                onClick={() => handleBookService("psicoterapia-adultos")}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer text-sm"
              >
                <Calendar className="size-4" />
                Agendar
              </button>
            </div>
          </div>

          {/* Servicio 3 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoPareja}
                alt="Terapia de Pareja"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Terapia <br /> de Pareja
            </h4>
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button 
                onClick={() => setSelectedService("terapia-pareja")}
                className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-1.5 px-4 rounded-lg font-semibold transition-all cursor-pointer text-sm"
              >
                Ver más
              </button>
              <button 
                onClick={() => handleBookService("terapia-pareja")}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer text-sm"
              >
                <Calendar className="size-4" />
                Agendar
              </button>
            </div>
          </div>

          {/* Servicio 4 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transform transition-all hover:shadow-2xl hover:-translate-y-1">
            <div className="w-28 h-28 md:w-32 md:h-32 border-4 border-teal-300 rounded-full flex items-center justify-center mb-6 p-4 shadow-md">
              <Image
                src={icoEvaluacion}
                alt="Evaluación y Psicodiagnóstico"
                width={88}
                height={88}
                className="object-contain drop-shadow-lg"
                style={{ filter: "contrast(1.3) brightness(0.95)" }}
                priority
              />
            </div>
            <h4 className="font-bold text-xl text-teal-900 mb-3 text-center leading-tight">
              Evaluación y <br /> Psicodiagnóstico
            </h4>
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button 
                onClick={() => setSelectedService("evaluacion-psicodiagnostico")}
                className="w-full border-2 border-teal-600 text-teal-600 hover:bg-teal-50 py-1.5 px-4 rounded-lg font-semibold transition-all cursor-pointer text-sm"
              >
                Ver más
              </button>
              <button 
                onClick={() => handleBookService("evaluacion-psicodiagnostico")}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-1.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer text-sm"
              >
                <Calendar className="size-4" />
                Agendar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo para mostrar descripción completa del servicio */}
      <Dialog open={selectedService !== null} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-teal-900">
              {selectedService && serviceMapping[selectedService]?.serviceName}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {/* Puntos clave con imagen */}
            {selectedService && serviceKeyPoints[selectedService] && (
              <div className="mb-6">
                <div className="flex gap-4 items-start">
                  {/* Imagen del servicio */}
                  {selectedService && serviceImages[selectedService] && (
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-teal-300 rounded-full flex items-center justify-center p-3 shadow-md">
                        <Image
                          src={serviceImages[selectedService]}
                          alt={serviceMapping[selectedService]?.serviceName || "Servicio"}
                          width={80}
                          height={80}
                          className="object-contain drop-shadow-lg"
                          style={{ filter: "contrast(1.3) brightness(0.95)" }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Lista de puntos clave */}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Puntos clave:
                    </h4>
                    <ul className="space-y-2 text-gray-700">
                      {serviceKeyPoints[selectedService].map((point, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="text-teal-500 w-5 h-5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {/* Descripción */}
            <div className="mt-4">
              <p className="text-base text-gray-700 leading-relaxed">
                {selectedService && serviceDescriptions[selectedService]}
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                const serviceToBook = selectedService;
                setSelectedService(null);
                if (serviceToBook) {
                  handleBookService(serviceToBook);
                }
              }}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-md transform transition-all hover:scale-105 cursor-pointer"
            >
              <Calendar className="size-4" />
              Agendar cita
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
