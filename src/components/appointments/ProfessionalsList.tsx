"use client";
import { Professional } from "@/lib/types/appointment";
import { User, Star } from "lucide-react";
import Image from "next/image";

interface ProfessionalsListProps {
  professionals: Professional[];
  selectedProfessional: Professional | null;
  onProfessionalSelect: (professional: Professional) => void;
}

export default function ProfessionalsList({
  professionals,
  selectedProfessional,
  onProfessionalSelect,
}: ProfessionalsListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Profesionales
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((professional) => (
          <div
            key={professional.id}
            onClick={() => onProfessionalSelect(professional)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${
                selectedProfessional?.id === professional.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                {professional.avatar_url ? (
                  <Image
                    src={professional.avatar_url}
                    alt={professional.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {professional.name}
                </h3>
                <p className="text-sm text-gray-600">{professional.title}</p>
                <p className="text-xs text-gray-500 truncate">
                  {professional.specialty}
                </p>

                {professional.rating && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {professional.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {professional.bio && (
              <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                {professional.bio}
              </p>
            )}
          </div>
        ))}
      </div>

      {professionals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay profesionales disponibles en este momento.
        </div>
      )}
    </div>
  );
}
