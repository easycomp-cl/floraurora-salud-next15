"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Professional,
  Service,
  TimeSlot,
  AppointmentSummary,
} from "@/lib/types/appointment";
import { appointmentService } from "@/lib/services/appointmentService";
import { profileService } from "@/lib/services/profileService";
import ProfessionalsList from "./ProfessionalsList";
import ServicesList from "./ServicesList";
import Calendar from "./Calendar";
import AppointmentSummaryCard from "./AppointmentSummaryCard";
import { useAuthState } from "@/lib/hooks/useAuthState";

export default function AppointmentScheduler() {
  const { user } = useAuthState();
  const [areas, setAreas] = useState<{ id: number; title_name: string }[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<{
    id: number;
    title_name: string;
  } | null>(null);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Cargar áreas al montar el componente
  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    const loadPatientId = async () => {
      if (!user) {
        setPatientId(null);
        return;
      }

      try {
        const profile = await profileService.getUserProfileByUuid(user.id);
        setPatientId(profile?.id ?? null);
      } catch (error) {
        console.error("Error loading patient profile:", error);
        setPatientId(null);
      }
    };

    loadPatientId();
  }, [user]);

  // Cargar profesionales cuando se selecciona un área
  useEffect(() => {
    if (selectedArea) {
      console.log("selectedArea", selectedArea);
      loadProfessionals(selectedArea.id);
      // Resetear selecciones dependientes
      setSelectedProfessional(null);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setProfessionals([]);
    }
  }, [selectedArea]);

  // Cargar servicios y fechas disponibles cuando se selecciona un profesional
  useEffect(() => {
    if (selectedProfessional) {
      loadServices(selectedProfessional.id);
      loadAvailableDates(selectedProfessional.id);
      // Resetear selecciones dependientes
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setServices([]);
      setAvailableDates([]);
    }
  }, [selectedProfessional]);

  // Cargar horarios cuando se selecciona un profesional y fecha
  useEffect(() => {
    if (selectedProfessional && selectedDate) {
      loadTimeSlots(selectedProfessional.id, selectedDate);
      setSelectedTime(null);
    } else {
      setTimeSlots([]);
    }
  }, [selectedProfessional, selectedDate]);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfessionals = async (areaFilter?: number) => {
    try {
      setLoading(true);
      const data = await appointmentService.getProfessionals(areaFilter);
      setProfessionals(data);
    } catch (error) {
      console.error("Error loading professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (professionalId: number) => {
    try {
      const data = await appointmentService.getServicesByProfessional(
        professionalId
      );
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadAvailableDates = async (professionalId: number) => {
    try {
      console.log(`\n=== CARGANDO FECHAS DISPONIBLES ===`);
      console.log(`Profesional ID: ${professionalId}`);

      const data = await appointmentService.getAvailableDates(professionalId);

      console.log(`Fechas disponibles:`, data);
      setAvailableDates(data);
    } catch (error) {
      console.error("Error loading available dates:", error);
    }
  };

  const loadTimeSlots = async (professionalId: number, date: string) => {
    try {
      console.log(`\n=== CARGANDO HORARIOS ===`);
      console.log(`Profesional ID: ${professionalId}`);
      console.log(`Fecha: ${date}`);

      const data = await appointmentService.getAvailableTimeSlots(
        professionalId,
        date
      );

      console.log(`Horarios obtenidos:`, data);
      setTimeSlots(data);
    } catch (error) {
      console.error("Error loading time slots:", error);
    }
  };

  const handleAreaSelect = (area: { id: number; title_name: string }) => {
    setSelectedArea(area);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmAppointment = async () => {
    if (
      !user ||
      !selectedProfessional ||
      !selectedService ||
      !selectedDate ||
      !selectedTime
    ) {
      setErrorMessage(
        "Debes seleccionar el área, profesional, servicio, fecha y horario para continuar."
      );
      return;
    }

    if (!patientId) {
      setErrorMessage(
        "No se pudo identificar tu perfil de paciente. Por favor, actualiza tu perfil e inténtalo nuevamente."
      );
      return;
    }

    try {
      setErrorMessage(null);
      setIsProcessingPayment(true);

      const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const requiresConfirmation =
        scheduledDateTime.getTime() - Date.now() >= 24 * 60 * 60 * 1000;

      // Crear la cita primero
      const appointment = await appointmentService.createAppointment({
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        patient_id: patientId,
        service_name: selectedService.name,
        area: selectedArea?.title_name,
        duration_minutes: selectedService.duration_minutes,
        requires_confirmation: requiresConfirmation,
      });

      if (!appointment || !appointment.id) {
        throw new Error("No se pudo obtener la cita creada.");
      }

      // Generar buy_order único (máximo 26 caracteres según Transbank)
      // Formato: apt{id} donde id es solo números del appointment.id
      // Extraer solo los dígitos del ID para evitar caracteres especiales
      const appointmentIdStr = String(appointment.id).replace(/\D/g, '');
      if (!appointmentIdStr) {
        throw new Error("No se pudo generar un identificador válido para la orden de compra.");
      }
      // Limitar a 23 caracteres para el ID (26 - 3 para "apt")
      const maxIdLength = 23;
      const truncatedId = appointmentIdStr.length > maxIdLength 
        ? appointmentIdStr.slice(-maxIdLength) 
        : appointmentIdStr.padStart(1, '0');
      const buyOrder = `apt${truncatedId}`;
      
      // Generar session_id único (máximo 61 caracteres según Transbank)
      // Usar el UUID del usuario o un timestamp corto
      const sessionId = user.id || `s${Date.now()}`;

      // Crear transacción de Webpay
      const webpayResponse = await fetch("/api/payments/webpay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: String(appointment.id),
          amount: selectedService.price,
          buyOrder,
          sessionId,
        }),
      });

      if (!webpayResponse.ok) {
        const errorData = await webpayResponse.json();
        console.error("Error creando transacción de Webpay:", errorData);
        throw new Error(
          errorData.error || "Error al iniciar el proceso de pago. Por favor, intenta nuevamente."
        );
      }

      const webpayData = await webpayResponse.json();

      if (!webpayData.success || !webpayData.token || !webpayData.url) {
        throw new Error("No se pudo obtener la información de pago de Webpay.");
      }

      // Redirigir a Webpay usando el componente de redirección
      // Guardar información en sessionStorage para recuperarla después
      sessionStorage.setItem("pendingAppointment", JSON.stringify({
        appointmentId: String(appointment.id),
        requiresConfirmation,
      }));

      // Redirigir a página de redirección a Webpay
      router.push(`/dashboard/appointments/payment?token=${webpayData.token}&url=${encodeURIComponent(webpayData.url)}`);
    } catch (error) {
      console.error("Error creating appointment with payment:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ocurrió un problema al confirmar la cita. Por favor, intenta nuevamente en unos minutos."
      );
      setIsProcessingPayment(false);
    }
  };

  const appointmentSummary: AppointmentSummary = {
    professional: selectedProfessional,
    service: selectedService,
    date: selectedDate,
    time: selectedTime,
    total_price: selectedService?.price || 0,
    duration_minutes: selectedService?.duration_minutes || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {errorMessage && (
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Columna izquierda: Área, Profesionales y Servicios */}
      <div className="lg:col-span-2 space-y-8">
        {/* Selector de Área */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Selecciona un Área</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() => handleAreaSelect(area)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  selectedArea?.id === area.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{area.title_name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Profesionales */}
        {selectedArea && (
          <ProfessionalsList
            professionals={professionals}
            selectedProfessional={selectedProfessional}
            onProfessionalSelect={handleProfessionalSelect}
          />
        )}

        {/* Lista de Servicios */}
        {selectedArea && selectedProfessional && (
          <ServicesList
            services={services}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
          />
        )}

        {/* Calendario y Horarios */}
        {selectedArea && selectedProfessional && selectedService && (
          <Calendar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            timeSlots={timeSlots}
            availableDates={availableDates}
            onDateSelect={handleDateSelect}
            onTimeSelect={handleTimeSelect}
          />
        )}
      </div>

      {/* Columna derecha: Resumen de Cita */}
      <div className="lg:col-span-1">
        <AppointmentSummaryCard
          summary={appointmentSummary}
          onConfirm={handleConfirmAppointment}
          canConfirm={
            !!(
              selectedArea &&
              selectedProfessional &&
              selectedService &&
              selectedDate &&
              selectedTime
            )
          }
          isProcessing={isProcessingPayment}
          processingLabel="Iniciando pago con Webpay..."
        />
      </div>
    </div>
  );
}
