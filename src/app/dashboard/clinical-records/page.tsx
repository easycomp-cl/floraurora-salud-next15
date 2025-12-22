"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/lib/hooks/useAuthState";
import { appointmentService } from "@/lib/services/appointmentService";
import { profileService } from "@/lib/services/profileService";
import { FileText, User, Search, Loader2, AlertCircle } from "lucide-react";

interface PatientWithAppointments {
  patient_id: number;
  patient_name: string;
  patient_email: string;
  patient_phone: string | null;
  last_appointment_date: string | null;
  total_appointments: number;
  has_intake_record: boolean;
}

export default function ClinicalRecordsListPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthState();
  const [patients, setPatients] = useState<PatientWithAppointments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Esperar a que termine la carga de autenticación antes de verificar
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Obtener perfil del profesional
        const profile = await profileService.getUserProfileByUuid(user.id);
        if (!profile) {
          throw new Error("Error al obtener perfil");
        }

        if (profile.role !== 3) {
          setError("Solo los profesionales pueden acceder a esta página");
          setIsLoading(false);
          return;
        }

        // Obtener citas del profesional usando el servicio
        const appointments =
          await appointmentService.getAppointmentsForProfessional(profile.id);

        // Agrupar por paciente y obtener información
        const patientsMap = new Map<number, PatientWithAppointments>();

        for (const appointment of appointments) {
          if (!appointment.patient_id || !appointment.patient) continue;

          const patientId = appointment.patient_id;
          if (!patientsMap.has(patientId)) {
            patientsMap.set(patientId, {
              patient_id: patientId,
              patient_name:
                `${appointment.patient.name || ""} ${appointment.patient.last_name || ""}`.trim(),
              patient_email: appointment.patient.email || "",
              patient_phone: appointment.patient.phone_number || null,
              last_appointment_date: null,
              total_appointments: 0,
              has_intake_record: false,
            });
          }

          const patientData = patientsMap.get(patientId)!;
          patientData.total_appointments++;

          // Actualizar última fecha de cita
          if (appointment.scheduled_at) {
            const appointmentDate = new Date(appointment.scheduled_at);
            if (
              !patientData.last_appointment_date ||
              appointmentDate > new Date(patientData.last_appointment_date)
            ) {
              patientData.last_appointment_date = appointment.scheduled_at;
            }
          }
        }

        // Verificar fichas de ingreso para cada paciente usando el cliente de Supabase directamente
        const patientsArray = Array.from(patientsMap.values());
        const { default: supabase } = await import("@/utils/supabase/client");
        const patientsWithIntake = await Promise.all(
          patientsArray.map(async (patient) => {
            try {
              // Verificar directamente en Supabase si existe una ficha de ingreso
              const { data: intakeRecord, error } = await supabase
                .from("patient_intake_records")
                .select("id")
                .eq("patient_id", patient.patient_id)
                .eq("professional_id", profile.id)
                .maybeSingle();
              
              // Si hay un registro o el error es "no encontrado" (PGRST116), registrar el resultado
              if (intakeRecord || (error && error.code === "PGRST116")) {
                patient.has_intake_record = !!intakeRecord;
              }
            } catch (error) {
              console.error(
                `Error verificando ficha de ingreso para paciente ${patient.patient_id}:`,
                error
              );
            }
            return patient;
          })
        );

        setPatients(
          patientsWithIntake.sort((a, b) => {
            // Ordenar por última cita (más reciente primero)
            if (!a.last_appointment_date && !b.last_appointment_date) return 0;
            if (!a.last_appointment_date) return 1;
            if (!b.last_appointment_date) return -1;
            return (
              new Date(b.last_appointment_date).getTime() -
              new Date(a.last_appointment_date).getTime()
            );
          })
        );
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user, router, authLoading]);

  // Filtrar pacientes por término de búsqueda
  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.patient_name.toLowerCase().includes(searchLower) ||
      patient.patient_email.toLowerCase().includes(searchLower) ||
      (patient.patient_phone && patient.patient_phone.includes(searchTerm))
    );
  });

  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Fichas Clínicas de Pacientes
        </h1>
        <p className="text-gray-600 mt-2">
          Gestiona las fichas clínicas de tus pacientes
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Lista de pacientes */}
      {filteredPatients.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchTerm
              ? "No se encontraron pacientes que coincidan con la búsqueda"
              : "No tienes pacientes con citas aún"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPatients.map((patient) => (
            <div
              key={patient.patient_id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(`/dashboard/clinical-records/${patient.patient_id}`)
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {patient.patient_name || "Sin nombre"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {patient.patient_email}
                    </p>
                  </div>
                </div>
                {patient.has_intake_record ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Ficha completa
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    Pendiente
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {patient.patient_phone && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Teléfono:</span>
                    <span>{patient.patient_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Citas totales:</span>
                  <span>{patient.total_appointments}</span>
                </div>
                {patient.last_appointment_date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Última cita:</span>
                    <span>
                      {new Date(
                        patient.last_appointment_date
                      ).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/dashboard/clinical-records/${patient.patient_id}`
                    );
                  }}
                >
                  Ver Ficha Clínica
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
