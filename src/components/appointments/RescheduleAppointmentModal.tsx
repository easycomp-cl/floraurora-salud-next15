"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { appointmentService } from "@/lib/services/appointmentService";
import type { AppointmentWithUsers } from "@/lib/services/appointmentService";
import type { Service, TimeSlot } from "@/lib/types/appointment";
import Calendar from "./Calendar";
import ServicesList from "./ServicesList";

interface RescheduleAppointmentModalProps {
  appointment: AppointmentWithUsers;
  isOpen: boolean;
  onClose: () => void;
  onReschedule?: (newDate: string, newTime: string) => void;
}

export default function RescheduleAppointmentModal({
  appointment,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleAppointmentModalProps) {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const professionalId = appointment.professional_id;

  useEffect(() => {
    if (isOpen && professionalId) {
      loadAvailableDates();
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, professionalId]);

  useEffect(() => {
    if (selectedDate && professionalId) {
      loadTimeSlots();
    } else {
      setTimeSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, professionalId]);

  const loadAvailableDates = async () => {
    if (!professionalId) return;
    try {
      setLoading(true);
      const dates = await appointmentService.getAvailableDates(professionalId);
      setAvailableDates(dates);
    } catch (err) {
      console.error("Error cargando fechas disponibles:", err);
      setError("Error al cargar fechas disponibles");
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    if (!professionalId) return;
    try {
      const servicesData = await appointmentService.getServicesByProfessional(
        professionalId
      );
      setServices(servicesData);
      // Seleccionar el servicio actual si existe
      if (appointment.service && servicesData.length > 0) {
        const currentService = servicesData.find(
          (s) => s.name === appointment.service
        );
        if (currentService) {
          setSelectedService(currentService);
        }
      }
    } catch (err) {
      console.error("Error cargando servicios:", err);
    }
  };

  const loadTimeSlots = async () => {
    if (!professionalId || !selectedDate) return;
    try {
      setLoading(true);
      const slots = await appointmentService.getAvailableTimeSlots(
        professionalId,
        selectedDate
      );
      setTimeSlots(slots.filter((slot) => slot.is_available && !slot.is_booked));
    } catch (err) {
      console.error("Error cargando horarios:", err);
      setError("Error al cargar horarios disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      setError("Por favor selecciona una fecha y hora");
      return;
    }

    if (onReschedule) {
      onReschedule(selectedDate, selectedTime);
    }

    // Por ahora solo cerramos el modal ya que no hay funcionalidad de backend
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Reagendar Cita
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información de la cita actual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Cita Actual
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Fecha:</strong>{" "}
                {new Date(appointment.scheduled_at).toLocaleDateString("es-CL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Hora:</strong>{" "}
                {new Date(appointment.scheduled_at).toLocaleTimeString("es-CL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {appointment.professional && (
                <p>
                  <strong>Profesional:</strong>{" "}
                  {`${appointment.professional.name || ""} ${appointment.professional.last_name || ""}`.trim()}
                </p>
              )}
              {appointment.service && (
                <p>
                  <strong>Servicio:</strong> {appointment.service}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {/* Selección de servicio */}
          {services.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicio
              </label>
              <ServicesList
                services={services}
                selectedService={selectedService}
                onServiceSelect={handleServiceSelect}
              />
            </div>
          )}

          {/* Selección de fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona una nueva fecha
            </label>
            {loading && availableDates.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando fechas disponibles...</p>
              </div>
            ) : availableDates.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No hay fechas disponibles para este profesional
              </p>
            ) : (
              <Calendar
                availableDates={availableDates || []}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                timeSlots={timeSlots}
                onDateSelect={handleDateSelect}
                onTimeSelect={handleTimeSelect}
              />
            )}
          </div>


          {/* Resumen de la nueva cita */}
          {selectedDate && selectedTime && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                Nueva Cita Seleccionada
              </h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <strong>Fecha:</strong>{" "}
                  {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString(
                    "es-CL",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
                <p>
                  <strong>Hora:</strong> {selectedTime}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Procesando..." : "Confirmar Reagendamiento"}
          </button>
        </div>
      </div>
    </div>
  );
}

