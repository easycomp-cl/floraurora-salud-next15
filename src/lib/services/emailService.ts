import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';
import ContactEmail from '@/components/email_templates/ContactEmail';
import ContactConfirmationEmail from '@/components/email_templates/ContactConfirmationEmail';
import NotificationEmail from '@/components/email_templates/NotificationEmail';
import {
  PatientAppointmentEmail,
  ProfessionalAppointmentEmail,
  PatientAppointmentReminderEmail,
  ProfessionalRequestApprovedEmail,
  ProfessionalRequestRejectedEmail,
  ProfessionalRequestReceivedEmail,
} from "@/components/email_templates";
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getLogoUrl(): string {
  // Opción 1: URL específica del logo
  if (process.env.NEXT_PUBLIC_LOGO_URL) {
    return process.env.NEXT_PUBLIC_LOGO_URL;
  }

  // Opción 2: Construir desde APP_URL
  // En Next.js, los archivos de /public se sirven desde la raíz, así que es /logo.png no /public/logo.png
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.floraurorasalud.cl';
  return `${appUrl}/logo.png`;
}

/**
 * Envía un email usando SendGrid
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl',
  replyTo,
  cc,
  bcc,
}: SendEmailParams) {
  // 🔍 LOGS TEMPORALES PARA DEPURACIÓN
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 [DEBUG] CONFIGURACIÓN DE ENVÍO DE EMAIL');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📤 FROM (remitente):', from);
  console.log('📥 TO (destinatario):', to);
  console.log('📋 SUBJECT (asunto):', subject);
  console.log('↩️  REPLY-TO:', replyTo || '(no configurado)');
  console.log('📎 CC:', cc || '(no configurado)');
  console.log('📎 BCC:', bcc || '(no configurado)');
  console.log('🔑 SENDGRID_API_KEY configurada:', process.env.SENDGRID_API_KEY ? '✅ SÍ' : '❌ NO');
  console.log('🔑 SENDGRID_API_KEY (primeros 10 chars):', process.env.SENDGRID_API_KEY ? `${process.env.SENDGRID_API_KEY.substring(0, 10)}...` : 'N/A');
  console.log('📧 FROM_EMAIL (env var):', process.env.FROM_EMAIL || '(no configurado, usando default)');
  console.log('📧 CONTACT_EMAIL (env var):', process.env.CONTACT_EMAIL || '(no configurado)');
  console.log('📏 Tamaño del HTML:', `${(html.length / 1024).toFixed(2)} KB`);
  
  // ⚠️ Validación de dominio común
  const domainTypoCheck = from.includes('floraaurorasalud');
  if (domainTypoCheck) {
    console.log('⚠️  [ADVERTENCIA] Posible typo detectado: "floraaurorasalud" (doble "a")');
    console.log('⚠️  [ADVERTENCIA] El dominio correcto debería ser: "floraurorasalud.cl" (una sola "a")');
    console.log('⚠️  [ADVERTENCIA] Verifica la variable de entorno FROM_EMAIL');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  
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

    console.log('📤 [DEBUG] Enviando email con SendGrid...');
    const response = await sgMail.send(msg);
    const [sendGridResponse] = response;
    const headers =
      (sendGridResponse?.headers as Record<string, unknown>) ?? {};
    const statusCode = sendGridResponse?.statusCode;
    const messageId =
      (headers["x-message-id"] as string | undefined) ??
      (headers["X-Message-Id"] as string | undefined);

    console.log('✅ [DEBUG] Email enviado exitosamente');
    console.log('📊 [DEBUG] Status Code:', statusCode ?? "desconocido");
    console.log('🆔 [DEBUG] Message ID:', messageId || "N/A");
    console.log('═══════════════════════════════════════════════════════');
    
    console.log(
      `[emailService] Email enviado | to=${to} | subject="${subject}" | status=${statusCode ?? "desconocido"}${
        messageId ? ` | messageId=${messageId}` : ""
      }`
    );

    return { success: true, response };
  } catch (error: unknown) {
    console.error('❌ [DEBUG] Error al enviar email');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error completo:', error);
    
    // Detectar errores específicos de SendGrid
    if (error && typeof error === 'object' && 'response' in error) {
      const sendGridError = error as { 
        code?: number;
        response?: { 
          body?: {
            errors?: Array<{ message?: string; field?: string | null; help?: string | null }>;
          };
        };
      };
      
      console.error('Error response:', sendGridError.response?.body);
      
      // Detectar errores específicos de SendGrid
      const errors = sendGridError.response?.body?.errors;
      if (errors && errors.length > 0) {
        const firstError = errors[0];
        
        // Detectar error de créditos excedidos
        if (firstError.message?.includes('Maximum credits exceeded') || 
            firstError.message?.includes('credits') ||
            sendGridError.code === 401) {
          return {
            success: false,
            error: 'Límite de créditos de email excedido. Por favor, contacta al administrador del sistema.',
            errorCode: 'CREDITS_EXCEEDED',
            errorDetails: firstError.message
          };
        }
        
        // Detectar error de Sender Identity no verificada
        if (firstError.message?.includes('Sender Identity') || 
            firstError.message?.includes('does not match a verified') ||
            firstError.field === 'from' ||
            sendGridError.code === 403) {
          const fromAddress = from || process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl';
          return {
            success: false,
            error: `La dirección de correo "${fromAddress}" no está verificada en SendGrid. Por favor, verifica la identidad del remitente en SendGrid.`,
            errorCode: 'SENDER_IDENTITY_NOT_VERIFIED',
            errorDetails: firstError.message,
            helpUrl: 'https://sendgrid.com/docs/for-developers/sending-email/sender-identity/'
          };
        }
      }
    }
    
    console.error('═══════════════════════════════════════════════════════');
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
    })
  );

  return await sendEmail({
    to: process.env.CONTACT_EMAIL || 'contacto@floraurorasalud.cl',
    from: process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl',
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
    })
  );

  return await sendEmail({
    to: data.email,
    from: process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl',
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

interface PatientAppointmentEmailParams {
  to: string;
  patientName: string;
  professionalName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  price: string;
  meetLink?: string;
  supportEmail: string;
  supportPhone?: string;
  hoursUntilAppointment?: number; // Horas hasta la cita (para determinar el mensaje apropiado)
}

export async function sendPatientAppointmentEmail(
  data: PatientAppointmentEmailParams
) {
  const html = await render(
    createElement(PatientAppointmentEmail, {
      patientName: data.patientName,
      professionalName: data.professionalName,
      serviceName: data.serviceName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      price: data.price,
      meetLink: data.meetLink,
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
      hoursUntilAppointment: data.hoursUntilAppointment,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Cita confirmada",
    html,
  });
}

interface ProfessionalAppointmentEmailParams {
  to: string;
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

export async function sendProfessionalAppointmentEmail(
  data: ProfessionalAppointmentEmailParams
) {
  const html = await render(
    createElement(ProfessionalAppointmentEmail, {
      professionalName: data.professionalName,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      serviceName: data.serviceName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      price: data.price,
      meetLink: data.meetLink,
      notes: data.notes,
      supportEmail: data.supportEmail,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Nueva cita asignada",
    html,
  });
}

// Email para solicitud profesional recibida
interface ProfessionalRequestReceivedEmailParams {
  to: string;
  professionalName: string;
}

export async function sendProfessionalRequestReceivedEmail(
  data: ProfessionalRequestReceivedEmailParams
) {
  const html = await render(
    createElement(ProfessionalRequestReceivedEmail, {
      professionalName: data.professionalName,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Solicitud de registro recibida",
    html,
  });
}

// Email para solicitud aprobada
interface ProfessionalRequestApprovedEmailParams {
  to: string;
  professionalName: string;
  verificationLink: string;
}

export async function sendProfessionalRequestApprovedEmail(
  data: ProfessionalRequestApprovedEmailParams
) {
  const html = await render(
    createElement(ProfessionalRequestApprovedEmail, {
      professionalName: data.professionalName,
      verificationLink: data.verificationLink,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Tu solicitud ha sido aprobada",
    html,
  });
}

// Email para solicitud rechazada
interface ProfessionalRequestRejectedEmailParams {
  to: string;
  professionalName: string;
  rejectionReason: string;
}

export async function sendProfessionalRequestRejectedEmail(
  data: ProfessionalRequestRejectedEmailParams
) {
  const resubmitUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signup-pro`;
  
  const html = await render(
    createElement(ProfessionalRequestRejectedEmail, {
      professionalName: data.professionalName,
      rejectionReason: data.rejectionReason,
      resubmitUrl,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Actualización sobre tu solicitud",
    html,
  });
}

interface PatientAppointmentReminderEmailParams {
  to: string;
  patientName: string;
  professionalName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  meetLink: string;
  supportEmail: string;
  supportPhone?: string;
}

export async function sendPatientAppointmentReminderEmail(
  data: PatientAppointmentReminderEmailParams
) {
  const html = await render(
    createElement(PatientAppointmentReminderEmail, {
      patientName: data.patientName,
      professionalName: data.professionalName,
      serviceName: data.serviceName,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      meetLink: data.meetLink,
      supportEmail: data.supportEmail,
      supportPhone: data.supportPhone,
    })
  );

  return await sendEmail({
    to: data.to,
    subject: "FlorAurora Salud | Recordatorio de cita",
    html,
  });
}

/**
 * Envía notificación al correo de contacto cuando se registra un nuevo paciente
 */
interface PatientRegistrationNotificationParams {
  patientName: string;
  patientEmail: string;
  patientPhone?: string | null;
}

export async function sendPatientRegistrationNotification(
  data: PatientRegistrationNotificationParams
) {
  const subject = "Nuevo registro de paciente - FlorAurora Salud";
  
  const message = `
    Se ha registrado un nuevo paciente en la plataforma:
    
    Nombre: ${data.patientName}
    Email: ${data.patientEmail}
    ${data.patientPhone ? `Teléfono: ${data.patientPhone}` : ''}
    
    Fecha de registro: ${new Date().toLocaleString('es-CL', { 
      timeZone: 'America/Santiago',
      dateStyle: 'long',
      timeStyle: 'short'
    })}
  `;

  const html = await render(
    createElement(NotificationEmail, {
      subject,
      message,
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/users`,
      actionText: 'Ver usuarios',
    })
  );

  return await sendEmail({
    to: process.env.CONTACT_EMAIL || 'contacto@floraurorasalud.cl',
    from: process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl',
    subject,
    html,
    replyTo: data.patientEmail,
  });
}

/**
 * Envía notificación al correo de contacto cuando se registra una nueva solicitud de profesional
 */
interface ProfessionalRegistrationNotificationParams {
  professionalName: string;
  professionalEmail: string;
  professionalPhone?: string | null;
  rut?: string | null;
}

export async function sendProfessionalRegistrationNotification(
  data: ProfessionalRegistrationNotificationParams
) {
  const subject = "Nueva solicitud de registro profesional - FlorAurora Salud";
  
  const message = `
    Se ha recibido una nueva solicitud de registro profesional:
    
    Nombre: ${data.professionalName}
    Email: ${data.professionalEmail}
    ${data.professionalPhone ? `Teléfono: ${data.professionalPhone}` : ''}
    ${data.rut ? `RUT: ${data.rut}` : ''}
    
    Fecha de solicitud: ${new Date().toLocaleString('es-CL', { 
      timeZone: 'America/Santiago',
      dateStyle: 'long',
      timeStyle: 'short'
    })}
    
    Por favor, revisa la solicitud en el panel de administración.
  `;

  const html = await render(
    createElement(NotificationEmail, {
      subject,
      message,
      actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/professionals`,
      actionText: 'Revisar solicitudes',
    })
  );

  return await sendEmail({
    to: process.env.CONTACT_EMAIL || 'contacto@floraurorasalud.cl',
    from: process.env.FROM_EMAIL || 'noreply@floraurorasalud.cl',
    subject,
    html,
    replyTo: data.professionalEmail,
  });
}

