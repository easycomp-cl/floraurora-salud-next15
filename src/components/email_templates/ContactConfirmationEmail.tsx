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

interface ContactConfirmationEmailProps {
  firstName: string;
  lastName: string;
  subject: string;
  message: string;
  logoUrl?: string;
}

export function ContactConfirmationEmail({
  firstName,
  lastName,
  subject,
  message,
  logoUrl,
}: ContactConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {logoUrl && (
              <Img
                src={logoUrl}
                alt="FlorAurora Salud"
                width="150"
                height="auto"
                style={logoStyle}
              />
            )}
            <Heading style={headerTitle}>¡Gracias por contactarnos! 👋</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>
              Hola <strong>{firstName} {lastName}</strong>,
            </Text>

            <Section style={messageBox}>
              <Text style={messageText}>
                Hemos recibido tu mensaje exitosamente. Nuestro equipo revisará
                tu consulta y te responderá a la brevedad posible.
              </Text>

              <Section style={infoBox}>
                <Text style={infoTitle}>📋 Resumen de tu consulta:</Text>
                <Text style={infoText}>
                  <strong>Asunto:</strong> {subject}
                </Text>
                <Text style={infoText}>
                  <strong>Fecha:</strong> {new Date().toLocaleString("es-CL")}
                </Text>
              </Section>

              <Section style={messageQuoteBox}>
                <Text style={messageQuoteLabel}>💬 Tu mensaje:</Text>
                <Text style={messageQuote}>
                  &quot;{message}&quot;
                </Text>
              </Section>

              <Text style={messageText}>
                Si tienes alguna pregunta urgente, puedes contactarnos
                directamente:
              </Text>

              <Text style={contactInfo}>
                📧 Email: contacto@floraurorasalud.cl
                <br />
                📱 WhatsApp: +56 9 9999 9999
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Atentamente,</Text>
            <Text style={footerText}>
              <strong>Equipo de FlorAurora Salud</strong>
            </Text>
            <Text style={footerNote}>
              Este es un email automático. Por favor no respondas a este
              mensaje.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactConfirmationEmail;

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
  margin: "10px 0",
};

const infoBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  padding: "15px",
  margin: "20px 0",
};

const infoTitle = {
  fontWeight: "bold",
  color: "#1e40af",
  fontSize: "14px",
  margin: "0 0 10px 0",
};

const infoText = {
  color: "#333333",
  fontSize: "13px",
  margin: "5px 0",
};

const contactInfo = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "15px 0",
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
  margin: "0 auto 20px auto",
  display: "block",
  maxWidth: "150px",
  height: "auto",
};

const messageQuoteBox = {
  backgroundColor: "#f9fafb",
  borderLeft: "4px solid #667eea",
  padding: "15px",
  margin: "20px 0",
  borderRadius: "4px",
  fontStyle: "italic" as const,
};

const messageQuoteLabel = {
  fontWeight: "bold",
  color: "#667eea",
  fontSize: "13px",
  margin: "0 0 8px 0",
};

const messageQuote = {
  color: "#4b5563",
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
  fontStyle: "italic" as const,
};
