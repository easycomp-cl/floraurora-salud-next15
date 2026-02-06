"use client";

import Image from "next/image";
import { Check, User, Star, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Professional } from "@/lib/types/appointment";

interface ProfessionalDetailDialogProps {
  professional: Professional | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBookAppointment: (professional: Professional) => void;
}

export default function ProfessionalDetailDialog({
  professional,
  isOpen,
  onOpenChange,
  onBookAppointment,
}: ProfessionalDetailDialogProps) {
  if (!professional) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold text-gray-900">
            {professional.name && professional.last_name
              ? `${professional.name} ${professional.last_name}`
              : professional.name || professional.email || "Profesional"}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {professional.title_name || "Profesional"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagen y información básica */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative w-full md:w-64 h-64 rounded-2xl overflow-hidden flex-shrink-0">
              {professional.avatar_url ? (
                <Image
                  src={professional.avatar_url}
                  alt={professional.name || "Profesional"}
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
              {professional.rating && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  <span className="font-semibold text-lg">
                    {professional.rating.toFixed(1)}
                  </span>
                  <span className="text-gray-500">Calificación</span>
                </div>
              )}

              {/* Descripción del perfil */}
              {(professional.profile_description || professional.bio) && (
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    Sobre el profesional
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {professional.profile_description || professional.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Especialidades */}
          {professional.specialties &&
            professional.specialties.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Especialidades
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {professional.specialties.map((specialty, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-gray-700 bg-teal-50 p-3 rounded-lg"
                    >
                      <Check className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <span>{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Enfoque Terapéutico */}
          {professional.approach && (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <span className="text-gray-900 font-semibold">
                  Enfoque Terapéutico: {professional.approach.name}
                </span>
              </div>
            </div>
          )}

          {/* Formación Académica */}
          {(professional.university ||
            professional.profession ||
            professional.study_year_start ||
            professional.study_year_end ||
            professional.extra_studies) && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">
                Formación Académica
              </h3>
              <div className="space-y-4 bg-gray-50 p-5 rounded-lg border border-gray-200">
                {professional.university && (
                  <div className="pb-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-900">
                      Universidad:{" "}
                    </span>
                    <span className="text-gray-700 font-medium">
                      {professional.university}
                    </span>
                  </div>
                )}
                {professional.profession && (
                  <div className="pb-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-900">
                      Profesión:{" "}
                    </span>
                    <span className="text-gray-700">
                      {professional.profession}
                    </span>
                  </div>
                )}
                {(professional.study_year_start ||
                  professional.study_year_end) && (
                  <div className="pb-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-900">
                      Años de estudio:{" "}
                    </span>
                    <span className="text-gray-700">
                      {professional.study_year_start || "N/A"} -{" "}
                      {professional.study_year_end || "N/A"}
                    </span>
                  </div>
                )}
                {professional.extra_studies && (
                  <div className="pt-2">
                    <div className="mb-2">
                      <span className="font-semibold text-gray-900">
                        Estudios adicionales:
                      </span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-300">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {professional.extra_studies}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificados */}
          {(professional.degree_copy_url ||
            professional.professional_certificate_url ||
            (professional.additional_certificates_urls &&
              professional.additional_certificates_urls.length > 0)) && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Certificados</h3>
              <div className="space-y-2">
                {professional.degree_copy_url && (
                  <a
                    href={professional.degree_copy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-teal-600 hover:text-teal-700 font-semibold transition-colors bg-teal-50 p-3 rounded-lg hover:bg-teal-100"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Título Universitario</span>
                  </a>
                )}
                {professional.professional_certificate_url && (
                  <a
                    href={professional.professional_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-teal-600 hover:text-teal-700 font-semibold transition-colors bg-teal-50 p-3 rounded-lg hover:bg-teal-100"
                  >
                    <FileText className="w-5 h-5" />
                    <span>Certificado Profesional</span>
                  </a>
                )}
                {professional.additional_certificates_urls &&
                  professional.additional_certificates_urls.length > 0 && (
                    <div className="space-y-2">
                      {professional.additional_certificates_urls.map(
                        (certUrl, idx) => (
                          <a
                            key={idx}
                            href={certUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-teal-600 hover:text-teal-700 font-semibold transition-colors bg-teal-50 p-3 rounded-lg hover:bg-teal-100"
                          >
                            <FileText className="w-5 h-5" />
                            <span>Certificado Adicional {idx + 1}</span>
                          </a>
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Botón de agendar */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                onOpenChange(false);
                onBookAppointment(professional);
              }}
              className="bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 px-8 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Agendar cita con {professional.name || "este profesional"}
            </button>
          </div>

          {/* Currículum */}
          {professional.resume_url && (
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900">Documentos</h3>
              <a
                href={professional.resume_url}
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
      </DialogContent>
    </Dialog>
  );
}
