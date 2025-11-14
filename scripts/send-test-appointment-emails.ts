#!/usr/bin/env node
import "dotenv/config";
import { createElement } from "react";
import { render } from "@react-email/render";
import {
  PatientAppointmentEmail,
  ProfessionalAppointmentEmail,
  PatientAppointmentReminderEmail,
} from "../src/components/email_templates";
import { sendEmail } from "../src/lib/services/emailService";

function assertSendgridConfigured() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn(
      "[send-test-appointment-emails] Falta la variable SENDGRID_API_KEY. El script intentará ejecutarse, pero SendGrid rechazará el envío."
    );
  }
}

function getArgEmail(): string {
  const [, , email] = process.argv;
  if (!email) {
    console.error(
      "Uso: npm run send:test-emails <correo-destino>\nEjemplo: npm run send:test-emails prueba@example.com"
    );
    process.exit(1);
  }
  return email;
}

function getSupportEmail(): string {
  return (
    process.env.SUPPORT_EMAIL ||
    process.env.CONTACT_EMAIL ||
    "soporte@floraurora.cl"
  );
}

function getSupportPhone(): string | undefined {
  return process.env.SUPPORT_PHONE || process.env.CONTACT_PHONE;
}

async function sendTemplateEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const result = await sendEmail({
    to,
    subject,
    html,
  });

  if (!result.success) {
    throw new Error(
      `Fallo al enviar "${subject}": ${result.error || "Error desconocido"}`
    );
  }
}

async function main() {
  assertSendgridConfigured();
  const destination = getArgEmail();
  const supportEmail = getSupportEmail();
  const supportPhone = getSupportPhone();
  const meetLink = "https://meet.google.com/abc-defg-hij";

  console.log(
    `[send-test-appointment-emails] Enviando correos de prueba a ${destination}`
  );

  const htmlPatientWithMeet = await render(
    createElement(PatientAppointmentEmail, {
      patientName: "María",
      professionalName: "Ps. Juan Pérez",
      serviceName: "Sesión individual online",
      appointmentDate: "Lunes 18 de noviembre de 2025",
      appointmentTime: "10:00 (GMT-3)",
      price: "$35.000",
      meetLink,
      supportEmail,
      supportPhone,
    })
  );

  const htmlPatientWithoutMeet = await render(
    createElement(PatientAppointmentEmail, {
      patientName: "María",
      professionalName: "Ps. Juan Pérez",
      serviceName: "Sesión individual online",
      appointmentDate: "Lunes 25 de noviembre de 2025",
      appointmentTime: "16:30 (GMT-3)",
      price: "$35.000",
      supportEmail,
      supportPhone,
    })
  );

  const htmlProfessional = await render(
    createElement(ProfessionalAppointmentEmail, {
      professionalName: "Ps. Juan Pérez",
      patientName: "María López",
      patientEmail: "maria.lopez@example.com",
      patientPhone: "+56 9 1111 2222",
      serviceName: "Sesión individual online",
      appointmentDate: "Lunes 18 de noviembre de 2025",
      appointmentTime: "10:00 (GMT-3)",
      price: "$35.000",
      meetLink,
      notes: "Paciente nueva, viene derivada por recomendación de un familiar.",
      supportEmail,
    })
  );

  const htmlReminder = await render(
    createElement(PatientAppointmentReminderEmail, {
      patientName: "María",
      professionalName: "Ps. Juan Pérez",
      serviceName: "Sesión individual online",
      appointmentDate: "Domingo 17 de noviembre de 2025",
      appointmentTime: "10:00 (GMT-3)",
      meetLink,
      supportEmail,
      supportPhone,
    })
  );

  await sendTemplateEmail({
    to: destination,
    subject: "FlorAurora | Cita confirmada (con enlace)",
    html: htmlPatientWithMeet,
  });

  await sendTemplateEmail({
    to: destination,
    subject: "FlorAurora | Cita confirmada (sin enlace aún)",
    html: htmlPatientWithoutMeet,
  });

  await sendTemplateEmail({
    to: destination,
    subject: "FlorAurora | Nueva cita asignada (profesional)",
    html: htmlProfessional,
  });

  await sendTemplateEmail({
    to: destination,
    subject: "FlorAurora | Recordatorio de cita (24h)",
    html: htmlReminder,
  });

  console.log(
    "[send-test-appointment-emails] Correos de prueba enviados correctamente."
  );
}

main().catch((error) => {
  console.error("[send-test-appointment-emails] Error:", error);
  process.exit(1);
});


