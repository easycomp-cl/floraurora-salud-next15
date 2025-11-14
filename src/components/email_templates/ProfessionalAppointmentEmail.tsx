import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Section,
  Text,
} from "@react-email/components";

interface ProfessionalAppointmentEmailProps {
  professionalName: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  price: string;
  meetLink: string;
  notes?: string;
  supportEmail: string;
}

export function ProfessionalAppointmentEmail({
  professionalName,
  patientName,
  patientEmail,
  patientPhone,
  serviceName,
  appointmentDate,
  appointmentTime,
  price,
  meetLink,
  notes,
  supportEmail,
}: ProfessionalAppointmentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={logoWrapper}>
            <Section style={logoBlock}>
              <Img
                src={LOGO_URL}
                alt="FlorAurora Salud"
                width={140}
                style={logo}
              />
            </Section>
          </Section>

          <Section style={header}>
            <Heading style={headerTitle}>Nueva cita asignada</Heading>
            <Text style={headerSubtitle}>
              Aquí tienes el detalle de la próxima sesión.
            </Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>
              Hola <strong>{professionalName}</strong>,
            </Text>

            <Text style={messageText}>
              Se ha agendado una nueva sesión. A continuación encontrarás toda
              la información relevante para tu preparación.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailTitle}>Información de la sesión</Text>

              <Section style={detailRow}>
                <Text style={detailLabel}>Paciente</Text>
                <Text style={detailValue}>{patientName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Correo del paciente</Text>
                <Text style={detailValue}>{patientEmail}</Text>
              </Section>

              {patientPhone ? (
                <Section style={detailRow}>
                  <Text style={detailLabel}>Teléfono</Text>
                  <Text style={detailValue}>{patientPhone}</Text>
                </Section>
              ) : null}

              <Section style={detailRow}>
                <Text style={detailLabel}>Servicio</Text>
                <Text style={detailValue}>{serviceName}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Fecha</Text>
                <Text style={detailValue}>{appointmentDate}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Hora</Text>
                <Text style={detailValue}>{appointmentTime}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Precio</Text>
                <Text style={detailValue}>{price}</Text>
              </Section>
            </Section>

            <Section style={ctaSection}>
              <Text style={ctaNote}>
                La sesión se realizará vía Google Meet. Únete usando el siguiente
                enlace:
              </Text>
              <Button style={button} href={meetLink}>
                Acceder a la reunión
              </Button>
              <Text style={linkFallback}>{meetLink}</Text>
            </Section>

            {notes ? (
              <Section style={notesBox}>
                <Text style={notesTitle}>Notas adicionales</Text>
                <Text style={notesText}>{notes}</Text>
              </Section>
            ) : null}

            <Section style={supportBox}>
              <Text style={supportTitle}>Soporte FlorAurora</Text>
              <Text style={supportText}>
                Si tienes dudas o necesitas reagendar, contáctanos en{" "}
                <a href={`mailto:${supportEmail}`} style={supportLink}>
                  {supportEmail}
                </a>
                .
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Equipos FlorAurora Salud · Gracias por tu compromiso
            </Text>
            <Text style={footerNote}>
              Este mensaje es informativo. Por favor gestiona cambios desde la
              plataforma.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ProfessionalAppointmentEmail;

const LOGO_URL =
  "https://floraurora-salud-next15-nine.vercel.app/logo.png";

const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0 20px 32px 20px",
  maxWidth: "600px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const logoWrapper = {
  padding: "24px 0 16px 0",
  textAlign: "center" as const,
  background:
    "linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.12) 100%)",
  borderRadius: "14px 14px 0 0",
};

const logoBlock = {
  display: "inline-block",
  backgroundColor: "#ffffff",
  padding: "12px 24px",
  borderRadius: "999px",
  boxShadow: "0 8px 20px rgba(102,126,234,0.18)",
};

const logo = {
  display: "block",
  margin: "0 auto",
};

const header = {
  textAlign: "center" as const,
  padding: "24px 12px",
};

const headerTitle = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const headerSubtitle = {
  color: "#4b5563",
  fontSize: "15px",
  margin: "0",
};

const content = {
  backgroundColor: "#f9fafb",
  padding: "24px",
  borderRadius: "12px",
};

const greeting = {
  fontSize: "16px",
  color: "#1f2937",
  margin: "0 0 16px 0",
};

const messageText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#4b5563",
  margin: "0 0 20px 0",
};

const detailsBox = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  border: "1px solid #dbeafe",
  padding: "20px",
  marginBottom: "24px",
};

const detailTitle = {
  color: "#1d4ed8",
  fontSize: "14px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
  margin: "0 0 16px 0",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0",
};

const detailValue = {
  color: "#1f2937",
  fontSize: "13px",
  margin: "0",
  textAlign: "right" as const,
  maxWidth: "260px",
};

const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const ctaNote = {
  color: "#1f2937",
  fontSize: "14px",
  margin: "0 0 14px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "14px 32px",
  display: "inline-block",
};

const linkFallback = {
  color: "#6366f1",
  fontSize: "13px",
  margin: "12px 0 0 0",
  wordBreak: "break-all" as const,
};

const notesBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "10px",
  padding: "16px 20px",
  marginBottom: "24px",
};

const notesTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const notesText = {
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const supportBox = {
  backgroundColor: "#eef2ff",
  borderRadius: "10px",
  padding: "16px 20px",
};

const supportTitle = {
  color: "#4338ca",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const supportText = {
  color: "#4338ca",
  fontSize: "13px",
  margin: "0",
};

const supportLink = {
  color: "#4338ca",
  textDecoration: "underline",
};

const footer = {
  textAlign: "center" as const,
  padding: "24px 12px 0 12px",
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const footerNote = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "0",
};


