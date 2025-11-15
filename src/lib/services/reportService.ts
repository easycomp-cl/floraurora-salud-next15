import { createAdminServer } from "@/utils/supabase/server";
import { DateTime } from "luxon";

type DateRange = {
  from?: string;
  to?: string;
};

export type MetricsResponse = {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalRevenue: number;
  averageTicket: number;
  activeUsers: number;
  activeProfessionals: number;
  newUsers: number;
};

export type AppointmentReportFilters = DateRange & {
  professionalId?: number;
  patientId?: number;
  areaId?: number;
  service?: string;
};

export type ReportAppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string | null;
  payment_status: string | null;
  patient_name: string | null;
  professional_name: string | null;
  service: string | null;
  area: string | null;
  amount: number | null;
  currency: string | null;
  created_at: string;
  is_rescheduled?: boolean | null;
  rescheduled_at?: string | null;
};

export type PaymentsHistoryRow = {
  appointment_id: string;
  amount: number | null;
  currency: string | null;
  created_at: string;
  patient_name: string | null;
  professional_name: string | null;
};

const normalizeDateRange = ({ from, to }: DateRange) => {
  const now = DateTime.now().setZone("America/Santiago");
  const rangeStart = from ? DateTime.fromISO(from) : now.minus({ months: 1 });
  const rangeEnd = to ? DateTime.fromISO(to) : now;

  return {
    from: rangeStart.startOf("day").toISO(),
    to: rangeEnd.endOf("day").toISO(),
  };
};

const buildAppointmentQuery = (
  filters: AppointmentReportFilters,
  includeStatus = true,
  includeService = true,
) => {
  const supabase = createAdminServer();
  const { from, to } = normalizeDateRange(filters);

  let query = supabase
    .from("appointments")
    .select(
      `
        id,
        scheduled_at,
        duration_minutes,
        status,
        payment_status,
        patient_id,
        professional_id,
        service,
        area,
        created_at,
        is_rescheduled,
        rescheduled_at
      `,
    )
    .gte("scheduled_at", from)
    .lte("scheduled_at", to)
    .order("scheduled_at", { ascending: false });

  if (typeof filters.professionalId === "number") {
    query = query.eq("professional_id", filters.professionalId);
  }

  if (typeof filters.patientId === "number") {
    query = query.eq("patient_id", filters.patientId);
  }

  // areaId necesita ser convertido a nombre de área antes de filtrar
  // Por ahora, si se proporciona areaId, necesitamos obtener el nombre del área
  // y filtrar por ese nombre (ya que appointments.area es un string)
  // Esto se manejará en fetchAppointmentsWithDetails

  if (includeService && filters.service) {
    query = query.ilike("service", `%${filters.service}%`);
  }

  if (!includeStatus) {
    query = query.not("status", "is", null);
  }

  return query;
};

const fetchAppointmentsWithDetails = async (
  filters: AppointmentReportFilters,
): Promise<ReportAppointmentRow[]> => {
  const supabase = createAdminServer();
  
  // Si se proporciona areaId, obtener el nombre del área primero
  let areaName: string | undefined = undefined;
  if (typeof filters.areaId === "number") {
    const { data: areaData } = await supabase
      .from("professional_titles")
      .select("title_name")
      .eq("id", filters.areaId)
      .single();
    
    if (areaData) {
      areaName = areaData.title_name as string;
    }
  }
  
  // Construir query con filtro de área si existe
  let query = buildAppointmentQuery(filters);
  if (areaName) {
    query = query.eq("area", areaName);
  }
  
  // Obtener todos los registros sin límite (Supabase tiene un límite por defecto de 1000)
  // Si hay más de 1000, necesitaremos implementar paginación
  const { data: appointments, error } = await query.limit(10000);

  if (error) {
    throw new Error(`No se pudieron obtener las citas: ${error.message}`);
  }

  const appointmentRows = (appointments ?? []) as {
    id: string;
    scheduled_at: string;
    status: string | null;
    payment_status: string | null;
    patient_id: number | null;
    professional_id: number | null;
    service: string | null;
    area: string | null;
    created_at: string;
    is_rescheduled: boolean | null;
    rescheduled_at: string | null;
  }[];

  if (appointmentRows.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(
      appointmentRows.flatMap((row) => [row.patient_id, row.professional_id]).filter((value): value is number => typeof value === "number"),
    ),
  );

  const [{ data: usersData }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, last_name")
      .in("id", userIds),
    supabase
      .from("payments")
      .select("appointment_id, amount, currency, created_at, provider_payment_status")
      .in("appointment_id", appointmentRows.map((row) => row.id))
      .limit(10000), // Asegurar que obtenemos todos los pagos
  ]);

  const userMap = new Map<number, { name: string | null; last_name: string | null }>();
  (usersData ?? []).forEach((user) => {
    userMap.set(Number(user.id), {
      name: (user.name as string) ?? null,
      last_name: (user.last_name as string) ?? null,
    });
  });

  // Crear un mapa de pagos por appointment_id
  // Si hay múltiples pagos, priorizar los exitosos y luego los más recientes
  const paymentsMap = new Map<string, { amount: number | null; currency: string | null; created_at: string | null }>();
  
  // Ordenar pagos: primero por estado (succeeded primero), luego por fecha (más reciente primero)
  const sortedPayments = [...(paymentsData ?? [])].sort((a, b) => {
    const aStatus = (a.provider_payment_status as string) ?? "";
    const bStatus = (b.provider_payment_status as string) ?? "";
    
    // Priorizar succeeded
    if (aStatus === "succeeded" && bStatus !== "succeeded") return -1;
    if (bStatus === "succeeded" && aStatus !== "succeeded") return 1;
    
    // Si ambos tienen el mismo estado o ninguno es succeeded, ordenar por fecha
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate; // Más reciente primero
  });
  
  sortedPayments.forEach((payment) => {
    if (payment.appointment_id && !paymentsMap.has(payment.appointment_id)) {
      paymentsMap.set(payment.appointment_id, {
        amount: payment.amount ? Number(payment.amount) : null,
        currency: (payment.currency as string) ?? null,
        created_at: payment.created_at ? String(payment.created_at) : null,
      });
    }
  });

  return appointmentRows.map((row) => {
    const payment = paymentsMap.get(row.id);
    const patient = row.patient_id ? userMap.get(row.patient_id) : null;
    const professional = row.professional_id ? userMap.get(row.professional_id) : null;

    return {
      id: row.id,
      scheduled_at: row.scheduled_at,
      status: row.status,
      payment_status: row.payment_status,
      patient_name: patient ? `${patient.name ?? ""} ${patient.last_name ?? ""}`.trim() || null : null,
      professional_name: professional ? `${professional.name ?? ""} ${professional.last_name ?? ""}`.trim() || null : null,
      service: row.service,
      area: row.area,
      amount: payment?.amount ?? null,
      currency: payment?.currency ?? null,
      created_at: row.created_at,
      is_rescheduled: row.is_rescheduled ?? false,
      rescheduled_at: row.rescheduled_at ?? null,
    };
  });
};

export const reportService = {
  async getDashboardMetrics(filters: DateRange = {}): Promise<MetricsResponse> {
    const supabase = createAdminServer();
    const { from, to } = normalizeDateRange(filters);

    const [totalAppointmentsResult, completedAppointmentsResult, upcomingAppointmentsResult, totalRevenueResult, usersResult, professionalsResult, newUsersResult] =
      await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_at", from)
          .lte("scheduled_at", to),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_at", from)
          .lte("scheduled_at", to)
          .eq("status", "completed"),
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .gte("scheduled_at", DateTime.now().toISO())
          .lte("scheduled_at", to),
        supabase
          .from("payments")
          .select("amount", { count: "exact" })
          .gte("created_at", from)
          .lte("created_at", to),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("professionals")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .gte("created_at", from)
          .lte("created_at", to),
      ]);

    const totalRevenue =
      (totalRevenueResult.data ?? []).reduce<number>(
        (acc, row) => acc + (row.amount ? Number(row.amount) : 0),
        0,
      ) ?? 0;

    const totalAppointments = totalAppointmentsResult.count ?? 0;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    return {
      totalAppointments,
      completedAppointments: completedAppointmentsResult.count ?? 0,
      upcomingAppointments: upcomingAppointmentsResult.count ?? 0,
      totalRevenue,
      averageTicket,
      activeUsers: usersResult.count ?? 0,
      activeProfessionals: professionalsResult.count ?? 0,
      newUsers: newUsersResult.count ?? 0,
    };
  },

  async getAppointmentsReport(filters: AppointmentReportFilters): Promise<ReportAppointmentRow[]> {
    return fetchAppointmentsWithDetails(filters);
  },

  async getRescheduledAppointmentsReport(
    filters: AppointmentReportFilters = {},
  ): Promise<ReportAppointmentRow[]> {
    const supabase = createAdminServer();
    const { from, to } = normalizeDateRange(filters);
    
    // Obtener el nombre del área si se proporciona areaId
    let areaName: string | undefined = undefined;
    if (typeof filters.areaId === "number") {
      const { data: areaData } = await supabase
        .from("professional_titles")
        .select("title_name")
        .eq("id", filters.areaId)
        .single();
      
      if (areaData) {
        areaName = areaData.title_name as string;
      }
    }
    
    // Construir query para citas reagendadas
    let query = supabase
      .from("appointments")
      .select(
        `
          id,
          scheduled_at,
          duration_minutes,
          status,
          payment_status,
          patient_id,
          professional_id,
          service,
          area,
          created_at,
          is_rescheduled,
          rescheduled_at
        `,
      )
      .eq("is_rescheduled", true)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at", { ascending: false });

    if (typeof filters.professionalId === "number") {
      query = query.eq("professional_id", filters.professionalId);
    }

    if (typeof filters.patientId === "number") {
      query = query.eq("patient_id", filters.patientId);
    }

    if (areaName) {
      query = query.eq("area", areaName);
    }

    if (filters.service) {
      query = query.ilike("service", `%${filters.service}%`);
    }

    const { data: appointments, error } = await query.limit(10000);

    if (error) {
      throw new Error(`No se pudieron obtener las citas reagendadas: ${error.message}`);
    }

    const appointmentRows = (appointments ?? []) as {
      id: string;
      scheduled_at: string;
      status: string | null;
      payment_status: string | null;
      patient_id: number | null;
      professional_id: number | null;
      service: string | null;
      area: string | null;
      created_at: string;
      is_rescheduled: boolean | null;
      rescheduled_at: string | null;
    }[];

    if (appointmentRows.length === 0) {
      return [];
    }

    const userIds = Array.from(
      new Set(
        appointmentRows.flatMap((row) => [row.patient_id, row.professional_id]).filter((value): value is number => typeof value === "number"),
      ),
    );

    const [{ data: usersData }, { data: paymentsData }] = await Promise.all([
      supabase
        .from("users")
        .select("id, name, last_name")
        .in("id", userIds),
      supabase
        .from("payments")
        .select("appointment_id, amount, currency, created_at, provider_payment_status")
        .in("appointment_id", appointmentRows.map((row) => row.id))
        .limit(10000),
    ]);

    const userMap = new Map<number, { name: string | null; last_name: string | null }>();
    (usersData ?? []).forEach((user) => {
      userMap.set(Number(user.id), {
        name: (user.name as string) ?? null,
        last_name: (user.last_name as string) ?? null,
      });
    });

    const paymentsMap = new Map<string, { amount: number | null; currency: string | null; created_at: string | null }>();
    
    const sortedPayments = [...(paymentsData ?? [])].sort((a, b) => {
      const aStatus = (a.provider_payment_status as string) ?? "";
      const bStatus = (b.provider_payment_status as string) ?? "";
      
      if (aStatus === "succeeded" && bStatus !== "succeeded") return -1;
      if (bStatus === "succeeded" && aStatus !== "succeeded") return 1;
      
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
    
    sortedPayments.forEach((payment) => {
      if (payment.appointment_id && !paymentsMap.has(payment.appointment_id)) {
        paymentsMap.set(payment.appointment_id, {
          amount: payment.amount ? Number(payment.amount) : null,
          currency: (payment.currency as string) ?? null,
          created_at: payment.created_at ? String(payment.created_at) : null,
        });
      }
    });

    return appointmentRows.map((row) => {
      const payment = paymentsMap.get(row.id);
      const patient = row.patient_id ? userMap.get(row.patient_id) : null;
      const professional = row.professional_id ? userMap.get(row.professional_id) : null;

      return {
        id: row.id,
        scheduled_at: row.scheduled_at,
        status: row.status,
        payment_status: row.payment_status,
        patient_name: patient ? `${patient.name ?? ""} ${patient.last_name ?? ""}`.trim() || null : null,
        professional_name: professional ? `${professional.name ?? ""} ${professional.last_name ?? ""}`.trim() || null : null,
        service: row.service,
        area: row.area,
        amount: payment?.amount ?? null,
        currency: payment?.currency ?? null,
        created_at: row.created_at,
        is_rescheduled: row.is_rescheduled ?? true,
        rescheduled_at: row.rescheduled_at ?? null,
      };
    });
  },

  async getPaymentsHistory(filters: AppointmentReportFilters = {}): Promise<PaymentsHistoryRow[]> {
    // Primero obtener las citas con todos los filtros aplicados
    const appointments = await fetchAppointmentsWithDetails(filters);
    
    if (appointments.length === 0) {
      return [];
    }

    const supabase = createAdminServer();
    const appointmentIds = appointments.map((a) => a.id);

    // Obtener los pagos que corresponden a estas citas
    const { data, error } = await supabase
      .from("payments")
      .select("appointment_id, amount, currency, created_at")
      .in("appointment_id", appointmentIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`No se pudo obtener el historial de pagos: ${error.message}`);
    }

    const payments = (data ?? []) as {
      appointment_id: string | null;
      amount: number | null;
      currency: string | null;
      created_at: string;
    }[];

    if (payments.length === 0) {
      return [];
    }

    // Crear un mapa de citas por ID para acceso rápido
    const appointmentMap = new Map<string, ReportAppointmentRow>(
      appointments.map((appointment) => [appointment.id, appointment]),
    );

    // Mapear pagos con los datos de las citas
    return payments
      .filter((payment): payment is typeof payment & { appointment_id: string } => {
        // Solo incluir pagos que tienen una cita asociada (para mantener consistencia con los filtros)
        return payment.appointment_id !== null && appointmentMap.has(payment.appointment_id);
      })
      .map((payment) => {
        const appointment = appointmentMap.get(payment.appointment_id);
        
        // En este punto, appointment siempre existe porque ya filtramos arriba
        return {
          appointment_id: payment.appointment_id,
          amount: payment.amount,
          currency: payment.currency,
          created_at: payment.created_at,
          patient_name: appointment?.patient_name ?? null,
          professional_name: appointment?.professional_name ?? null,
        };
      });
  },

  async exportAppointmentsReport(
    filters: AppointmentReportFilters,
    format: "pdf" | "excel",
  ): Promise<{ filename: string; contentType: string; buffer: Buffer }> {
    const rows = await fetchAppointmentsWithDetails(filters);
    const range = normalizeDateRange(filters);
    const dateLabel = `${DateTime.fromISO(range.from).toFormat("yyyyLLdd")}-${DateTime.fromISO(range.to).toFormat("yyyyLLdd")}`;

    if (format === "excel") {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Citas");
      sheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Fecha", key: "scheduled_at", width: 20 },
        { header: "Estado", key: "status", width: 15 },
        { header: "Paciente", key: "patient_name", width: 25 },
        { header: "Profesional", key: "professional_name", width: 25 },
        { header: "Servicio", key: "service", width: 25 },
        { header: "Área", key: "area", width: 20 },
        { header: "Monto", key: "amount", width: 15 },
        { header: "Moneda", key: "currency", width: 10 },
      ];

      rows.forEach((row) => {
        sheet.addRow({
          id: row.id,
          scheduled_at: DateTime.fromISO(row.scheduled_at).setLocale("es").toFormat("dd/MM/yyyy HH:mm"),
          status: row.status ?? "Sin estado",
          patient_name: row.patient_name ?? "N/A",
          professional_name: row.professional_name ?? "N/A",
          service: row.service ?? "N/A",
          area: row.area ?? "N/A",
          amount: row.amount ?? 0,
          currency: row.currency ?? "CLP",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return {
        filename: `reporte-citas-${dateLabel}.xlsx`,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: Buffer.from(buffer),
      };
    }

    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(18).text("Reporte de citas", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Periodo: ${DateTime.fromISO(range.from).toFormat("dd/MM/yyyy")} - ${DateTime.fromISO(range.to).toFormat("dd/MM/yyyy")}`);
    doc.moveDown();

    rows.slice(0, 200).forEach((row) => {
      const date = DateTime.fromISO(row.scheduled_at).toFormat("dd/MM/yyyy HH:mm");
      doc.font("Helvetica-Bold").text(`${row.service ?? "Sin servicio"} (${row.status ?? "Sin estado"})`);
      doc.font("Helvetica").text(`Fecha: ${date}`);
      doc.text(`Paciente: ${row.patient_name ?? "N/A"}`);
      doc.text(`Profesional: ${row.professional_name ?? "N/A"}`);
      doc.text(`Monto: ${row.amount ?? 0} ${row.currency ?? "CLP"}`);
      doc.moveDown();
    });

    doc.end();

    return await new Promise((resolve) => {
      doc.on("end", () => {
        resolve({
          filename: `reporte-citas-${dateLabel}.pdf`,
          contentType: "application/pdf",
          buffer: Buffer.concat(chunks),
        });
      });
    });
  },
};

