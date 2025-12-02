"use client";
import { useState } from "react";
import { TimeSlot } from "@/lib/types/appointment";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

interface CalendarProps {
  selectedDate: string | null;
  selectedTime: string | null;
  timeSlots: TimeSlot[];
  availableDates: string[];
  onDateSelect: (date: string) => void;
  onTimeSelect: (time: string) => void;
}

export default function Calendar({
  selectedDate,
  selectedTime,
  timeSlots = [],
  availableDates = [],
  onDateSelect,
  onTimeSelect,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Limitar navegación a máximo 2 semanas en el futuro
  const today = new Date();
  const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const nextMonth = () => {
    const nextMonthDate = addMonths(currentMonth, 1);
    if (nextMonthDate <= twoWeeksFromNow) {
      setCurrentMonth(nextMonthDate);
    }
  };

  const prevMonth = () => {
    const prevMonthDate = subMonths(currentMonth, 1);
    if (prevMonthDate >= today) {
      setCurrentMonth(prevMonthDate);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Ajustar para que el lunes sea el primer día de la semana
  const startOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1; // Si es domingo (0), restar 6; si no, restar 1
    return new Date(date.getTime() - diff * 24 * 60 * 60 * 1000);
  };

  const endOfWeek = (date: Date) => {
    const day = date.getDay();
    const diff = day === 0 ? 0 : 7 - day; // Si es domingo (0), no sumar; si no, sumar hasta domingo
    return new Date(date.getTime() + diff * 24 * 60 * 60 * 1000);
  };

  const weekStart = startOfWeek(monthStart);
  const weekEnd = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Formato HH:MM
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const getAvailableTimesForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const availableTimes = timeSlots
      .filter((slot) => slot.date === dateStr)
      .map((slot) => slot.start_time)
      .sort();

    return availableTimes;
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      const dateStr = format(date, "yyyy-MM-dd");
      onDateSelect(dateStr);
      // Resetear tiempo seleccionado al cambiar fecha
      onTimeSelect("");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Disponibilidad
      </h2>

      {/* Calendario */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={subMonths(currentMonth, 1) < today}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>

          <button
            onClick={nextMonth}
            disabled={addMonths(currentMonth, 1) > twoWeeksFromNow}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const isAvailable = isDateAvailable(day);
            const isSelected =
              selectedDate && isSameDay(day, parseISO(selectedDate));
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                disabled={!isAvailable || !isCurrentMonth}
                className={`
                  p-2 text-sm rounded-md transition-all duration-200
                  ${
                    isSelected
                      ? "bg-blue-500 text-white font-semibold"
                      : isAvailable
                        ? "hover:bg-blue-100 text-gray-900 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                  }
                  ${!isCurrentMonth ? "opacity-30" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horarios disponibles */}
      {selectedDate && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Horarios Disponibles -{" "}
            {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", {
              locale: es,
            })}
          </h4>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {getAvailableTimesForDate(parseISO(selectedDate)).map((time) => (
              <button
                key={time}
                onClick={() => onTimeSelect(time)}
                className={`
                  p-3 text-sm font-medium rounded-md border-2 transition-all duration-200
                  ${
                    selectedTime === time
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700"
                  }
                `}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>

          {getAvailableTimesForDate(parseISO(selectedDate)).length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No hay horarios disponibles para esta fecha.
            </div>
          )}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <CalendarIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Disponibilidad:</p>
            <p>
              • Solo se muestran fechas disponibles en las próximas 2 semanas
            </p>
            <p>• Los horarios son de 1 hora (9:00, 10:00, 11:00, etc.)</p>
            <p>• Los servicios tienen una duración de 55 minutos</p>
            <p>• Selecciona una fecha y luego elige un horario disponible</p>
          </div>
        </div>
      </div>
    </div>
  );
}
