import { createAdminServer } from "@/utils/supabase/server";

export interface ProfessionalRequest {
  id: number;
  user_id: string;
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

    // 2. Actualizar el estado de la solicitud
    const { error: updateError } = await supabase
      .from("professional_requests")
      .update({
        status: "approved",
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error(`Error al aprobar solicitud: ${updateError.message}`);
    }

    // 3. Activar el usuario en public.users
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({
        is_active: true,
      })
      .eq("user_id", request.user_id);

    if (userUpdateError) {
      console.error("Error al activar usuario:", userUpdateError);
      // No lanzar error, solo loguear
    }

    // 4. Generar enlace de creación de contraseña (recovery link que permite establecer contraseña)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: request.email,
      options: {
        redirectTo: `${baseUrl}/auth/set-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error("Error al generar enlace de creación de contraseña");
    }

    const verificationLink = linkData.properties.action_link;

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

