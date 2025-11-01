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

interface ContactEmailProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  logoUrl?: string;
}

export function ContactEmail({
  firstName,
  lastName,
  email,
  phone,
  subject,
  message,
  logoUrl,
}: ContactEmailProps) {
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
            <Heading style={headerTitle}>📧 Nuevo Mensaje de Contacto</Heading>
            <Text style={headerSubtitle}>FlorAurora Salud</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Section style={infoRow}>
              <Text style={label}>👤 Nombre Completo</Text>
              <Text style={value}>
                {firstName} {lastName}
              </Text>
            </Section>

            <Section style={infoRow}>
              <Text style={label}>📧 Email</Text>
              <Text style={value}>{email}</Text>
            </Section>

            <Section style={infoRow}>
              <Text style={label}>📱 Teléfono</Text>
              <Text style={value}>{phone}</Text>
            </Section>

            <Section style={infoRow}>
              <Text style={label}>📌 Asunto</Text>
              <Text style={value}>{subject}</Text>
            </Section>

            {/* Message Box */}
            <Section style={messageBox}>
              <Text style={label}>💬 Mensaje</Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este mensaje fue enviado desde el formulario de contacto de
              FlorAurora Salud
            </Text>
            <Text style={footerText}>Responde a: {email}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactEmail;

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

const infoRow = {
  margin: "15px 0",
  padding: "10px",
  backgroundColor: "#ffffff",
  borderLeft: "4px solid #667eea",
};

const label = {
  fontWeight: "bold",
  color: "#667eea",
  fontSize: "14px",
  margin: "0 0 5px 0",
};

const value = {
  color: "#333333",
  fontSize: "14px",
  margin: "0",
};

const messageBox = {
  backgroundColor: "#ffffff",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  marginTop: "20px",
};

const messageText = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
  margin: "0",
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

const logoStyle = {
  display: "block",
  margin: "0 auto 20px auto",
};
