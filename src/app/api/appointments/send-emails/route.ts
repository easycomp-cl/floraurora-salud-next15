import { NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import {
  sendPatientAppointmentEmail,
  sendProfessionalAppointmentEmail,
} from "@/lib/services/emailService";

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  meet_link: string | null;
  status: string | null;
  note: string | null;
  patient_id: number | null;
  professional_id: number | null;
  service: string | null;
  area: string | null;
}

interface UserRow {
  id: number;
  name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
}

interface PaymentRow {
  amount: number | null;
  currency: string | null;
}

const TIME_ZONE = "America/Santiago";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "full",
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatPrice(amount: number | null | undefined) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
}

function buildFullName(user: UserRow | null) {
  if (!user) return "Usuario sin nombre";
  const parts = [user.name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Usuario sin nombre";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const appointmentId = body?.appointmentId as string | undefined;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "appointmentId es requerido" },
        { status: 400 }
      );
    }

    const supportEmail =
      process.env.SUPPORT_EMAIL || "soporte@floraurora.cl";
    const supportPhone = process.env.SUPPORT_PHONE || undefined;

    const supabase = createAdminServer();

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        "id, scheduled_at, meet_link, status, note, patient_id, professional_id, service, area"
      )
      .eq("id", appointmentId)
      .single<AppointmentRow>();

    if (appointmentError || !appointment) {
      console.error(
        "[appointments/send-emails] No se encontró la cita",
        appointmentError
      );
      return NextResponse.json(
        { error: "Cita no encontrada" },
        { status: 404 }
      );
    }

    const [patientResult, professionalResult, paymentResult] =
      await Promise.all([
        appointment.patient_id
          ? supabase
              .from("users")
              .select("id, name, last_name, email, phone_number")
              .eq("id", appointment.patient_id)
              .single<UserRow>()
          : Promise.resolve({ data: null, error: null }),
        appointment.professional_id
          ? supabase
              .from("users")
              .select("id, name, last_name, email, phone_number")
              .eq("id", appointment.professional_id)
              .single<UserRow>()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("payments")
          .select("amount, currency")
          .eq("appointment_id", appointmentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<PaymentRow>(),
      ]);

    if (patientResult.error) {
      console.error(
        "[appointments/send-emails] Error obteniendo paciente",
        patientResult.error
      );
    }

    if (professionalResult.error) {
      console.error(
        "[appointments/send-emails] Error obteniendo profesional",
        professionalResult.error
      );
    }

    const patient = patientResult.data ?? null;
    const professional = professionalResult.data ?? null;
    const payment = paymentResult.data ?? null;

    if (!patient?.email) {
      return NextResponse.json(
        { error: "El paciente no tiene correo registrado" },
        { status: 422 }
      );
    }

    if (!professional?.email) {
      return NextResponse.json(
        { error: "El profesional no tiene correo registrado" },
        { status: 422 }
      );
    }

    const scheduledDate = new Date(appointment.scheduled_at);
    const now = new Date();

    const appointmentDate = formatDate(scheduledDate);
    const appointmentTime = formatTime(scheduledDate);
    const priceFormatted = formatPrice(payment?.amount);

    const hoursUntilAppointment =
      (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const meetsSoon = hoursUntilAppointment <= 24;
    const meetLink = appointment.meet_link ?? undefined;

    console.log(
      "[appointments/send-emails] Preparando envíos",
      JSON.stringify(
        {
          appointmentId,
          patientEmail: patient.email,
          professionalEmail: professional.email,
          meetsSoon,
          hasMeetLink: Boolean(meetLink),
        },
        null,
        2
      )
    );

    await sendPatientAppointmentEmail({
      to: patient.email,
      patientName: buildFullName(patient),
      professionalName: buildFullName(professional),
      serviceName: appointment.service ?? "Sesión psicológica",
      appointmentDate,
      appointmentTime,
      price: priceFormatted,
      meetLink: meetsSoon ? meetLink : undefined,
      supportEmail,
      supportPhone,
    });

    await sendProfessionalAppointmentEmail({
      to: professional.email,
      professionalName: buildFullName(professional),
      patientName: buildFullName(patient),
      patientEmail: patient.email,
      patientPhone: patient.phone_number ?? undefined,
      serviceName: appointment.service ?? "Sesión psicológica",
      appointmentDate,
      appointmentTime,
      price: priceFormatted,
      meetLink: meetLink ?? "#",
      notes: appointment.note ?? undefined,
      supportEmail,
    });

    return NextResponse.json({
      ok: true,
      message: "Correos de cita enviados",
    });
  } catch (error) {
    console.error("[appointments/send-emails] Error inesperado", error);
    return NextResponse.json(
      { error: "Error interno al enviar correos de cita" },
      { status: 500 }
    );
  }
}



