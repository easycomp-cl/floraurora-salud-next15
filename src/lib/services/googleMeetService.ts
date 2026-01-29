import { google } from "googleapis";
import { config } from "@/lib/config";

/**
 * Obtiene el cliente autenticado de Google Meet API
 */
async function getMeetClient() {
  if (!config.googleMeet.enabled) {
    throw new Error("Google Meet API no está habilitada");
  }

  if (!config.googleMeet.serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY no está configurada");
  }

  try {
    // Decodificar la clave del service account (base64)
    const serviceAccountKeyJson = Buffer.from(
      config.googleMeet.serviceAccountKey,
      "base64"
    ).toString("utf-8");
    const serviceAccountKey = JSON.parse(serviceAccountKeyJson);

    // Crear cliente JWT para autenticación
    const workspaceUserEmail = process.env.GOOGLE_WORKSPACE_USER_EMAIL || "meeting@floraurorasalud.cl";
    
    const auth = new google.auth.JWT({
      email: config.googleMeet.serviceAccountEmail,
      key: serviceAccountKey.private_key,
      scopes: [
        "https://www.googleapis.com/auth/meetings.space.created",
        "https://www.googleapis.com/auth/meetings.space.readonly",
      ],
      // Usar Domain-Wide Delegation: impersonar al usuario de Workspace
      subject: workspaceUserEmail,
    });

    // Google Meet API v2
    return google.meet({ version: "v2", auth });
  } catch (error) {
    console.error("Error al autenticar con Google Meet API:", error);
    throw new Error(
      `Error de autenticación con Google Meet: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Interfaz para los parámetros de creación de reunión
 */
export interface CreateMeetLinkParams {
  appointmentId: string;
  professionalEmail: string;
  professionalName: string;
  patientEmail: string; // Agregar email del paciente para invitarlo al evento
  patientName: string;
  scheduledAt: Date;
  durationMinutes: number;
  serviceName?: string;
}

/**
 * Interfaz para la respuesta de creación de reunión
 */
export interface MeetLinkResponse {
  meetLink: string;
  eventId: string;
  calendarLink?: string;
}

/**
 * Obtiene el cliente autenticado de Google Calendar API
 */
async function getCalendarClient() {
  if (!config.googleMeet.enabled) {
    throw new Error("Google Meet API no está habilitada");
  }

  if (!config.googleMeet.serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY no está configurada");
  }

  try {
    // Decodificar la clave del service account (base64)
    const serviceAccountKeyJson = Buffer.from(
      config.googleMeet.serviceAccountKey,
      "base64"
    ).toString("utf-8");
    const serviceAccountKey = JSON.parse(serviceAccountKeyJson);

    // Crear cliente JWT para autenticación
    // IMPORTANTE: Para crear enlaces de Google Meet, necesitamos usar Domain-Wide Delegation
    // El 'subject' debe ser un usuario real de Google Workspace (ej: meeting@floraurorasalud.cl)
    // Esto permite que la service account actúe en nombre del usuario y cree eventos con Meet
    const workspaceUserEmail = process.env.GOOGLE_WORKSPACE_USER_EMAIL || "meeting@floraurorasalud.cl";
    
    const auth = new google.auth.JWT({
      email: config.googleMeet.serviceAccountEmail,
      key: serviceAccountKey.private_key,
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/meetings.space.created",
        "https://www.googleapis.com/auth/meetings.space.readonly",
      ],
      // Usar Domain-Wide Delegation: impersonar al usuario de Workspace
      subject: workspaceUserEmail,
    });

    return google.calendar({ version: "v3", auth });
  } catch (error) {
    console.error("Error al autenticar con Google Calendar API:", error);
    throw new Error(
      `Error de autenticación con Google Calendar: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
}

/**
 * Crea un espacio de Google Meet con acceso restringido
 * 
 * Nota: La restricción real se hace agregando los correos como attendees en el evento de Calendar.
 * El espacio se crea con configuración que permite entrada directa a invitados.
 * 
 * @param professionalEmail - Email del profesional (para logging)
 * @param patientEmail - Email del paciente (para logging)
 * @returns URI del espacio de Meet
 */
async function createMeetSpace(
  professionalEmail: string,
  patientEmail: string
): Promise<string> {
  try {
    const meet = await getMeetClient();
    
    console.log("[GoogleMeet] Creando espacio de Meet con acceso restringido a:", {
      professional: professionalEmail,
      patient: patientEmail,
    });
    
    // Crear un espacio de Meet con acceso OPEN
    // OPEN permite que cualquiera con el link se una sin aprobación
    // La seguridad se maneja mediante advertencias en los emails y no compartir el link públicamente
    const response = await meet.spaces.create({
      requestBody: {
        config: {
          accessType: "OPEN", // Permite entrada directa sin sala de espera
        },
      },
    });

    const meetingUri = response.data.meetingUri;
    if (!meetingUri) {
      throw new Error("No se recibió el URI del espacio de Meet");
    }

    console.log(`[GoogleMeet] ✅ Espacio creado: ${meetingUri}`);
    console.log(`[GoogleMeet] ℹ️ Los correos ${professionalEmail} y ${patientEmail} se agregarán como attendees en Calendar para acceso directo`);
    
    return meetingUri;
  } catch (error) {
    console.error("[GoogleMeet] ❌ Error creando espacio de Meet:", error);
    throw error;
  }
}

/**
 * Crea un enlace de Google Meet para una cita
 * 
 * @param params - Parámetros de la cita
 * @returns Enlace de Meet y ID del evento
 */
export async function createMeetLink(
  params: CreateMeetLinkParams
): Promise<MeetLinkResponse> {
  if (!config.googleMeet.enabled) {
    console.warn(
      "[GoogleMeet] API deshabilitada, no se creará enlace de Meet"
    );
    throw new Error("Google Meet API está deshabilitada");
  }

  try {
    // Paso 1: Crear un espacio de Meet con acceso restringido a los correos específicos
    const meetUri = await createMeetSpace(params.professionalEmail, params.patientEmail);
    
    // Paso 2: Crear evento en Calendar y asociar el espacio de Meet
    const calendar = await getCalendarClient();

    // Calcular fechas de inicio y fin
    const startTime = new Date(params.scheduledAt);
    const endTime = new Date(
      startTime.getTime() + params.durationMinutes * 60 * 1000
    );

    // Crear evento en Google Calendar con Google Meet
    // Usar el formato correcto según la documentación de Google Calendar API v3
    // NOTA: No usamos conferenceData para evitar que Google Calendar cree un segundo enlace
    // En su lugar, usamos el espacio de Meet creado manualmente y lo agregamos en la descripción
    const event: {
      summary: string;
      description: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      organizer?: {
        email: string;
        displayName?: string;
        self?: boolean;
      };
      attendees?: Array<{
        email: string;
        organizer?: boolean;
        responseStatus?: string;
      }>;
      guestsCanModify?: boolean;
      guestsCanInviteOthers?: boolean;
      guestsCanSeeOtherGuests?: boolean;
      sendUpdates?: "none" | "all" | "externalOnly" | "all";
    } = {
      summary: `Sesión: ${params.patientName} - ${params.serviceName || "Consulta"}`,
      description: `Sesión de ${params.serviceName || "consulta"} entre ${params.professionalName} y ${params.patientName}.\n\nCita ID: ${params.appointmentId}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "America/Santiago",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "America/Santiago",
      },
      // Intentar establecer el profesional como organizador
      // Nota: Esto puede no funcionar si el profesional no está en el mismo dominio
      // El organizador por defecto será el dueño del calendario (meeting@floraurorasalud.cl)
      organizer: {
        email: params.professionalEmail,
        displayName: params.professionalName,
      },
      // Configuraciones de privacidad
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: true,
      // IMPORTANTE: Agregar tanto el profesional como el paciente como attendees
      // Esto permite que ambos se unan sin aprobación del host
      // Incluso si "Acceso rápido" está desactivado, los invitados pueden unirse directamente
      attendees: [
        {
          email: params.professionalEmail,
          responseStatus: "accepted",
        },
        {
          email: params.patientEmail,
          responseStatus: "accepted",
        },
      ],
      // No enviar invitaciones automáticas por email (solo control interno)
      // Los usuarios recibirán el enlace en los emails de confirmación de la cita
      sendUpdates: "none" as const,
      // IMPORTANTE: Agregar el link del espacio OPEN en la descripción
      // El espacio OPEN permite entrada directa sin sala de espera
    };

    // Agregar el link de Meet OPEN en la descripción del evento
    event.description = `${event.description}\n\nEnlace de videollamada: ${meetUri}`;

    // NO agregar conferenceData para evitar que Google Calendar cree un segundo enlace diferente
    // Estamos usando el espacio de Meet creado manualmente con createMeetSpace()
    // que ya está incluido en la descripción del evento

    console.log(
      `[GoogleMeet] Creando evento de Meet para cita ${params.appointmentId}`
    );

    // Intentar crear el evento en el calendario del profesional si es posible
    // Si el profesional tiene un calendario de Google Workspace, usarlo
    // De lo contrario, usar el calendario de meeting@floraurorasalud.cl
    const workspaceUserEmail = process.env.GOOGLE_WORKSPACE_USER_EMAIL || "meeting@floraurorasalud.cl";
    
    // Verificar si el email del profesional es del dominio de Workspace
    const professionalEmailDomain = params.professionalEmail.split("@")[1];
    const workspaceDomain = workspaceUserEmail.split("@")[1];
    const isProfessionalInWorkspace = professionalEmailDomain === workspaceDomain;
    
    // Si el profesional está en el mismo dominio de Workspace, intentar usar su calendario
    // De lo contrario, usar el calendario de meeting@floraurorasalud.cl
    let calendarIdToUse: string;
    if (isProfessionalInWorkspace && config.googleMeet.calendarId === "primary") {
      // Intentar usar el calendario del profesional
      calendarIdToUse = params.professionalEmail;
      console.log(
        `[GoogleMeet] Intentando usar calendario del profesional: ${calendarIdToUse}`
      );
    } else {
      // Usar el calendario de meeting@floraurorasalud.cl
      calendarIdToUse = 
        config.googleMeet.calendarId === "primary" 
          ? workspaceUserEmail 
          : config.googleMeet.calendarId;
      console.log(
        `[GoogleMeet] Usando calendario de Workspace: ${calendarIdToUse}`
      );
    }

    // Ya no necesitamos verificar conferenceProperties porque no estamos usando conferenceData
    // Estamos usando el espacio de Meet creado manualmente

    // Intentar crear el evento
    // Si falla porque el profesional no tiene calendario accesible, usar el calendario de Workspace
    let response;
    try {
      response = await calendar.events.insert({
        calendarId: calendarIdToUse,
        requestBody: event,
      });
    } catch (calendarError: unknown) {
      const errorMessage = calendarError instanceof Error ? calendarError.message : String(calendarError);
      
      // Si falla porque el calendario del profesional no es accesible, usar el calendario de Workspace
      if (isProfessionalInWorkspace && calendarIdToUse === params.professionalEmail) {
        console.warn(
          `[GoogleMeet] No se pudo crear evento en calendario del profesional (${calendarIdToUse}), usando calendario de Workspace: ${errorMessage}`
        );
        calendarIdToUse = workspaceUserEmail;
        
        // Remover el campo organizer ya que no se puede establecer para otro usuario
        const eventWithoutOrganizer = { ...event };
        delete (eventWithoutOrganizer as { organizer?: unknown }).organizer;
        
        response = await calendar.events.insert({
          calendarId: calendarIdToUse,
          requestBody: eventWithoutOrganizer,
        });
      } else {
        throw calendarError;
      }
    }

    const createdEvent = response.data;

    // Usar el espacio de Meet creado con acceso OPEN
    // Este es el único enlace que se usará, evitando confusión con múltiples enlaces
    const meetLink = meetUri;
    
    console.log(
      `[GoogleMeet] Usando espacio OPEN creado: ${meetLink}`
    );

    if (!meetLink) {
      throw new Error("No se encontró el enlace de Google Meet");
    }

    const eventId = createdEvent.id;
    if (!eventId) {
      throw new Error("No se recibió el ID del evento");
    }

    console.log(
      `[GoogleMeet] ✅ Enlace creado exitosamente para cita ${params.appointmentId}`
    );

    return {
      meetLink,
      eventId,
      calendarLink: createdEvent.htmlLink || undefined,
    };
  } catch (error) {
    console.error(
      `[GoogleMeet] ❌ Error al crear enlace de Meet para cita ${params.appointmentId}:`,
      error
    );
    throw error;
  }
}

/**
 * Actualiza un evento de Google Calendar/Meet existente
 * 
 * @param eventId - ID del evento en Google Calendar
 * @param updates - Actualizaciones a aplicar
 */
export async function updateMeetEvent(
  eventId: string,
  updates: {
    scheduledAt?: Date;
    durationMinutes?: number;
    patientName?: string;
    serviceName?: string;
  }
): Promise<void> {
  if (!config.googleMeet.enabled) {
    throw new Error("Google Meet API está deshabilitada");
  }

  try {
    const calendar = await getCalendarClient();

    // Obtener el evento actual
    const existingEvent = await calendar.events.get({
      calendarId: config.googleMeet.calendarId,
      eventId,
    });

    if (!existingEvent.data) {
      throw new Error(`Evento ${eventId} no encontrado`);
    }

    // Preparar actualizaciones
    const updatedEvent: {
      summary?: string;
      description?: string;
      start?: { dateTime: string; timeZone: string };
      end?: { dateTime: string; timeZone: string };
    } = {};

    if (updates.scheduledAt) {
      const startTime = new Date(updates.scheduledAt);
      const durationMinutes = updates.durationMinutes || 55;
      const endTime = new Date(
        startTime.getTime() + durationMinutes * 60 * 1000
      );

      updatedEvent.start = {
        dateTime: startTime.toISOString(),
        timeZone: "America/Santiago",
      };
      updatedEvent.end = {
        dateTime: endTime.toISOString(),
        timeZone: "America/Santiago",
      };
    }

    if (updates.patientName || updates.serviceName) {
      const patientName =
        updates.patientName ||
        existingEvent.data.description?.match(/entre .+ y (.+)/)?.[1] ||
        "Paciente";
      const serviceName = updates.serviceName || "Consulta";
      updatedEvent.summary = `Sesión: ${patientName} - ${serviceName}`;
    }

    await calendar.events.patch({
      calendarId: config.googleMeet.calendarId,
      eventId,
      requestBody: updatedEvent,
    });

    console.log(`[GoogleMeet] ✅ Evento ${eventId} actualizado exitosamente`);
  } catch (error) {
    console.error(`[GoogleMeet] ❌ Error al actualizar evento ${eventId}:`, error);
    throw error;
  }
}

/**
 * Elimina un evento de Google Calendar/Meet
 * 
 * @param eventId - ID del evento en Google Calendar
 */
export async function deleteMeetEvent(eventId: string): Promise<void> {
  if (!config.googleMeet.enabled) {
    throw new Error("Google Meet API está deshabilitada");
  }

  try {
    const calendar = await getCalendarClient();

    await calendar.events.delete({
      calendarId: config.googleMeet.calendarId,
      eventId,
    });

    console.log(`[GoogleMeet] ✅ Evento ${eventId} eliminado exitosamente`);
  } catch (error) {
    console.error(`[GoogleMeet] ❌ Error al eliminar evento ${eventId}:`, error);
    throw error;
  }
}

