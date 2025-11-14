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

interface NotificationEmailProps {
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export function NotificationEmail({
  subject,
  message,
  actionUrl,
  actionText,
}: NotificationEmailProps) {
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
            <Heading style={headerTitle}>{subject}</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Section style={messageBox}>
              <Text style={messageText}>{message}</Text>

              {actionUrl && (
                <Section style={buttonContainer}>
                  <Button style={button} href={actionUrl}>
                    {actionText || "Ver más"}
                  </Button>
                </Section>
              )}
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>Equipo de FlorAurora Salud</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default NotificationEmail;

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
  margin: "0",
};

const content = {
  backgroundColor: "#f9fafb",
  padding: "30px",
  borderRadius: "0 0 10px 10px",
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
  whiteSpace: "pre-wrap" as const,
  margin: "0 0 20px 0",
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

const logoStyle = {
  display: "block",
  margin: "0 auto 20px auto",
  maxWidth: "150px",
  height: "auto",
};
