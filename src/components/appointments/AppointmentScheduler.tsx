"use client";
import { useState, useEffect } from "react";
import {
  Professional,
  Service,
  TimeSlot,
  AppointmentSummary,
} from "@/lib/types/appointment";
import { appointmentService } from "@/lib/services/appointmentService";
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

  // Cargar áreas al montar el componente
  useEffect(() => {
    loadAreas();
  }, []);

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
      return;
    }

    try {
      // Crear la cita
      const appointmentData = {
        professional_id: selectedProfessional.id,
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        user_id: user.id,
      };

      await appointmentService.createAppointment(appointmentData);

      // Resetear selecciones
      setSelectedProfessional(null);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);

      alert("¡Cita agendada exitosamente!");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error al agendar la cita. Por favor, intenta nuevamente.");
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
        />
      </div>
    </div>
  );
}
