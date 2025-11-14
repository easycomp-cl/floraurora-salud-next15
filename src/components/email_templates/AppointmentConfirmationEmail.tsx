import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Img,
} from "@react-email/components";

interface AppointmentConfirmationEmailProps {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  professionalName: string;
  appointmentUrl: string;
}

export function AppointmentConfirmationEmail({
  patientName,
  appointmentDate,
  appointmentTime,
  professionalName,
  appointmentUrl,
}: AppointmentConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={LOGO_URL}
              alt="FlorAurora Salud"
              width="150"
              height="auto"
              style={logoStyle}
            />
            <Heading style={headerTitle}>✅ Cita Confirmada</Heading>
            <Text style={headerSubtitle}>FlorAurora Salud</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Hola <strong>{patientName}</strong>,
            </Text>

            <Section style={messageBox}>
              <Text style={messageText}>
                Tu cita ha sido confirmada exitosamente. Te esperamos.
              </Text>

              <Section style={detailsBox}>
                <Text style={detailTitle}>📅 Detalles de tu cita:</Text>

                <Section style={detailRow}>
                  <Text style={detailLabel}>Fecha:</Text>
                  <Text style={detailValue}>{appointmentDate}</Text>
                </Section>

                <Section style={detailRow}>
                  <Text style={detailLabel}>Hora:</Text>
                  <Text style={detailValue}>{appointmentTime}</Text>
                </Section>

                <Section style={detailRow}>
                  <Text style={detailLabel}>Profesional:</Text>
                  <Text style={detailValue}>{professionalName}</Text>
                </Section>
              </Section>

              <Text style={reminderText}>
                📌 Te recordaremos un día antes de tu cita.
              </Text>

              <Section style={buttonContainer}>
                <Button style={button} href={appointmentUrl}>
                  Ver Detalles de Cita
                </Button>
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Equipo de FlorAurora Salud</Text>
            <Text style={footerNote}>
              Si necesitas cancelar o reagendar, contáctanos con anticipación.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default AppointmentConfirmationEmail;

const LOGO_URL = "https://www.floraurorasalud.cl/logo.png";

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
};

const header = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "10px 10px 0 0",
  padding: "30px",
  textAlign: "center" as const,
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const headerSubtitle = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
};

const content = {
  backgroundColor: "#f9fafb",
  padding: "30px",
  borderRadius: "0 0 10px 10px",
};

const greeting = {
  fontSize: "16px",
  color: "#333333",
  margin: "0 0 20px 0",
};

const messageBox = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  margin: "20px 0",
};

const messageText = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 20px 0",
};

const detailsBox = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const detailTitle = {
  fontWeight: "bold",
  color: "#1e40af",
  fontSize: "14px",
  margin: "0 0 15px 0",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "0",
};

const detailValue = {
  color: "#333333",
  fontSize: "13px",
  margin: "0",
};

const reminderText = {
  color: "#059669",
  fontSize: "13px",
  fontWeight: "bold",
  margin: "20px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "20px 0",
};

const button = {
  backgroundColor: "#667eea",
  borderRadius: "5px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 30px",
};

const footer = {
  textAlign: "center" as const,
  padding: "20px",
  color: "#6b7280",
  fontSize: "12px",
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  margin: "5px 0",
};

const footerNote = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "10px 0 0 0",
};

const logoStyle = {
  display: "block",
  margin: "0 auto 20px auto",
  maxWidth: "150px",
  height: "auto",
};
