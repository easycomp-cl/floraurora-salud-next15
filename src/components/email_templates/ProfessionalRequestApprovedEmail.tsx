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

interface ProfessionalRequestApprovedEmailProps {
  professionalName: string;
  verificationLink: string;
}

const LOGO_URL = "https://www.floraurorasalud.cl/logo.png";

export function ProfessionalRequestApprovedEmail({
  professionalName,
  verificationLink,
}: ProfessionalRequestApprovedEmailProps) {
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
            <Heading style={headerTitle}>¡Solicitud Aprobada!</Heading>
            <Text style={headerSubtitle}>FlorAurora Salud</Text>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={greeting}>Estimado/a <strong>{professionalName}</strong>,</Text>
            
            <Section style={messageBox}>
              <Text style={messageText}>
                ¡Excelentes noticias! Tu solicitud para registrarte como profesional en FlorAurora Salud ha sido <strong style={highlight}>aprobada</strong>.
              </Text>
              
              <Text style={messageText}>
                Para completar tu registro y activar tu cuenta, necesitas crear una contraseña. Haz clic en el siguiente botón para continuar:
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationLink}>
                Crear Mi Contraseña
              </Button>
            </Section>

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>O copia y pega este enlace en tu navegador:</strong>
              </Text>
              <Text style={linkText}>{verificationLink}</Text>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Importante:</strong> Este enlace expirará en 24 horas. Si expira, contacta con nuestro equipo de soporte.
              </Text>
            </Section>

            <Text style={messageText}>
              Una vez que hayas creado tu contraseña, podrás acceder a tu cuenta y comenzar a usar la plataforma.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Saludos cordiales,<br />
              <strong>Equipo FlorAurora Salud</strong>
            </Text>
            <Text style={footerSubtext}>
              Si tienes alguna pregunta, no dudes en contactarnos.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ProfessionalRequestApprovedEmail;

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
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
  backgroundColor: "#f0fdf4",
  padding: "20px",
  borderRadius: "8px",
  border: "2px solid #10b981",
  margin: "20px 0",
};

const messageText = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 15px 0",
};

const highlight = {
  color: "#059669",
  fontWeight: "bold",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
};

const infoBox = {
  backgroundColor: "#f9fafb",
  padding: "15px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #e5e7eb",
};

const infoText = {
  color: "#374151",
  fontSize: "13px",
  margin: "0 0 8px 0",
};

const linkText = {
  color: "#10b981",
  fontSize: "12px",
  wordBreak: "break-all" as const,
  margin: "0",
  fontFamily: "monospace",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  padding: "15px",
  borderRadius: "6px",
  margin: "20px 0",
  border: "1px solid #fbbf24",
};

const warningText = {
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

