import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
} from "@react-email/components";

interface ProfessionalRequestReceivedEmailProps {
  professionalName: string;
}

const LOGO_URL = "https://www.floraurorasalud.cl/logo.png";

export function ProfessionalRequestReceivedEmail({
  professionalName,
}: ProfessionalRequestReceivedEmailProps) {
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
            <Heading style={headerTitle}>¡Solicitud Recibida!</Heading>
            <Text style={headerSubtitle}>FlorAurora Salud</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Estimado/a <strong>{professionalName}</strong>,</Text>
            
            <Section style={messageBox}>
              <Text style={messageText}>
                Hemos recibido tu solicitud para registrarte como profesional en FlorAurora Salud.
              </Text>
              
              <Text style={messageText}>
                Nuestro equipo de administradores revisará tu solicitud y los documentos adjuntos. Te notificaremos por correo electrónico cuando tu solicitud sea aprobada o si necesitamos información adicional.
              </Text>
            </Section>

            <Section style={infoBox}>
              <Text style={infoTitle}>⏱️ Tiempo de revisión</Text>
              <Text style={infoText}>
                Este proceso puede tomar entre <strong>1 a 3 días hábiles</strong>. Te mantendremos informado sobre el estado de tu solicitud.
              </Text>
            </Section>

            <Section style={helpBox}>
              <Text style={helpText}>
                💡 <strong>¿Tienes alguna pregunta?</strong> No dudes en contactarnos. Estamos aquí para ayudarte en cada paso del proceso.
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
              Gracias por tu interés en formar parte de nuestro equipo profesional.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ProfessionalRequestReceivedEmail;

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
  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
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
  backgroundColor: "#f0fdfa",
  padding: "20px",
  borderRadius: "8px",
  border: "2px solid #14b8a6",
  margin: "20px 0",
};

const messageText = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 15px 0",
};

const infoBox = {
  backgroundColor: "#e0f2fe",
  padding: "20px",
  borderRadius: "8px",
  borderLeft: "4px solid #0ea5e9",
  margin: "20px 0",
};

const infoTitle = {
  color: "#0369a1",
  fontSize: "15px",
  fontWeight: "bold",
  margin: "0 0 10px 0",
};

const infoText = {
  color: "#0c4a6e",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const helpBox = {
  backgroundColor: "#fef3c7",
  padding: "15px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #fbbf24",
};

const helpText = {
  color: "#92400e",
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

