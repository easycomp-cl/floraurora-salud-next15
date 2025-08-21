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
import { useAuth } from "@/lib/hooks/useAuth";

export default function AppointmentScheduler() {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Cargar profesionales al montar el componente
  useEffect(() => {
    loadProfessionals();
  }, []);

  // Cargar servicios cuando se selecciona un profesional
  useEffect(() => {
    if (selectedProfessional) {
      loadServices(selectedProfessional.id);
      // Resetear selecciones dependientes
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
    } else {
      setServices([]);
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

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getProfessionals();
      setProfessionals(data);
    } catch (error) {
      console.error("Error loading professionals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (professionalId: string) => {
    try {
      const data = await appointmentService.getServicesByProfessional(
        professionalId
      );
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadTimeSlots = async (professionalId: string, date: string) => {
    try {
      const data = await appointmentService.getAvailableTimeSlots(
        professionalId,
        date
      );
      setTimeSlots(data);
    } catch (error) {
      console.error("Error loading time slots:", error);
    }
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
        <div className="text-lg">Cargando profesionales...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna izquierda: Profesionales y Servicios */}
      <div className="lg:col-span-2 space-y-8">
        {/* Lista de Profesionales */}
        <ProfessionalsList
          professionals={professionals}
          selectedProfessional={selectedProfessional}
          onProfessionalSelect={handleProfessionalSelect}
        />

        {/* Lista de Servicios */}
        {selectedProfessional && (
          <ServicesList
            services={services}
            selectedService={selectedService}
            onServiceSelect={handleServiceSelect}
          />
        )}

        {/* Calendario y Horarios */}
        {selectedProfessional && selectedService && (
          <Calendar
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            timeSlots={timeSlots}
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
