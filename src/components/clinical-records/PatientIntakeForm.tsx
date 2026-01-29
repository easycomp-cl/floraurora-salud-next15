"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Shield,
} from "lucide-react";

interface PatientIntakeFormProps {
  patientId: number;
  professionalId: number;
  onSuccess?: () => void;
  className?: string;
}

interface IntakeFormData {
  full_name: string;
  rut: string;
  birth_date: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
}

export default function PatientIntakeForm({
  patientId,
  professionalId,
  onSuccess,
  className = "",
}: PatientIntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    full_name: "",
    rut: "",
    birth_date: "",
    gender: "",
    email: "",
    phone: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [age, setAge] = useState<number | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState<string>("");
  const [emergencyContactPhone, setEmergencyContactPhone] =
    useState<string>("");

  // Calcular edad desde fecha de nacimiento
  useEffect(() => {
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [formData.birth_date]);

  // Cargar datos existentes usando el cliente de Supabase directamente
  useEffect(() => {
    const loadIntakeRecord = async () => {
      try {
        setIsLoading(true);
        // Importar dinámicamente para evitar problemas con SSR
        const { default: supabase } = await import("@/utils/supabase/client");
        const { profileService } = await import(
          "@/lib/services/profileService"
        );

        // Obtener ficha de ingreso directamente desde Supabase
        const { data: record, error } = await supabase
          .from("patient_intake_records")
          .select("*")
          .eq("patient_id", patientId)
          .eq("professional_id", professionalId)
          .maybeSingle();

        if (!error && record) {
          // Si existe la ficha de ingreso, usar esos datos
          // Normalizar el género para que coincida con los valores del select
          let normalizedGender = "";
          if (record.gender) {
            const genderLower = record.gender.toLowerCase().trim();
            // Mapear diferentes formatos posibles a los valores del select
            if (
              genderLower === "masculino" ||
              genderLower === "male" ||
              genderLower === "m"
            ) {
              normalizedGender = "masculino";
            } else if (
              genderLower === "femenino" ||
              genderLower === "female" ||
              genderLower === "f"
            ) {
              normalizedGender = "femenino";
            } else if (genderLower === "otro" || genderLower === "other") {
              normalizedGender = "otro";
            } else if (
              genderLower === "prefiero_no_decir" ||
              genderLower === "prefer_not_to_say"
            ) {
              normalizedGender = "prefiero_no_decir";
            } else {
              // Si no coincide con ningún valor conocido, usar el valor original
              normalizedGender = record.gender;
            }
          }

          setFormData({
            full_name: record.full_name || "",
            rut: record.rut || "",
            birth_date: record.birth_date || "",
            gender: normalizedGender,
            email: record.email || "",
            phone: record.phone || "",
            address: record.address || "",
          });
          if (record.age) {
            setAge(record.age);
          }

          // Obtener datos del contacto de emergencia desde la tabla patients
          const patientProfile =
            await profileService.getPatientProfile(patientId);
          if (patientProfile) {
            setEmergencyContactName(
              patientProfile.emergency_contact_name || "",
            );
            setEmergencyContactPhone(
              patientProfile.emergency_contact_phone || "",
            );
          }
        } else {
          // Si no existe la ficha de ingreso, cargar datos del paciente desde la tabla users
          const user = await profileService.getUserProfile(patientId);
          if (user) {
            const fullName =
              `${user.name || ""} ${user.last_name || ""}`.trim();
            // Normalizar el género para que coincida con los valores del select
            let normalizedGender = "";
            if (user.gender) {
              const genderLower = user.gender.toLowerCase().trim();
              // Mapear diferentes formatos posibles a los valores del select
              if (
                genderLower === "masculino" ||
                genderLower === "male" ||
                genderLower === "m"
              ) {
                normalizedGender = "masculino";
              } else if (
                genderLower === "femenino" ||
                genderLower === "female" ||
                genderLower === "f"
              ) {
                normalizedGender = "femenino";
              } else if (genderLower === "otro" || genderLower === "other") {
                normalizedGender = "otro";
              } else if (
                genderLower === "prefiero_no_decir" ||
                genderLower === "prefer_not_to_say"
              ) {
                normalizedGender = "prefiero_no_decir";
              } else {
                // Si no coincide con ningún valor conocido, usar el valor original
                normalizedGender = user.gender;
              }
            }

            setFormData({
              full_name: fullName || "",
              rut: user.rut || "",
              birth_date: user.birth_date || "",
              gender: normalizedGender,
              email: user.email || "",
              phone: user.phone_number || "",
              address: user.address || "",
            });
            // Calcular edad si hay fecha de nacimiento
            if (user.birth_date) {
              const birthDate = new Date(user.birth_date);
              const today = new Date();
              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (
                monthDiff < 0 ||
                (monthDiff === 0 && today.getDate() < birthDate.getDate())
              ) {
                calculatedAge--;
              }
              setAge(calculatedAge);
            }
          }

          // Obtener datos del contacto de emergencia desde la tabla patients
          const patientProfile =
            await profileService.getPatientProfile(patientId);
          if (patientProfile) {
            setEmergencyContactName(
              patientProfile.emergency_contact_name || "",
            );
            setEmergencyContactPhone(
              patientProfile.emergency_contact_phone || "",
            );
          }
        }
      } catch (error) {
        console.error("Error cargando ficha de ingreso:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId && professionalId) {
      loadIntakeRecord();
    }
  }, [patientId, professionalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      // Importar dinámicamente para evitar problemas con SSR
      const { default: supabase } = await import("@/utils/supabase/client");

      // Verificar si existe registro
      const { data: existingRecord } = await supabase
        .from("patient_intake_records")
        .select("id")
        .eq("patient_id", patientId)
        .eq("professional_id", professionalId)
        .maybeSingle();

      const exists = !!existingRecord;

      // Calcular edad si hay fecha de nacimiento
      let calculatedAge: number | null = null;
      if (formData.birth_date) {
        const birthDate = new Date(formData.birth_date);
        const today = new Date();
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          calculatedAge--;
        }
      }

      if (exists) {
        // Actualizar registro existente
        const { error } = await supabase
          .from("patient_intake_records")
          .update({
            full_name: formData.full_name || null,
            rut: formData.rut || null,
            birth_date: formData.birth_date || null,
            age: calculatedAge,
            gender: formData.gender || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
          })
          .eq("patient_id", patientId)
          .eq("professional_id", professionalId)
          .select()
          .single();

        if (error) throw error;
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from("patient_intake_records")
          .insert({
            patient_id: patientId,
            professional_id: professionalId,
            full_name: formData.full_name || null,
            rut: formData.rut || null,
            birth_date: formData.birth_date || null,
            age: calculatedAge,
            gender: formData.gender || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
          })
          .select()
          .single();

        if (error) throw error;
      }

      setSaveStatus("success");
      if (onSuccess) {
        onSuccess();
      }
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error guardando ficha de ingreso:", error);
      setSaveStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Error guardando ficha de ingreso",
      );
    }
  };

  if (isLoading) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Datos del Paciente - Visualización armónica */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">
              Datos del Paciente
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Nombre Completo
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formData.full_name || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            {/* RUT */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    RUT
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formData.rut || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Fecha de Nacimiento */}
            {formData.birth_date && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Fecha de Nacimiento
                    </p>
                    <p className="text-gray-900 font-medium">
                      {new Date(formData.birth_date).toLocaleDateString(
                        "es-CL",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Edad */}
            {age !== null && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Edad
                    </p>
                    <p className="text-gray-900 font-medium">{age} años</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sexo/Género */}
            {formData.gender && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Sexo/Género
                    </p>
                    <p className="text-gray-900 font-medium capitalize">
                      {formData.gender === "masculino"
                        ? "Masculino"
                        : formData.gender === "femenino"
                          ? "Femenino"
                          : formData.gender === "otro"
                            ? "Otro"
                            : formData.gender === "prefiero_no_decir"
                              ? "Prefiero no decir"
                              : formData.gender}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            {formData.email && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Correo Electrónico
                    </p>
                    <p className="text-gray-900 font-medium">
                      {formData.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Teléfono */}
            {formData.phone && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Teléfono
                    </p>
                    <p className="text-gray-900 font-medium">
                      {formData.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dirección */}
            {formData.address && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 md:col-span-2">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Dirección
                    </p>
                    <p className="text-gray-900 font-medium">
                      {formData.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contacto de Emergencia */}
          {(emergencyContactName || emergencyContactPhone) && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-blue-600" />
                <h5 className="text-md font-semibold text-gray-900">
                  Contacto de Emergencia
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {emergencyContactName && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Nombre
                        </p>
                        <p className="text-gray-900 font-medium">
                          {emergencyContactName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {emergencyContactPhone && (
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          Teléfono
                        </p>
                        <p className="text-gray-900 font-medium">
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

        {/* Campos ocultos para el formulario */}
        <input type="hidden" name="full_name" value={formData.full_name} />
        <input type="hidden" name="rut" value={formData.rut} />
        <input type="hidden" name="birth_date" value={formData.birth_date} />
        <input type="hidden" name="gender" value={formData.gender} />
        <input type="hidden" name="email" value={formData.email} />
        <input type="hidden" name="phone" value={formData.phone} />
        <input type="hidden" name="address" value={formData.address} />

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {saveStatus === "success" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">
                Ficha de ingreso guardada exitosamente
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
