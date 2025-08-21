"use client";
import { Service } from "@/lib/types/appointment";
import { Clock, DollarSign } from "lucide-react";

interface ServicesListProps {
  services: Service[];
  selectedService: Service | null;
  onServiceSelect: (service: Service) => void;
}

export default function ServicesList({
  services,
  selectedService,
  onServiceSelect,
}: ServicesListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min.`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? "s" : ""}`;
    }
    return `${hours}h ${remainingMinutes}min.`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Servicios Disponibles
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onServiceSelect(service)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${
                selectedService?.id === service.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(service.duration_minutes)}</span>
                </div>

                <div className="flex items-center space-x-2 text-lg font-semibold text-green-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatPrice(service.price)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay servicios disponibles para este profesional.
        </div>
      )}
    </div>
  );
}
