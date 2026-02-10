import { createAdminServer } from "@/utils/supabase/server";
import { getSiteUrl } from "@/lib/utils/url";

export interface ProfessionalRequest {
  id: number;
  user_id: string | null; // Puede ser null hasta que se apruebe la solicitud
  full_name: string;
  rut: string;
  birth_date: string | null;
  email: string;
  phone_number: string | null;
  university: string;
  profession: string | null;
  study_year_start: string | null;
  study_year_end: string | null;
  extra_studies: string | null;
  superintendence_number: string;
  degree_copy_url: string | null;
  id_copy_url: string | null;
  professional_certificate_url: string | null;
  additional_certificates_urls: string | null; // JSON array de URLs
  region_id?: number | null;
  municipality_id?: number | null;
  plan_type?: "commission" | "monthly" | null;
  status: "pending" | "approved" | "rejected" | "resubmitted";
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalRequestListResponse {
  data: ProfessionalRequest[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 20;

export const professionalRequestsService = {
  /**
   * Listar todas las solicitudes profesionales con filtros y paginación
   */
  async listRequests(filters?: {
    status?: "pending" | "approved" | "rejected" | "resubmitted" | "all";
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<ProfessionalRequestListResponse> {
    const supabase = createAdminServer();
    const page = Math.max(filters?.page ?? 1, 1);
    const pageSize = Math.min(filters?.pageSize ?? DEFAULT_PAGE_SIZE, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("professional_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filtro por estado
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    // Filtro de búsqueda
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,rut.ilike.%${search}%,university.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(
        `Error al listar solicitudes: ${error.message} (${error.details ?? "sin detalles"})`
      );
    }

    return {
      data: (data ?? []) as ProfessionalRequest[],
      total: count ?? 0,
    };
  },

  /**
   * Obtener una solicitud por ID
   */
  async getRequestById(id: number): Promise<ProfessionalRequest | null> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("professional_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // No encontrado
      }
      throw new Error(
        `Error al obtener solicitud: ${error.message} (${error.details ?? "sin detalles"})`
      );
    }

    return data as ProfessionalRequest;
  },

  /**
   * Aprobar una solicitud profesional
   * Ahora crea el usuario profesional cuando se aprueba la solicitud
   */
  async approveRequest(
    requestId: number,
    adminUserId: number
  ): Promise<{ success: boolean; verificationLink: string }> {
    const supabase = createAdminServer();
    const admin = createAdminServer();

    // 1. Obtener la solicitud
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "pending" && request.status !== "resubmitted") {
      throw new Error("Solo se pueden aprobar solicitudes pendientes o reenviadas");
    }

    // 2. Verificar si el usuario ya existe (puede existir si fue creado antes)
    let userId = request.user_id;
    let userExists = false;

    if (userId) {
      // Verificar si el usuario existe en auth.users
      try {
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        if (authUser?.user) {
          userExists = true;
        } else {
          // Si no existe en auth, necesitamos crearlo
          userExists = false;
          userId = null; // Resetear para crear uno nuevo
        }
      } catch (error) {
        // Usuario no existe en auth, necesitamos crearlo
        console.log("Usuario no encontrado en auth, se creará uno nuevo:", error);
        userExists = false;
        userId = null; // Resetear para crear uno nuevo
      }
    }

    // 3. Si el usuario no existe, crearlo ahora
    if (!userExists) {
      // Extraer nombre y apellidos del full_name
      const nameParts = request.full_name.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      const last_name = nameParts.slice(1).join(" ") || "";

      // Generar contraseña temporal (el usuario la cambiará después)
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 15)}!${Math.random().toString(36).slice(2, 8)}`;

      // Crear usuario en auth.users
      const { data: signUpData, error: signUpError } = await admin.auth.admin.createUser({
        email: request.email,
        password: tempPassword,
        email_confirm: false, // No confirmado hasta que establezca contraseña
        user_metadata: {
          full_name: request.full_name,
          email: request.email,
          role: "professional",
        },
      });

      if (signUpError || !signUpData.user) {
        throw new Error(`Error al crear usuario en auth: ${signUpError?.message ?? "sin detalles"}`);
      }

      userId = signUpData.user.id;

      // Crear registro en public.users con role=3 (profesional) y estado activo
      const userInsertPayload: Record<string, unknown> = {
        user_id: userId,
        email: request.email,
        name: first_name,
        last_name: last_name,
        role: 3, // Profesional
        is_active: true, // Activo desde la aprobación
        phone_number: request.phone_number,
        rut: request.rut,
      };
      if (request.region_id) userInsertPayload.region = request.region_id;
      if (request.municipality_id) userInsertPayload.municipality = request.municipality_id;

      const { data: userRecord, error: userInsertError } = await admin.from("users").insert(userInsertPayload).select("id").single();

      if (userInsertError || !userRecord) {
        console.error("Error al crear usuario en public.users:", userInsertError);
        // Intentar eliminar el usuario de auth si falla la inserción
        await admin.auth.admin.deleteUser(userId);
        throw new Error(`Error al crear usuario en public.users: ${userInsertError?.message ?? "sin detalles"}`);
      }

      const userNumericId = userRecord.id;

      // Buscar el title_id basado en el campo profession de la solicitud
      let titleId: number | null = null;
      if (request.profession) {
        const { data: titleData, error: titleError } = await admin
          .from("professional_titles")
          .select("id")
          .eq("title_name", request.profession)
          .eq("is_active", true)
          .maybeSingle();
        
        if (!titleError && titleData) {
          titleId = Number(titleData.id);
        } else {
          console.warn(`No se encontró título profesional con nombre "${request.profession}"`);
        }
      }

      // Crear registro en public.professionals con is_active=false
      // Usar plan_type de la solicitud si está definido (commission o monthly)
      const requestPlanType = request.plan_type ?? null;

      const { error: professionalInsertError } = await admin.from("professionals").insert({
        id: userNumericId, // Mismo id que users.id (no user_id que es UUID)
        title_id: titleId,
        profile_description: null,
        resume_url: null,
        is_active: false, // Inactivo hasta que se configure el plan y se realice el pago
        plan_type: requestPlanType, // Usar el plan seleccionado en el registro
        last_monthly_payment_date: null,
        monthly_plan_expires_at: null,
      });

      if (professionalInsertError) {
        // Si el error es que ya existe (código 23505), está bien (puede haber sido creado antes)
        if (professionalInsertError.code !== "23505") {
          console.error("Error al crear registro en professionals:", professionalInsertError);
          // No fallar la operación completa, solo loguear el error
          // El profesional puede ser creado manualmente después si es necesario
        } else {
          console.log("Registro en professionals ya existe, actualizando...");
          // Si ya existe, actualizar con los nuevos valores
          const requestPlanType = request.plan_type ?? null;
          const { error: updateError } = await admin
            .from("professionals")
            .update({
              title_id: titleId,
              is_active: false, // Asegurar que esté inactivo
              plan_type: requestPlanType, // Usar el plan de la solicitud
            })
            .eq("id", userNumericId);
          
          if (updateError) {
            console.error("Error al actualizar registro en professionals:", updateError);
          }
        }
      } else {
        console.log("✅ Registro en professionals creado exitosamente:", {
          id: userNumericId,
          title_id: titleId,
          is_active: false,
        });
      }

      // Actualizar la solicitud con el user_id creado y el estado aprobado en una sola operación
      const { error: requestUpdateError, data: updatedRequest } = await supabase
        .from("professional_requests")
        .update({
          user_id: userId,
          status: "approved",
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (requestUpdateError) {
        console.error("Error al actualizar solicitud con user_id y estado:", requestUpdateError);
        throw new Error(`Error al aprobar solicitud: ${requestUpdateError.message}`);
      }

      // Verificar que la solicitud fue actualizada correctamente
      if (!updatedRequest) {
        console.error("La solicitud no fue encontrada después de la actualización");
        throw new Error("Error: La solicitud no fue encontrada después de la actualización");
      }

      console.log("✅ Solicitud actualizada correctamente:", {
        id: updatedRequest.id,
        status: updatedRequest.status,
        user_id: updatedRequest.user_id,
      });
    } else {
      // Si el usuario ya existe, activarlo y actualizar región/comuna si vienen en la solicitud
      const userUpdatePayload: { is_active: boolean; region?: number; municipality?: number } = {
        is_active: true,
      };
      if (request.region_id) userUpdatePayload.region = request.region_id;
      if (request.municipality_id) userUpdatePayload.municipality = request.municipality_id;

      const { error: userUpdateError } = await supabase
        .from("users")
        .update(userUpdatePayload)
        .eq("user_id", userId);

      if (userUpdateError) {
        console.error("Error al activar usuario:", userUpdateError);
        // No lanzar error, solo loguear
      }

      // Verificar si existe registro en professionals, si no, crearlo
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existingUser) {
        const userNumericId = existingUser.id;

        // Verificar si existe registro en professionals
        const { data: existingProfessional } = await supabase
          .from("professionals")
          .select("id")
          .eq("id", userNumericId)
          .maybeSingle();

        if (!existingProfessional) {
          // Buscar el title_id basado en el campo profession de la solicitud
          let titleId: number | null = null;
          if (request.profession) {
            const { data: titleData, error: titleError } = await supabase
              .from("professional_titles")
              .select("id")
              .eq("title_name", request.profession)
              .eq("is_active", true)
              .maybeSingle();
            
            if (!titleError && titleData) {
              titleId = Number(titleData.id);
            }
          }

          // Crear registro en professionals si no existe (usar plan_type de la solicitud)
          const requestPlanType = request.plan_type ?? null;
          const { error: professionalInsertError } = await supabase.from("professionals").insert({
            id: userNumericId,
            title_id: titleId,
            profile_description: null,
            resume_url: null,
            is_active: false, // Inactivo hasta que se configure el plan y se realice el pago
            plan_type: requestPlanType,
            last_monthly_payment_date: null,
            monthly_plan_expires_at: null,
          });

          if (professionalInsertError && professionalInsertError.code !== "23505") {
            console.error("Error al crear registro en professionals:", professionalInsertError);
          } else {
            console.log("✅ Registro en professionals creado/actualizado:", {
              id: userNumericId,
              title_id: titleId,
              is_active: false,
            });
          }
        } else {
          // Si ya existe, asegurar que is_active sea false y actualizar title_id y plan_type si es necesario
          const updateData: { is_active: boolean; title_id?: number | null; plan_type?: "commission" | "monthly" | null } = {
            is_active: false, // Asegurar que esté inactivo hasta el pago
          };
          if (request.plan_type) updateData.plan_type = request.plan_type;

          // Actualizar title_id si tenemos el profession en la solicitud
          if (request.profession) {
            const { data: titleData, error: titleError } = await supabase
              .from("professional_titles")
              .select("id")
              .eq("title_name", request.profession)
              .eq("is_active", true)
              .maybeSingle();
            
            if (!titleError && titleData) {
              updateData.title_id = Number(titleData.id);
            }
          }

          const { error: updateError } = await supabase
            .from("professionals")
            .update(updateData)
            .eq("id", userNumericId);
          
          if (updateError) {
            console.error("Error al actualizar is_active en professionals:", updateError);
          } else {
            console.log("✅ Registro en professionals actualizado:", {
              id: userNumericId,
              ...updateData,
            });
          }
        }
      }

      // Actualizar el estado de la solicitud (el user_id ya existe)
      const { error: updateError, data: updatedRequest } = await supabase
        .from("professional_requests")
        .update({
          status: "approved",
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error al aprobar solicitud: ${updateError.message}`);
      }

      // Verificar que la solicitud fue actualizada correctamente
      if (!updatedRequest) {
        console.error("La solicitud no fue encontrada después de la actualización");
        throw new Error("Error: La solicitud no fue encontrada después de la actualización");
      }

      console.log("✅ Solicitud actualizada correctamente:", {
        id: updatedRequest.id,
        status: updatedRequest.status,
        user_id: updatedRequest.user_id,
      });
    }

    // 5. Generar enlace de creación de contraseña (recovery link que permite establecer contraseña)
    // Usar el flujo existente de reset-password que ya maneja correctamente los tokens
    // 
    // NOTA SOBRE EXPIRACIÓN:
    // Los enlaces de recuperación de Supabase expiran según la configuración del proyecto en Supabase Dashboard.
    // Por defecto: 60 minutos (1 hora). Para cambiar este tiempo:
    // 1. Ve a Supabase Dashboard > Authentication > Settings
    // 2. Busca "Mailer OTP Expiration" o "OTP Expiry"
    // 3. Configura el tiempo en segundos (ej: 7200 = 2 horas, 14400 = 4 horas)
    // 4. Guarda los cambios
    // 
    // Ver SUPABASE_LINK_EXPIRATION_CONFIG.md para más detalles
    const baseUrl = getSiteUrl();
    
    // Asegurarse de que la URL no tenga localhost en producción/staging
    // Priorizar variables de entorno explícitas sobre la detección automática
    let finalBaseUrl = baseUrl;
    
    // Si detectamos localhost pero hay variables de entorno configuradas, usarlas
    if (baseUrl.includes("localhost")) {
      if (process.env.NEXT_PUBLIC_STAGING_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_STAGING_URL;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
      }
    }
    
    console.log("🔗 Generando link de recuperación:", {
      baseUrlDetectado: baseUrl,
      finalBaseUrl,
      NEXT_PUBLIC_STAGING_URL: process.env.NEXT_PUBLIC_STAGING_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    });
    
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: request.email,
      options: {
        redirectTo: `${finalBaseUrl}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`Error al generar enlace de creación de contraseña: ${linkError?.message ?? "sin detalles"}`);
    }

    // El link generado por Supabase tiene formato: https://[project].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=...
    // Este link funciona correctamente: Supabase procesa el token y redirige a redirect_to con el hash
    // Solo necesitamos asegurarnos de que redirect_to tenga la URL correcta (ya lo configuramos arriba)
    let verificationLink = linkData.properties.action_link;
    
    // Verificar que el redirect_to en el link tenga la URL correcta
    try {
      const linkUrl = new URL(verificationLink);
      const redirectToParam = linkUrl.searchParams.get("redirect_to");
      
      if (redirectToParam) {
        const redirectUrl = new URL(redirectToParam);
        const targetUrl = new URL(finalBaseUrl);
        
        // Si el redirect_to tiene un hostname diferente, reemplazarlo
        if (redirectUrl.hostname !== targetUrl.hostname || redirectUrl.hostname.includes("localhost")) {
          redirectUrl.hostname = targetUrl.hostname;
          redirectUrl.protocol = targetUrl.protocol;
          linkUrl.searchParams.set("redirect_to", redirectUrl.toString());
          verificationLink = linkUrl.toString();
        }
      }
    } catch (urlError) {
      console.warn("Error al procesar URL de verificación, usando link original:", urlError);
    }

    console.log("✅ Link de verificación generado:", verificationLink);

    return {
      success: true,
      verificationLink,
    };
  },

  /**
   * Reenviar el enlace de creación de contraseña para una solicitud aprobada
   * 
   * NOTA SOBRE EXPIRACIÓN:
   * Los enlaces de recuperación de Supabase expiran según la configuración del proyecto en Supabase Dashboard.
   * Por defecto: 60 minutos (1 hora). Para cambiar este tiempo:
   * 1. Ve a Supabase Dashboard > Authentication > Settings
   * 2. Busca "Mailer OTP Expiration" o "OTP Expiry"
   * 3. Configura el tiempo en segundos (ej: 7200 = 2 horas, 14400 = 4 horas)
   * 4. Guarda los cambios
   * 
   * Ver SUPABASE_LINK_EXPIRATION_CONFIG.md para más detalles
   */
  async resendVerificationLink(
    requestId: number
  ): Promise<{ success: boolean; verificationLink: string }> {
    const admin = createAdminServer();

    // Obtener la solicitud
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "approved") {
      throw new Error("Solo se pueden reenviar enlaces para solicitudes aprobadas");
    }

    if (!request.email) {
      throw new Error("La solicitud no tiene un email asociado");
    }

    // Generar nuevo enlace de recuperación
    const baseUrl = getSiteUrl();
    
    // Asegurarse de que la URL no tenga localhost en producción/staging
    let finalBaseUrl = baseUrl;
    if (baseUrl.includes("localhost")) {
      if (process.env.NEXT_PUBLIC_STAGING_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_STAGING_URL;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (process.env.NEXT_PUBLIC_APP_URL) {
        finalBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
      }
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: request.email,
      options: {
        redirectTo: `${finalBaseUrl}/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`Error al generar enlace de recuperación: ${linkError?.message ?? "sin detalles"}`);
    }

    let verificationLink = linkData.properties.action_link;
    
    // Verificar que el redirect_to en el link tenga la URL correcta
    try {
      const linkUrl = new URL(verificationLink);
      const redirectToParam = linkUrl.searchParams.get("redirect_to");
      
      if (redirectToParam) {
        const redirectUrl = new URL(redirectToParam);
        const targetUrl = new URL(finalBaseUrl);
        
        if (redirectUrl.hostname !== targetUrl.hostname || redirectUrl.hostname.includes("localhost")) {
          redirectUrl.hostname = targetUrl.hostname;
          redirectUrl.protocol = targetUrl.protocol;
          linkUrl.searchParams.set("redirect_to", redirectUrl.toString());
          verificationLink = linkUrl.toString();
        }
      }
    } catch (urlError) {
      console.warn("Error al procesar URL de verificación, usando link original:", urlError);
    }

    return {
      success: true,
      verificationLink,
    };
  },

  /**
   * Rechazar una solicitud profesional
   */
  async rejectRequest(
    requestId: number,
    adminUserId: number,
    rejectionReason: string
  ): Promise<{ success: boolean }> {
    const supabase = createAdminServer();

    // 1. Obtener la solicitud
    const request = await this.getRequestById(requestId);
    if (!request) {
      throw new Error("Solicitud no encontrada");
    }

    if (request.status !== "pending" && request.status !== "resubmitted") {
      throw new Error("Solo se pueden rechazar solicitudes pendientes o reenviadas");
    }

    // 2. Actualizar el estado de la solicitud
    const { error: updateError } = await supabase
      .from("professional_requests")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(`Error al rechazar solicitud: ${updateError.message}`);
    }

    // 3. Desactivar el usuario (si estaba activo)
    await supabase
      .from("users")
      .update({
        is_active: false,
      })
      .eq("user_id", request.user_id);

    return {
      success: true,
    };
  },
};

