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

interface ProfessionalRequestRejectedEmailProps {
  professionalName: string;
  rejectionReason: string;
  resubmitUrl: string;
}

const LOGO_URL = "https://www.floraurorasalud.cl/logo.png";

export function ProfessionalRequestRejectedEmail({
  professionalName,
  rejectionReason,
  resubmitUrl,
}: ProfessionalRequestRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Section style={logoContainer}>
              <Img
                src={LOGO_URL}
                alt="FlorAurora Salud"
                width="180"
                height="auto"
                style={logoStyle}
              />
            </Section>
            <Heading style={headerTitle}>Actualización sobre tu Solicitud</Heading>
            <Text style={headerSubtitle}>FlorAurora Salud</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Estimado/a <strong>{professionalName}</strong>,</Text>
            
            <Section style={messageBox}>
              <Text style={messageText}>
                Lamentamos informarte que tu solicitud para registrarte como profesional en FlorAurora Salud ha sido <strong style={highlight}>rechazada</strong>.
              </Text>
            </Section>

            <Section style={reasonBox}>
              <Text style={reasonTitle}>📋 Motivo del rechazo:</Text>
              <Text style={reasonText}>{rejectionReason}</Text>
            </Section>

            <Text style={messageText}>
              No te desanimes. Puedes corregir la información y volver a enviar tu solicitud. Nuestro equipo está aquí para ayudarte.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resubmitUrl}>
                Reenviar Solicitud
              </Button>
            </Section>

            <Section style={helpBox}>
              <Text style={helpText}>
                💡 <strong>Consejo:</strong> Revisa cuidadosamente todos los documentos y la información antes de reenviar tu solicitud. Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Saludos cordiales,<br />
              <strong>Equipo FlorAurora Salud</strong>
            </Text>
            <Text style={footerSubtext}>
              Estamos aquí para ayudarte en cada paso del proceso.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ProfessionalRequestRejectedEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
  borderRadius: "10px",
  overflow: "hidden",
};

const header = {
  background: "linear-gradient(135deg, #b8718f 0%, #a8556f 100%)",
  borderRadius: "10px 10px 0 0",
  padding: "40px 30px",
  textAlign: "center" as const,
};

const logoContainer = {
  backgroundColor: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  display: "inline-block",
  margin: "0 auto 20px auto",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const logoStyle = {
  display: "block",
  margin: "0 auto",
  borderRadius: "4px",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const headerSubtitle = {
  color: "#ffffff",
  fontSize: "16px",
  margin: "0",
  opacity: 0.9,
};

const content = {
  backgroundColor: "#ffffff",
  padding: "40px 30px",
};

const greeting = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px 0",
};

const messageBox = {
  backgroundColor: "#fef2f2",
  padding: "20px",
  borderRadius: "8px",
  border: "2px solid #b8718f",
  margin: "20px 0",
};

const messageText = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 15px 0",
};

const highlight = {
  color: "#a8556f",
  fontWeight: "bold",
};

const reasonBox = {
  backgroundColor: "#fff7ed",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #f59e0b",
  margin: "20px 0",
};

const reasonTitle = {
  color: "#92400e",
  fontSize: "15px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const reasonText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  boxShadow: "0 4px 6px rgba(37, 99, 235, 0.3)",
};

const helpBox = {
  backgroundColor: "#eff6ff",
  padding: "15px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #3b82f6",
};

const helpText = {
  color: "#1e40af",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const footer = {
  backgroundColor: "#f9fafb",
  padding: "30px",
  textAlign: "center" as const,
  borderTop: "1px solid #e5e7eb",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 10px 0",
};

const footerSubtext = {
  color: "#9ca3af",
  fontSize: "12px",
  margin: "0",
};

