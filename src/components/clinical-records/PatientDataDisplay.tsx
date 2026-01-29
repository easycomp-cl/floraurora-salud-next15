"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Calendar, FileText, Loader2, Shield } from "lucide-react";
import supabase from "@/utils/supabase/client";
import { profileService } from "@/lib/services/profileService";

interface PatientDataDisplayProps {
  patientId: number;
  professionalId: number;
  className?: string;
}

interface PatientData {
  // Datos básicos del usuario
  name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  birth_date?: string;
  rut?: string;
  gender?: string;
  // Datos de la ficha de ingreso (si existe)
  intakeRecord?: {
    full_name?: string;
    rut?: string;
    birth_date?: string;
    age?: number;
    gender?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

export default function PatientDataDisplay({
  patientId,
  professionalId,
  className = "",
}: PatientDataDisplayProps) {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState<string>("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>("");

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener datos del usuario desde la tabla users
        const user = await profileService.getUserProfile(patientId);
        if (!user) {
          throw new Error("Paciente no encontrado");
        }

        // Obtener ficha de ingreso si existe
        const { data: intakeRecord, error: intakeError } = await supabase
          .from("patient_intake_records")
          .select("*")
          .eq("patient_id", patientId)
          .eq("professional_id", professionalId)
          .maybeSingle();

        if (intakeError && intakeError.code !== "PGRST116") {
          console.error("Error obteniendo ficha de ingreso:", intakeError);
        }

        // Priorizar datos de la ficha de ingreso si existe, sino usar datos del usuario
        const data: PatientData = {
          name: user.name,
          last_name: user.last_name,
          email: intakeRecord?.email || user.email,
          phone_number: intakeRecord?.phone || user.phone_number,
          address: intakeRecord?.address || user.address,
          birth_date: intakeRecord?.birth_date || user.birth_date,
          rut: intakeRecord?.rut || user.rut,
          gender: intakeRecord?.gender || user.gender,
          intakeRecord: intakeRecord || undefined,
        };

        setPatientData(data);

        // Cargar datos del contacto de emergencia
        const patientProfile = await profileService.getPatientProfile(patientId);
        if (patientProfile) {
          setEmergencyContactName(patientProfile.emergency_contact_name || "");
          setEmergencyContactPhone(patientProfile.emergency_contact_phone || "");
        }
      } catch (err) {
        console.error("Error cargando datos del paciente:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && professionalId) {
      loadPatientData();
    }
  }, [patientId, professionalId]);

  if (isLoading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-700">{error || "Error al cargar datos del paciente"}</p>
      </div>
    );
  }

  // Calcular edad si hay fecha de nacimiento
  const calculateAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = patientData.intakeRecord?.age || calculateAge(patientData.birth_date);
  const fullName = patientData.intakeRecord?.full_name || 
    `${patientData.name || ""} ${patientData.last_name || ""}`.trim() || "N/A";
  const displayRut = patientData.intakeRecord?.rut || patientData.rut || "N/A";
  const displayEmail = patientData.intakeRecord?.email || patientData.email || "N/A";
  const displayPhone = patientData.intakeRecord?.phone || patientData.phone_number || "N/A";
  const displayAddress = patientData.intakeRecord?.address || patientData.address || "N/A";
  const displayGender = patientData.intakeRecord?.gender || patientData.gender || "N/A";
  const displayBirthDate = patientData.intakeRecord?.birth_date || patientData.birth_date;

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <User className="h-4 w-4 text-blue-600" />
        <h2 className="text-base font-semibold text-gray-900">Datos del Paciente</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Nombre Completo */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Nombre Completo
              </p>
              <p className="text-sm text-gray-900 font-medium">{fullName}</p>
            </div>
          </div>
        </div>

        {/* RUT */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                RUT
              </p>
              <p className="text-sm text-gray-900 font-medium">{displayRut}</p>
            </div>
          </div>
        </div>

        {/* Fecha de Nacimiento */}
        {displayBirthDate && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Fecha de Nacimiento
                </p>
                <p className="text-sm text-gray-900 font-medium">
                  {new Date(displayBirthDate).toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edad */}
        {age !== null && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Edad
                </p>
                <p className="text-sm text-gray-900 font-medium">{age} años</p>
              </div>
            </div>
          </div>
        )}

        {/* Sexo/Género */}
        {displayGender !== "N/A" && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Sexo/Género
                </p>
                <p className="text-sm text-gray-900 font-medium capitalize">
                  {displayGender === "masculino" ? "Masculino" :
                   displayGender === "femenino" ? "Femenino" :
                   displayGender === "otro" ? "Otro" :
                   displayGender === "prefiero_no_decir" ? "Prefiero no decir" :
                   displayGender}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email */}
        {displayEmail !== "N/A" && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Correo Electrónico
                </p>
                <p className="text-sm text-gray-900 font-medium">{displayEmail}</p>
              </div>
            </div>
          </div>
        )}

        {/* Teléfono */}
        {displayPhone !== "N/A" && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Teléfono
                </p>
                <p className="text-sm text-gray-900 font-medium">{displayPhone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dirección */}
        {displayAddress !== "N/A" && (
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 md:col-span-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Dirección
                </p>
                <p className="text-sm text-gray-900 font-medium">{displayAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contacto de Emergencia */}
      {(emergencyContactName || emergencyContactPhone) && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-blue-600" />
            <h5 className="text-sm font-semibold text-gray-900">
              Contacto de Emergencia
            </h5>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {emergencyContactName && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Nombre
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {emergencyContactName}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {emergencyContactPhone && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                      Teléfono
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {emergencyContactPhone}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
