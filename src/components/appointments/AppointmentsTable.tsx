import { useMemo, useState, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type {
  AppointmentWithUsers,
  BasicUserInfo,
} from "@/lib/services/appointmentService";
import RescheduleAppointmentModal from "./RescheduleAppointmentModal";
import JoinMeetingButton from "./JoinMeetingButton";
import { FileText, FileDown, Star, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import SatisfactionSurveyDialog from "@/components/satisfaction-survey/SatisfactionSurveyDialog";
import {
  satisfactionSurveyService,
  type SatisfactionSurvey,
} from "@/lib/services/satisfactionSurveyService";

type AppointmentsTableMode = "patient" | "professional" | "admin";

type AppointmentRow = AppointmentWithUsers & {
  formattedDate: string;
  formattedTime: string;
};

interface AppointmentsTableProps {
  data: AppointmentWithUsers[];
  mode: AppointmentsTableMode;
  isLoading?: boolean;
  emptyMessage?: string;
  onAppointmentUpdate?: () => void;
}

const columnHelper = createColumnHelper<AppointmentRow>();

const buildFullName = (user: BasicUserInfo | null) => {
  if (!user) return "No registrado";
  const nameParts = [user.name, user.last_name].filter(Boolean);
  return nameParts.length ? nameParts.join(" ") : (user.email ?? "Sin datos");
};

const formatPhone = (phone?: string | null) => {
  if (!phone) return "Sin teléfono";
  return phone;
};

const formatCurrency = (value?: number | null) => {
  if (typeof value !== "number") {
    return "Sin monto";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusColorClasses = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "confirmed":
    case "confirmada":
      return "bg-green-100 text-green-700 ring-green-600/20";
    case "pending_confirmation":
      return "bg-amber-100 text-amber-700 ring-amber-600/20";
    case "pending":
    case "pendiente":
      return "bg-yellow-100 text-yellow-700 ring-yellow-600/20";
    case "cancelled":
    case "cancelada":
      return "bg-red-100 text-red-700 ring-red-600/20";
    case "completed":
    case "completada":
      return "bg-blue-100 text-blue-700 ring-blue-600/20";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-600/20";
  }
};

const statusLabel = (status?: string | null) => {
  if (!status) return "Sin estado";

  const normalized = status.toLowerCase();
  switch (normalized) {
    case "pending_confirmation":
      return "Pendiente de confirmación";
    case "confirmed":
      return "Confirmada";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelada";
    case "completed":
      return "Completada";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

export default function AppointmentsTable({
  data,
  mode,
  isLoading = false,
  emptyMessage,
  onAppointmentUpdate,
}: AppointmentsTableProps) {
  const router = useRouter();
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [confirmationHours, setConfirmationHours] = useState<number>(24);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithUsers | null>(null);
  const [confirmingAppointmentId, setConfirmingAppointmentId] = useState<
    string | number | null
  >(null);
  const [clinicalRecordsMap, setClinicalRecordsMap] = useState<
    Map<string, { hasRecord: boolean; hasData: boolean }>
  >(new Map());
  const [downloadingBheId, setDownloadingBheId] = useState<string | null>(null);
  const [surveysMap, setSurveysMap] = useState<Map<string, SatisfactionSurvey>>(
    new Map(),
  );
  const [surveyStatusMap, setSurveyStatusMap] = useState<
    Map<string, { canRate: boolean; hasRated: boolean }>
  >(new Map());
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [selectedAppointmentForSurvey, setSelectedAppointmentForSurvey] =
    useState<AppointmentWithUsers | null>(null);

  // Cargar configuración de horas antes de confirmar usando el cliente de Supabase directamente
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Importar dinámicamente para evitar problemas con SSR
        const { default: supabase } = await import("@/utils/supabase/client");

        // Obtener configuración directamente desde Supabase
        const { data: configs, error } = await supabase
          .from("system_configurations")
          .select("*")
          .eq("is_active", true)
          .eq("config_key", "appointment_confirmation_hours_before")
          .maybeSingle();

        if (!error && configs) {
          // Convertir el valor según su tipo de dato
          let value: number = 24;
          if (configs.data_type === "number") {
            value = Number(configs.config_value) || 24;
          } else {
            value = parseInt(configs.config_value, 10) || 24;
          }
          setConfirmationHours(value);
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    loadConfiguration();
  }, []);

  // Cargar fichas clínicas para profesionales usando el cliente de Supabase directamente
  useEffect(() => {
    if (mode === "professional" && data && data.length > 0) {
      const loadClinicalRecords = async () => {
        // Importar dinámicamente para evitar problemas con SSR
        const { default: supabase } = await import("@/utils/supabase/client");
        const recordsMap = new Map<
          string,
          { hasRecord: boolean; hasData: boolean }
        >();
        const promises = data.map(async (appointment) => {
          try {
            // Normalizar el appointmentId: asegurar que tenga el formato "APT-00000060"
            let normalizedAppointmentId: string;
            const appointmentIdStr = String(appointment.id);
            if (appointmentIdStr.startsWith("APT-")) {
              normalizedAppointmentId = appointmentIdStr;
            } else {
              const numericPart = appointmentIdStr.replace(/[^0-9]/g, "");
              normalizedAppointmentId = `APT-${numericPart.padStart(8, "0")}`;
            }

            // Obtener los campos relevantes para verificar si hay datos llenados
            const { data: evolutionRecord, error: evolutionError } =
              await supabase
                .from("clinical_records")
                .select(
                  "medical_history, family_history, consultation_reason, session_development, treatment_applied",
                )
                .eq("appointment_id", normalizedAppointmentId)
                .maybeSingle();

            // Manejar el caso cuando hay un registro o cuando no se encuentra (PGRST116)
            if (evolutionRecord) {
              // Hay un registro, verificar si tiene datos llenados
              const hasRecord = true;
              // Verificar si hay al menos un campo con datos (no vacío y no null)
              const hasData = !!(
                (evolutionRecord.medical_history &&
                  evolutionRecord.medical_history.trim()) ||
                (evolutionRecord.family_history &&
                  evolutionRecord.family_history.trim()) ||
                (evolutionRecord.consultation_reason &&
                  evolutionRecord.consultation_reason.trim()) ||
                (evolutionRecord.session_development &&
                  evolutionRecord.session_development.trim()) ||
                (evolutionRecord.treatment_applied &&
                  evolutionRecord.treatment_applied.trim())
              );

              recordsMap.set(String(appointment.id), { hasRecord, hasData });
            } else if (evolutionError && evolutionError.code === "PGRST116") {
              // No hay registro, guardar como sin registro
              recordsMap.set(String(appointment.id), {
                hasRecord: false,
                hasData: false,
              });
            }
          } catch {
            // Ignorar errores silenciosamente
          }
        });
        await Promise.all(promises);
        setClinicalRecordsMap(recordsMap);
      };
      loadClinicalRecords();
    }
  }, [mode, data]);

  // Cargar encuestas de satisfacción para pacientes
  useEffect(() => {
    if (mode === "patient" && data && data.length > 0) {
      const loadSurveys = async () => {
        const surveys = new Map<string, SatisfactionSurvey>();
        const statuses = new Map<
          string,
          { canRate: boolean; hasRated: boolean }
        >();

        const promises = data.map(async (appointment) => {
          try {
            // Solo verificar citas completadas o pasadas
            const appointmentDate = new Date(appointment.scheduled_at);
            const now = new Date();
            const isPast =
              appointmentDate <= now || appointment.status === "completed";

            if (isPast) {
              const survey =
                await satisfactionSurveyService.getSurveyByAppointmentId(
                  appointment.id,
                );
              if (survey) {
                surveys.set(String(appointment.id), survey);
              }

              // Verificar estado de calificación
              const status =
                await satisfactionSurveyService.getAppointmentSurveyStatus(
                  appointment.id,
                  appointment.scheduled_at,
                );

              statuses.set(String(appointment.id), {
                canRate: status.canRate,
                hasRated: status.hasRated,
              });
            }
          } catch (error) {
            console.error(
              `Error cargando encuesta para cita ${appointment.id}:`,
              error,
            );
          }
        });

        await Promise.all(promises);
        setSurveysMap(surveys);
        setSurveyStatusMap(statuses);
      };

      loadSurveys();
    }
  }, [mode, data]);

  // Función para verificar si se puede confirmar asistencia
  const canConfirmAppointment = (appointment: AppointmentWithUsers) => {
    if (appointment.status !== "pending_confirmation") {
      return false;
    }

    const scheduledDate = new Date(appointment.scheduled_at);
    const now = new Date();
    const hoursUntilAppointment =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const canConfirm =
      hoursUntilAppointment > 0 && hoursUntilAppointment <= confirmationHours;

    return canConfirm;
  };

  // Función para confirmar asistencia
  const handleConfirmAppointment = async (appointmentId: string | number) => {
    try {
      setConfirmingAppointmentId(appointmentId);
      const response = await fetch(
        `/api/appointments/${appointmentId}/confirm`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al confirmar la cita");
        return;
      }

      // Recargar las citas
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      } else {
        // Recargar la página si no hay callback
        window.location.reload();
      }
    } catch (error) {
      console.error("Error confirmando cita:", error);
      alert("Error al confirmar la cita");
    } finally {
      setConfirmingAppointmentId(null);
    }
  };

  // Función para abrir modal de reagendar
  const handleOpenRescheduleModal = (appointment: AppointmentWithUsers) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  // Función para descargar PDF de BHE
  const handleBheDownload = async (pdfPath: string, appointmentId: string) => {
    try {
      setDownloadingBheId(appointmentId);

      const response = await fetch(
        `/api/admin/reports/bhe-download?path=${encodeURIComponent(pdfPath)}`,
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        alert(payload?.error ?? "No se pudo generar la URL de descarga");
        return;
      }

      const { download_url } = await response.json();

      // Abrir la URL de descarga en una nueva pestaña
      window.open(download_url, "_blank");
    } catch (err) {
      console.error("Error descargando PDF de BHE:", err);
      alert("Error inesperado al descargar el PDF.");
    } finally {
      setDownloadingBheId(null);
    }
  };

  const tableData = useMemo<AppointmentRow[]>(() => {
    return (data ?? []).map((item) => {
      const scheduledDate = item.scheduled_at
        ? new Date(item.scheduled_at)
        : null;
      return {
        ...item,
        formattedDate: scheduledDate
          ? scheduledDate.toLocaleDateString("es-CL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Sin fecha",
        formattedTime: scheduledDate
          ? scheduledDate.toLocaleTimeString("es-CL", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sin hora",
      };
    });
  }, [data]);

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseColumns: any[] = [
      columnHelper.accessor("id", {
        header: "ID",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("formattedDate", {
        header: "Fecha",
      }),
      columnHelper.accessor("formattedTime", {
        header: "Hora",
      }),
    ];

    if (mode !== "patient") {
      baseColumns.push(
        columnHelper.display({
          id: "patient",
          header: "Paciente",
          cell: ({ row }) => {
            const patient = row.original.patient;
            return (
              <div>
                <p className="font-medium text-gray-900">
                  {buildFullName(patient)}
                </p>
                <p className="text-xs text-gray-500">
                  {patient?.email ?? "Sin correo"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatPhone(patient?.phone_number)}
                </p>
              </div>
            );
          },
        }),
      );
    }

    if (mode !== "professional") {
      baseColumns.push(
        columnHelper.display({
          id: "professional",
          header: "Profesional",
          cell: ({ row }) => {
            const professional = row.original.professional;
            return (
              <div>
                <p className="font-medium text-gray-900">
                  {buildFullName(professional)}
                </p>
                <p className="text-xs text-gray-500">
                  {professional?.email ?? "Sin correo"}
                </p>
                <p className="text-xs text-gray-400">
                  {formatPhone(professional?.phone_number)}
                </p>
              </div>
            );
          },
        }),
      );
    }

    baseColumns.push(
      columnHelper.accessor("service", {
        header: "Servicio",
        cell: (info) => info.getValue() ?? "Sin servicio",
      }),
    );

    baseColumns.push(
      columnHelper.accessor("amount", {
        header: "Monto",
        cell: ({ getValue }) => formatCurrency(getValue<number | null>()),
      }),
    );

    baseColumns.push(
      columnHelper.accessor("area", {
        header: "Área",
        cell: (info) => info.getValue() ?? "Sin área",
      }),
    );

    baseColumns.push(
      columnHelper.accessor("duration_minutes", {
        header: "Duración",
        cell: (info) => {
          const value = info.getValue();
          return value ? `${value} min` : "No definida";
        },
      }),
    );

    baseColumns.push(
      columnHelper.accessor("status", {
        header: "Estado",
        cell: ({ getValue }) => {
          const status = getValue<string | null>();
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClasses(
                status,
              )}`}
            >
              {statusLabel(status)}
            </span>
          );
        },
      }),
    );

    baseColumns.push(
      columnHelper.accessor("payment_status", {
        header: "Pago",
        cell: ({ getValue }) => {
          const payment = getValue<string | null>();
          return payment
            ? payment.charAt(0).toUpperCase() + payment.slice(1)
            : "Sin estado";
        },
      }),
    );

    baseColumns.push(
      columnHelper.accessor("note", {
        header: "Notas",
        cell: ({ getValue }) => {
          const note = getValue<string | null>();
          return note ? (
            <span className="line-clamp-3 text-sm text-gray-600">{note}</span>
          ) : (
            <span className="text-sm text-gray-400">Sin notas</span>
          );
        },
      }),
    );

    // Agregar columna de ficha clínica solo para profesionales
    if (mode === "professional") {
      baseColumns.push(
        columnHelper.display({
          id: "clinical_record",
          header: "Ficha Clínica Digital",
          cell: ({ row }) => {
            const appointment = row.original;
            const recordInfo = clinicalRecordsMap.get(String(appointment.id));
            const hasData = recordInfo?.hasData ?? false;
            const hasRecord = recordInfo?.hasRecord ?? false;

            // Si no hay registro, no mostrar nada
            if (!hasRecord) {
              return null;
            }

            // Si hay datos, mostrar ícono y "Ver/Editar"
            if (hasData) {
              return (
                <button
                  onClick={() =>
                    router.push(`/dashboard/appointments/${appointment.id}`)
                  }
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  title="Ver/Editar ficha clínica"
                >
                  <FileText className="h-3 w-3" />
                  Ver/Editar
                </button>
              );
            }

            // Si hay registro pero no hay datos, mostrar "Editar" con ícono de lápiz en verde
            return (
              <button
                onClick={() =>
                  router.push(`/dashboard/appointments/${appointment.id}`)
                }
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors cursor-pointer"
                title="Editar ficha clínica"
              >
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            );
          },
        }),
      );
    }

    baseColumns.push(
      columnHelper.display({
        id: "meeting_url",
        header: "Videollamada",
        cell: ({ row }) => {
          const appointment = row.original;
          const meetLink = appointment.meeting_url || appointment.meet_link;

          if (
            !meetLink ||
            !appointment.scheduled_at ||
            !appointment.duration_minutes
          ) {
            return <span className="text-sm text-gray-400">Sin enlace</span>;
          }

          return (
            <JoinMeetingButton
              meetLink={meetLink}
              scheduledAt={appointment.scheduled_at}
              durationMinutes={appointment.duration_minutes}
              appointmentId={String(appointment.id)}
              className="w-full"
            />
          );
        },
      }),
    );

    baseColumns.push(
      columnHelper.display({
        id: "invoice_url",
        header: "Boleta",
        cell: ({ row }) => {
          const appointment = row.original;
          const bhePdfPath = appointment.bhe_pdf_path;
          const invoiceUrl = appointment.invoice_url;
          const appointmentId = String(appointment.id);
          const isDownloading = downloadingBheId === appointmentId;

          // Priorizar BHE si existe
          if (bhePdfPath) {
            return (
              <button
                onClick={() => handleBheDownload(bhePdfPath, appointmentId)}
                disabled={isDownloading}
                className="inline-flex items-center justify-center gap-1 px-2 py-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Descargar PDF de BHE"
              >
                <FileDown className="h-4 w-4" />
              </button>
            );
          }

          // Si no hay BHE pero hay invoice_url, mostrar el enlace original
          if (invoiceUrl) {
            return (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors duration-200"
              >
                Descargar
              </a>
            );
          }

          return <span className="text-sm text-gray-400">Sin archivo</span>;
        },
      }),
    );

    // Agregar columna de acciones para pacientes con citas pending_confirmation
    if (mode === "patient") {
      baseColumns.push(
        columnHelper.display({
          id: "actions",
          header: "Acciones",
          cell: ({ row }) => {
            const appointment = row.original;
            const canConfirm = canConfirmAppointment(appointment);
            const appointmentIdStr =
              typeof appointment.id === "string"
                ? appointment.id
                : `APT-${String(appointment.id).padStart(8, "0")}`;
            const isConfirming =
              confirmingAppointmentId === appointmentIdStr ||
              confirmingAppointmentId === appointment.id;

            if (appointment.status !== "pending_confirmation") {
              return <span className="text-sm text-gray-400">—</span>;
            }

            return (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    // El ID es de tipo text con formato "APT-00000060"
                    const appointmentId =
                      typeof appointment.id === "string"
                        ? appointment.id
                        : `APT-${String(appointment.id).padStart(8, "0")}`;
                    handleConfirmAppointment(appointmentId);
                  }}
                  disabled={!canConfirm || isConfirming}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    canConfirm && !isConfirming
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  title={
                    canConfirm
                      ? "Confirmar asistencia"
                      : `Solo puedes confirmar ${confirmationHours} horas antes de la cita`
                  }
                >
                  {isConfirming ? "Confirmando..." : "Confirmar Asistencia"}
                </button>
                <button
                  onClick={() => handleOpenRescheduleModal(appointment)}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Reagendar Cita
                </button>
              </div>
            );
          },
        }),
      );

      // Agregar columna de calificación para pacientes
      baseColumns.push(
        columnHelper.display({
          id: "satisfaction_survey",
          header: "Calificación",
          cell: ({ row }) => {
            const appointment = row.original;
            const appointmentId = String(appointment.id);
            const survey = surveysMap.get(appointmentId);
            const status = surveyStatusMap.get(appointmentId);

            // Solo mostrar para citas completadas o pasadas
            const appointmentDate = new Date(appointment.scheduled_at);
            const now = new Date();
            const isPast =
              appointmentDate <= now || appointment.status === "completed";

            if (!isPast) {
              return <span className="text-sm text-gray-400">—</span>;
            }

            // Si ya está calificada, mostrar las estrellas promedio
            if (survey) {
              const avgRating = Math.round(
                (survey.professional_empathy_rating +
                  survey.professional_punctuality_rating +
                  survey.professional_satisfaction_rating +
                  survey.platform_booking_rating +
                  survey.platform_payment_rating +
                  survey.platform_experience_rating) /
                  6,
              );

              return (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= avgRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-600 ml-1">
                    ({avgRating}/5)
                  </span>
                </div>
              );
            }

            // Si puede calificar, mostrar botón
            if (status?.canRate) {
              return (
                <button
                  onClick={() => {
                    if (appointment.patient_id && appointment.professional_id) {
                      setSelectedAppointmentForSurvey(appointment);
                      setSurveyDialogOpen(true);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Star className="h-3 w-3" />
                  Calificar
                </button>
              );
            }

            // Si no puede calificar (ya pasó el plazo o ya calificó)
            if (status?.hasRated) {
              return (
                <span className="text-sm text-gray-400">Ya calificada</span>
              );
            }

            if (status && !status.canRate) {
              return (
                <span className="text-sm text-gray-400">Plazo vencido</span>
              );
            }

            return <span className="text-sm text-gray-400">—</span>;
          },
        }),
      );
    }

    return baseColumns as ColumnDef<AppointmentRow>[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    confirmationHours,
    confirmingAppointmentId,
    surveysMap,
    surveyStatusMap,
  ]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Cargando citas...</p>
        </div>
      </div>
    );
  }

  if (!tableData.length) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {emptyMessage ?? "No hay citas registradas"}
        </h3>
        <p className="text-sm text-gray-500">
          En cuanto se agenden nuevas citas, aparecerán en este listado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar en todas las columnas..."
        />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            Mostrando {table.getRowModel().rows.length} de {tableData.length}{" "}
            citas
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 border-b border-blue-200 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Filas por página:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {[5, 10, 25, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal de reagendar */}
      {selectedAppointment && (
        <RescheduleAppointmentModal
          appointment={selectedAppointment}
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
          onReschedule={(newDate, newTime) => {
            console.log("Reagendar cita:", { newDate, newTime });
            // Aquí se implementará la lógica de reagendamiento cuando esté lista
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Dialog de encuesta de satisfacción */}
      {selectedAppointmentForSurvey &&
        selectedAppointmentForSurvey.patient_id &&
        selectedAppointmentForSurvey.professional_id && (
          <SatisfactionSurveyDialog
            appointmentId={selectedAppointmentForSurvey.id}
            patientId={selectedAppointmentForSurvey.patient_id}
            professionalId={selectedAppointmentForSurvey.professional_id}
            scheduledAt={selectedAppointmentForSurvey.scheduled_at}
            open={surveyDialogOpen}
            onOpenChange={(open) => {
              setSurveyDialogOpen(open);
              if (!open) {
                setSelectedAppointmentForSurvey(null);
              }
            }}
            onSuccess={async () => {
              // Recargar encuestas después de calificar
              if (mode === "patient" && data && data.length > 0) {
                const surveys = new Map<string, SatisfactionSurvey>();
                const statuses = new Map<
                  string,
                  { canRate: boolean; hasRated: boolean }
                >();

                const promises = data.map(async (appointment) => {
                  try {
                    const appointmentDate = new Date(appointment.scheduled_at);
                    const now = new Date();
                    const isPast =
                      appointmentDate <= now ||
                      appointment.status === "completed";

                    if (isPast) {
                      const survey =
                        await satisfactionSurveyService.getSurveyByAppointmentId(
                          appointment.id,
                        );
                      if (survey) {
                        surveys.set(String(appointment.id), survey);
                      }

                      const status =
                        await satisfactionSurveyService.getAppointmentSurveyStatus(
                          appointment.id,
                          appointment.scheduled_at,
                        );

                      statuses.set(String(appointment.id), {
                        canRate: status.canRate,
                        hasRated: status.hasRated,
                      });
                    }
                  } catch (error) {
                    console.error(
                      `Error recargando encuesta para cita ${appointment.id}:`,
                      error,
                    );
                  }
                });

                await Promise.all(promises);
                setSurveysMap(surveys);
                setSurveyStatusMap(statuses);
              }

              // Llamar al callback de actualización si existe
              if (onAppointmentUpdate) {
                onAppointmentUpdate();
              }
            }}
          />
        )}
    </div>
  );
}
