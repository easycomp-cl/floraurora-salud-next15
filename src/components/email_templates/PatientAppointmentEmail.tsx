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

interface PatientAppointmentEmailProps {
  patientName: string;
  professionalName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  price: string;
  meetLink?: string;
  supportEmail: string;
  supportPhone?: string;
}

export function PatientAppointmentEmail({
  patientName,
  professionalName,
  serviceName,
  appointmentDate,
  appointmentTime,
  price,
  meetLink,
  supportEmail,
  supportPhone,
}: PatientAppointmentEmailProps) {
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
            <Heading style={headerTitle}>¡Tu cita está confirmada!</Heading>
            <Text style={headerSubtitle}>
              Gracias por confiar en FlorAurora Salud.
            </Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>
              Hola <strong>{patientName}</strong>,
            </Text>

            <Text style={messageText}>
              Hemos registrado tu cita con el siguiente profesional. Recuerda
              estar lista/o unos minutos antes para aprovechar al máximo la
              sesión.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailTitle}>Detalles de la cita</Text>

              <Section style={detailRow}>
                <Text style={detailLabel}>Profesional</Text>
                <Text style={detailValue}>{professionalName}</Text>
              </Section>

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

            {meetLink ? (
              <Section style={ctaSection}>
                <Text style={ctaNote}>
                  Tu sesión será online. Únete mediante el siguiente enlace:
                </Text>
                <Button style={button} href={meetLink}>
                  Unirme a la sesión
                </Button>
                <Text style={linkFallback}>{meetLink}</Text>
              </Section>
            ) : (
              <Text style={reminderText}>
                Te enviaremos el enlace de Google Meet 24 horas antes de la
                sesión.
              </Text>
            )}

            <Section style={supportBox}>
              <Text style={supportTitle}>¿Necesitas ayuda?</Text>
              <Text style={supportText}>
                Escríbenos a{" "}
                <a href={`mailto:${supportEmail}`} style={supportLink}>
                  {supportEmail}
                </a>
                {supportPhone ? (
                  <>
                    {" "}
                    o llámanos al{" "}
                    <a href={`tel:${supportPhone}`} style={supportLink}>
                      {supportPhone}
                    </a>
                    .
                  </>
                ) : (
                  "."
                )}
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              FlorAurora Salud · Acompañamiento psicológico en línea
            </Text>
            <Text style={footerNote}>
              Por favor no respondas a este correo. Si necesitas cambios,
              contáctanos.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PatientAppointmentEmail;

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

const reminderText = {
  color: "#059669",
  fontSize: "13px",
  fontWeight: "600",
  margin: "0 0 24px 0",
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


