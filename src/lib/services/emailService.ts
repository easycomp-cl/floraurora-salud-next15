import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';
import ContactEmail from '@/components/email_templates/ContactEmail';
import ContactConfirmationEmail from '@/components/email_templates/ContactConfirmationEmail';
import NotificationEmail from '@/components/email_templates/NotificationEmail';
import { createElement } from 'react';

// Configurar la API key de SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/**
 * Mapea el valor del asunto a su nombre completo
 */
function getSubjectDisplayName(subjectValue: string): string {
  const subjectMap: Record<string, string> = {
    consulta: "Consulta General",
    cita: "Agendar Cita",
    soporte: "Soporte Técnico",
    facturacion: "Facturación",
    otro: "Otro",
  };

  return subjectMap[subjectValue] || subjectValue;
}

/**
 * Obtiene la URL del logo para usar en emails
 * Prioriza: LOGO_URL > APP_URL/logo.png > URL por defecto
 */
function getLogoUrl(): string {
  // Opción 1: URL específica del logo
  if (process.env.NEXT_PUBLIC_LOGO_URL) {
    return process.env.NEXT_PUBLIC_LOGO_URL;
  }

  // Opción 2: Construir desde APP_URL
  // En Next.js, los archivos de /public se sirven desde la raíz, así que es /logo.png no /public/logo.png
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://floraurorasalud.cl';
  return `${appUrl}/logo.png`;
}

/**
 * Envía un email usando SendGrid
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL || 'noreply@easycomp.cl',
  replyTo,
  cc,
  bcc,
}: SendEmailParams) {
  try {
    const msg = {
      to,
      from,
      subject,
      html,
      replyTo,
      cc,
      bcc,
    };

    const response = await sgMail.send(msg);
    return { success: true, response };
  } catch (error: unknown) {
    console.error('Error al enviar email:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const sendGridError = error as { response?: { body?: unknown } };
      console.error('Error response:', sendGridError.response?.body);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Error al enviar el email';
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

/**
 * Envía un email de contacto al equipo
 */
export async function sendContactEmail(data: ContactFormData) {
  const subjectDisplayName = getSubjectDisplayName(data.subject);
  const subject = `Contacto Web - ${subjectDisplayName}`;

  // Renderizar la plantilla React Email a HTML usando createElement
  const html = await render(
    createElement(ContactEmail, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      subject: subjectDisplayName,
      message: data.message,
      logoUrl: getLogoUrl(),
    })
  );

  return await sendEmail({
    to: process.env.CONTACT_EMAIL || 'contacto@floraurorasalud.cl',
    from: process.env.FROM_EMAIL || 'noreply@easycomp.cl',
    subject,
    html,
    replyTo: data.email,
  });
}

/**
 * Envía un email de confirmación al usuario que envió el formulario
 */
export async function sendContactConfirmationEmail(data: ContactFormData) {
  const subjectDisplayName = getSubjectDisplayName(data.subject);
  const subject = `Recibimos tu mensaje - FlorAurora Salud (${subjectDisplayName})`;

  // Renderizar la plantilla React Email a HTML
  const html = await render(
    createElement(ContactConfirmationEmail, {
      firstName: data.firstName,
      lastName: data.lastName,
      subject: subjectDisplayName,
      message: data.message,
      logoUrl: getLogoUrl(),
    })
  );

  return await sendEmail({
    to: data.email,
    from: process.env.FROM_EMAIL || 'noreply@easycomp.cl',
    subject,
    html,
  });
}

/**
 * Envía un email de notificación genérico
 */
export async function sendNotificationEmail({
  to,
  subject,
  message,
  actionUrl,
  actionText = 'Ver más',
}: {
  to: string;
  subject: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  // Renderizar la plantilla React Email a HTML
  const html = await render(
    createElement(NotificationEmail, {
      subject,
      message,
      actionUrl,
      actionText,
    })
  );

  return await sendEmail({
    to,
    subject,
    html,
  });
}

