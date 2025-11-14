import { createAdminServer } from "@/utils/supabase/server";
import {
  type AdminRole,
  type AdminUser,
  type AdminUserFilters,
  type AdminUserListResponse,
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload,
  type AdminProfessional,
  type AdminService,
  type AdminServicePayload,
  type AdminServicesResponse,
  type AssignProfessionalPayload,
  type AdminUserStatus,
  type AdminServiceSummary,
} from "@/lib/types/admin";
import { sendNotificationEmail } from "./emailService";
import type { PostgrestError } from "@supabase/supabase-js";

const ROLE_TO_ID: Record<AdminRole, number> = {
  admin: 1,
  patient: 2,
  professional: 3,
};

const ID_TO_ROLE: Record<number, AdminRole> = {
  1: "admin",
  2: "patient",
  3: "professional",
};

const DEFAULT_PAGE_SIZE = 20;

function toAdminRole(roleId: number | null | undefined): AdminRole {
  if (!roleId || !(roleId in ID_TO_ROLE)) {
    return "patient";
  }
  return ID_TO_ROLE[roleId as keyof typeof ID_TO_ROLE];
}

function toRoleId(role: AdminRole): number {
  return ROLE_TO_ID[role];
}

function mapUserRow(row: Record<string, unknown>): AdminUser {
  // Convertir is_active a status (AdminUserStatus)
  // La tabla solo tiene is_active, no tiene status, blocked_until, ni blocked_reason
  const isActive = Boolean(row.is_active ?? true);
  const status: AdminUserStatus = isActive ? "active" : "inactive";

  return {
    id: Number(row.id),
    user_id: String(row.user_id ?? ""),
    name: (row.name as string) ?? null,
    last_name: (row.last_name as string) ?? null,
    email: (row.email as string) ?? null,
    phone_number: (row.phone_number as string) ?? null,
    role: toAdminRole(typeof row.role === "number" ? (row.role as number) : Number(row.role ?? 2)),
    role_id: typeof row.role === "number" ? (row.role as number) : Number(row.role ?? 2),
    is_active: isActive,
    status: status,
    blocked_until: null, // La tabla no tiene esta columna
    blocked_reason: null, // La tabla no tiene esta columna
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
    updated_at: null, // La tabla no tiene esta columna
  };
}

function mapServiceSummary(row: Record<string, unknown>): AdminServiceSummary {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    price: Number(row.price ?? 0),
    currency: (row.currency as string) ?? "CLP",
    duration_minutes: Number(row.duration_minutes ?? 50),
    is_active: Boolean(row.is_active ?? true),
  };
}

function mapSpecialtyToService(specialty: Record<string, unknown>): AdminServiceSummary {
  return {
    id: Number(specialty.id ?? 0),
    name: String(specialty.name ?? ""),
    price: Number(specialty.price ?? 0),
    currency: (specialty.currency as string) ?? "CLP",
    duration_minutes: Number(specialty.duration_minutes ?? 50),
    is_active: Boolean(specialty.is_active ?? true),
  };
}

function mapProfessionalRow(row: Record<string, unknown>): AdminProfessional {
  const userData = (row.users as Record<string, unknown>) ?? {};
  
  // Primero intentamos obtener servicios desde service_professionals (si existe)
  const servicesRelation = (row.service_professionals as Record<string, unknown>[] | null | undefined) ?? [];
  let services: AdminServiceSummary[] = servicesRelation
    .map((relation) => {
      const service = relation.services as Record<string, unknown> | null | undefined;
      if (!service) return null;
      return mapServiceSummary(service);
    })
    .filter((service): service is AdminServiceSummary => Boolean(service));

  // Si no hay servicios desde service_professionals, usamos las especialidades como servicios
  // porque en este sistema las especialidades son los servicios que ofrece cada profesional
  if (services.length === 0) {
    const specialtiesRelation = (row.professional_specialties as Record<string, unknown>[] | null | undefined) ?? [];
    services = specialtiesRelation
      .map((specialtyRelation) => {
        const specialty = specialtyRelation.specialties as Record<string, unknown> | null | undefined;
        if (!specialty || !specialty.name || !specialty.id) return null;
        // Mapear especialidad a servicio con valores por defecto
        return mapSpecialtyToService({
          id: Number(specialty.id),
          name: String(specialty.name),
          price: 0, // Las especialidades no tienen precio por defecto
          currency: "CLP",
          duration_minutes: 50, // Duración por defecto
          is_active: true,
        });
      })
      .filter((service): service is AdminServiceSummary => Boolean(service));
  }

  const specialtiesRelation = (row.professional_specialties as Record<string, unknown>[] | null | undefined) ?? [];
  const specialties = specialtiesRelation
    .map((specialtyRelation) => {
      const specialty = specialtyRelation.specialties as Record<string, unknown> | null | undefined;
      return specialty?.name ? String(specialty.name) : null;
    })
    .filter((name): name is string => Boolean(name));

  const title = (row.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;

  return {
    id: Number(row.id),
    user_id: String(userData.user_id ?? ""),
    name: (userData.name as string) ?? null,
    last_name: (userData.last_name as string) ?? null,
    email: (userData.email as string) ?? null,
    phone_number: (userData.phone_number as string) ?? null,
    is_active: Boolean(row.is_active ?? true),
    title_id: title?.id ? Number(title.id) : null,
    title_name: title?.title_name ? String(title.title_name) : null,
    profile_description: (row.profile_description as string) ?? null,
    resume_url: (row.resume_url as string) ?? null,
    specialties,
    services,
  };
}

function buildSearchQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  search?: string,
) {
  if (!search) {
    return query;
  }

  const normalized = `%${search.trim().toLowerCase()}%`;
  return query.or(
    `name.ilike.${normalized},last_name.ilike.${normalized},email.ilike.${normalized},phone_number.ilike.${normalized}`,
  );
}

async function ensurePatientRecord(
  supabase: ReturnType<typeof createAdminServer>,
  userId: number,
) {
  const { data } = await supabase
    .from("patients")
    .select("id")
    .eq("id", userId)
    .single();

  if (!data) {
    await supabase.from("patients").insert({ id: userId });
  }
}

async function ensureProfessionalRecord(
  supabase: ReturnType<typeof createAdminServer>,
  userId: number,
) {
  const { data } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", userId)
    .single();

  if (!data) {
    await supabase.from("professionals").insert({
      id: userId,
      is_active: true,
    });
  }
}

function formatPostgrestError(error: PostgrestError | null) {
  if (!error) return null;
  return {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  };
}

export const adminService = {
  async listUsers(filters: AdminUserFilters = {}): Promise<AdminUserListResponse> {
    const supabase = createAdminServer();
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, 100);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("users")
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (filters.role && filters.role !== "all") {
      query = query.eq("role", toRoleId(filters.role));
    }

    // Filtrar por status usando is_active (la tabla no tiene columna status)
    if (filters.status && filters.status !== "all") {
      if (filters.status === "active") {
        query = query.eq("is_active", true);
      } else if (filters.status === "inactive") {
        query = query.eq("is_active", false);
      } else if (filters.status === "blocked") {
        // Si no hay columna blocked, tratamos como inactive
        query = query.eq("is_active", false);
      } else if (filters.status === "pending") {
        // Si no hay columna pending, no filtramos (o podríamos usar is_active = false)
        // Por ahora no aplicamos filtro para pending
      }
    }

    query = buildSearchQuery(query, filters.search);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(
        `Error al listar usuarios: ${error.message} (${error.details ?? "sin detalles"})`,
      );
    }

    const mapped = (data ?? []).map(mapUserRow);
    return {
      data: mapped,
      page,
      pageSize,
      total: count ?? mapped.length,
    };
  },

  async getUserById(userId: number): Promise<AdminUser | null> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    return mapUserRow(data);
  },

  async getUserByUuid(userUuid: string): Promise<AdminUser | null> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
      )
      .eq("user_id", userUuid)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Error al obtener usuario por UUID: ${error.message}`);
    }

    return mapUserRow(data);
  },

  async createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
    const supabase = createAdminServer();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.name,
        last_name: payload.last_name,
        role: payload.role,
        phone_number: payload.phone_number,
        rut: payload.rut,
      },
    });

    if (authError || !authData?.user) {
      throw new Error(
        `No se pudo crear el usuario de autenticación: ${authError?.message ?? "sin detalles"}`,
      );
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        user_id: authData.user.id,
        email: payload.email,
        name: payload.name,
        last_name: payload.last_name,
        phone_number: payload.phone_number,
        rut: payload.rut,
        role: toRoleId(payload.role),
        is_active: true,
        // No insertamos status porque la tabla no tiene esa columna
      })
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear el perfil del usuario: ${error?.message ?? "sin detalles"}`);
    }

    const createdUser = mapUserRow(data);

    if (payload.role === "patient") {
      await ensurePatientRecord(supabase, createdUser.id);
    } else if (payload.role === "professional") {
      await ensureProfessionalRecord(supabase, createdUser.id);
    }

    return createdUser;
  },

  async updateUser(userId: number, payload: UpdateAdminUserPayload): Promise<AdminUser> {
    const supabase = createAdminServer();

    if (payload.email) {
      const user = await this.getUserById(userId);
      if (user?.user_id) {
        const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
          user.user_id,
          {
            email: payload.email,
            user_metadata: {
              name: payload.name ?? user.name,
              last_name: payload.last_name ?? user.last_name,
              phone_number: payload.phone_number ?? user.phone_number,
              rut: payload.rut ?? undefined,
            },
          },
        );

        if (updateAuthError) {
          throw new Error(
            `No se pudo actualizar el usuario de autenticación: ${updateAuthError.message}`,
          );
        }
      }
    }

    // Convertir status a is_active si se proporciona
    let isActive = payload.is_active;
    if (payload.status) {
      isActive = payload.status === "active";
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        name: payload.name,
        last_name: payload.last_name,
        email: payload.email,
        phone_number: payload.phone_number,
        rut: payload.rut,
        is_active: isActive,
        // No actualizamos status, blocked_until, ni blocked_reason porque no existen en la tabla
      })
      .eq("id", userId)
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar el usuario: ${error?.message ?? "sin detalles"}`);
    }

    return mapUserRow(data);
  },

  async setUserBlock(
    userId: number,
    options: { blocked: boolean; reason?: string; until?: string | null },
  ): Promise<AdminUser> {
    const supabase = createAdminServer();
    // La tabla solo tiene is_active, no tiene status, blocked_until, ni blocked_reason
    // Cuando bloqueamos, simplemente ponemos is_active = false
    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: !options.blocked,
        // No actualizamos status, blocked_until, ni blocked_reason porque no existen en la tabla
      })
      .eq("id", userId)
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        created_at
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo actualizar el estado de bloqueo: ${error?.message ?? "sin detalles"}`);
    }

    return mapUserRow(data);
  },

  async assignRole(userId: number, role: AdminRole): Promise<AdminUser> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("users")
      .update({
        role: toRoleId(role),
      })
      .eq("id", userId)
      .select(
        `
        id,
        user_id,
        name,
        last_name,
        email,
        phone_number,
        role,
        is_active,
        status,
        blocked_until,
        blocked_reason,
        created_at,
        updated_at
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo asignar el rol: ${error?.message ?? "sin detalles"}`);
    }

    const updatedUser = mapUserRow(data);

    if (role === "patient") {
      await ensurePatientRecord(supabase, updatedUser.id);
    } else if (role === "professional") {
      await ensureProfessionalRecord(supabase, updatedUser.id);
    }

    return updatedUser;
  },

  async sendPasswordReset(userId: number): Promise<{ recoveryLink: string }> {
    const supabase = createAdminServer();
    const user = await this.getUserById(userId);

    if (!user || !user.email) {
      throw new Error("No se encontró el usuario o no tiene correo registrado.");
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
    });

    if (error || !data?.properties?.action_link) {
      throw new Error(`No se pudo generar el enlace de recuperación: ${error?.message ?? "sin detalles"}`);
    }

    await sendNotificationEmail({
      to: user.email,
      subject: "Recuperación de contraseña - FlorAurora Salud",
      message:
        "Has solicitado restablecer tu contraseña. Haz clic en el botón para continuar con el proceso.",
      actionUrl: data.properties.action_link,
      actionText: "Restablecer contraseña",
    });

    return { recoveryLink: data.properties.action_link };
  },

  async listProfessionals(): Promise<AdminProfessional[]> {
    try {
      const supabase = createAdminServer();
      
      // Consulta base sin professional_specialties porque professional_specialties.professional_id 
      // referencia a users.id, no a professionals.id directamente
      let selectQuery = `
        id,
        profile_description,
        resume_url,
        is_active,
        professional_titles(
          id,
          title_name
        ),
        users(
          user_id,
          name,
          last_name,
          email,
          phone_number
        ),
        service_professionals(
          services(
            id,
            name,
            price,
            currency,
            duration_minutes,
            is_active
          )
        )
      `;
      
      let { data, error } = await supabase
        .from("professionals")
        .select(selectQuery)
        .order("id", { ascending: true });

      // Si hay error relacionado con service_professionals o services, intentamos sin esa relación
      if (error && (error.message.includes("service_professionals") || error.message.includes("services") || error.message.includes("Could not find the table"))) {
        console.warn("[adminService.listProfessionals] Tabla services no existe, consultando sin service_professionals");
        
        // Consulta sin service_professionals
        selectQuery = `
          id,
          profile_description,
          resume_url,
          is_active,
          professional_titles(
            id,
            title_name
          ),
          users(
            user_id,
            name,
            last_name,
            email,
            phone_number
          )
        `;
        
        const result = await supabase
          .from("professionals")
          .select(selectQuery)
          .order("id", { ascending: true });
        
        data = result.data;
        error = result.error;
        
        // Si aún hay error con la relación users, intentamos sin users también
        if (error && (error.message.includes("users") || error.message.includes("relation") || error.message.includes("foreign key"))) {
          console.warn("[adminService.listProfessionals] Problema con relación users, consultando sin users");
          
          // Consulta mínima sin users ni service_professionals
          selectQuery = `
            id,
            profile_description,
            resume_url,
            is_active,
            professional_titles(
              id,
              title_name
            )
          `;
          
          const result2 = await supabase
            .from("professionals")
            .select(selectQuery)
            .order("id", { ascending: true });
          
          data = result2.data;
          error = result2.error;
        }
      }

      if (error) {
        console.error("[adminService.listProfessionals] Error de Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Error al listar profesionales: ${error.message}${error.details ? ` - ${error.details}` : ""}${error.hint ? ` - ${error.hint}` : ""}`);
      }

      const professionalsData = (data ?? []) as unknown as Array<Record<string, unknown>>;
      
      // Si no tenemos datos de users en la consulta, intentamos obtenerlos por separado
      const professionalsWithoutUsers = professionalsData.filter(
        (row) => !row.users || (typeof row.users === 'object' && Object.keys(row.users as Record<string, unknown>).length === 0)
      );

      if (professionalsWithoutUsers.length > 0) {
        const professionalIds = professionalsWithoutUsers.map((row) => Number(row.id));
        
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, user_id, name, last_name, email, phone_number")
          .in("id", professionalIds);

        if (!usersError && usersData) {
          const usersMap = new Map(
            usersData.map((user: Record<string, unknown>) => [Number(user.id), user])
          );

          professionalsData.forEach((row) => {
            if (!row.users || (typeof row.users === 'object' && Object.keys(row.users as Record<string, unknown>).length === 0)) {
              const userId = Number(row.id);
              const userData = usersMap.get(userId);
              if (userData) {
                row.users = userData;
              }
            }
          });
        }
      }

      // Obtener especialidades por separado porque professional_specialties.professional_id 
      // referencia a users.id (que es igual a professionals.id)
      const professionalIds = professionalsData.map((row) => Number(row.id));
      
      if (professionalIds.length > 0) {
        const { data: specialtiesData, error: specialtiesError } = await supabase
          .from("professional_specialties")
          .select(`
            professional_id,
            specialties(
              id,
              name,
              title_id,
              created_at
            )
          `)
          .in("professional_id", professionalIds);

        if (specialtiesError) {
          console.warn("[adminService.listProfessionals] Error al obtener especialidades:", {
            message: specialtiesError.message,
            details: specialtiesError.details,
            hint: specialtiesError.hint,
            code: specialtiesError.code,
          });
        } else if (specialtiesData) {
          console.log("[adminService.listProfessionals] Especialidades obtenidas:", specialtiesData.length);
          
          // Crear un mapa de professional_id -> array de objetos de especialidades completos
          const specialtiesMap = new Map<number, Array<Record<string, unknown>>>();
          
          specialtiesData.forEach((item: Record<string, unknown>) => {
            const professionalId = Number(item.professional_id);
            const specialty = item.specialties as Record<string, unknown> | null | undefined;
            
            if (specialty && specialty.name && specialty.id) {
              const currentSpecialties = specialtiesMap.get(professionalId) || [];
              currentSpecialties.push({
                id: specialty.id,
                name: specialty.name,
                title_id: specialty.title_id ?? null,
                created_at: specialty.created_at ?? new Date().toISOString(),
              });
              specialtiesMap.set(professionalId, currentSpecialties);
            } else {
              console.warn("[adminService.listProfessionals] Especialidad sin nombre o id para professional_id:", professionalId, item);
            }
          });

          console.log("[adminService.listProfessionals] Mapa de especialidades:", Array.from(specialtiesMap.entries()));

          // Asignar especialidades a cada profesional con la estructura completa
          professionalsData.forEach((row) => {
            const professionalId = Number(row.id);
            const specialties = specialtiesMap.get(professionalId) || [];
            row.professional_specialties = specialties.map((specialty) => ({
              specialties: specialty
            }));
            
            if (specialties.length > 0) {
              console.log(`[adminService.listProfessionals] Profesional ${professionalId} tiene ${specialties.length} especialidades:`, specialties.map(s => s.name));
            }
          });
        } else {
          console.warn("[adminService.listProfessionals] No se obtuvieron datos de especialidades");
        }
      }

      return professionalsData.map((row) => mapProfessionalRow(row as Record<string, unknown>));
    } catch (error) {
      console.error("[adminService.listProfessionals] Error completo:", error);
      throw error;
    }
  },

  async setProfessionalStatus(professionalId: number, active: boolean): Promise<void> {
    const supabase = createAdminServer();
    const { error } = await supabase
      .from("professionals")
      .update({ is_active: active })
      .eq("id", professionalId);

    if (error) {
      throw new Error(`No se pudo actualizar el estado del profesional: ${error.message}`);
    }
  },

  async assignServicesToProfessional(payload: AssignProfessionalPayload): Promise<void> {
    const supabase = createAdminServer();
    const { error: deleteError } = await supabase
      .from("service_professionals")
      .delete()
      .eq("professional_id", payload.professionalId);

    if (deleteError) {
      throw new Error(`No se pudieron limpiar los servicios previos: ${deleteError.message}`);
    }

    if (payload.serviceIds.length === 0) {
      return;
    }

    const rows = payload.serviceIds.map((serviceId) => ({
      professional_id: payload.professionalId,
      service_id: serviceId,
    }));

    const { error: insertError } = await supabase.from("service_professionals").insert(rows);
    if (insertError) {
      throw new Error(`No se pudieron asignar los servicios: ${insertError.message}`);
    }
  },

  async listServices(onlyActive = false): Promise<AdminServicesResponse> {
    try {
      const supabase = createAdminServer();
      
      // Consultar desde specialties (que son los servicios) con su relación a professional_titles
      const query = supabase
        .from("specialties")
        .select(
          `
        id,
        name,
        title_id,
        is_active,
        created_at,
        professional_titles(
          id,
          title_name
        )
      `,
          { count: "exact" },
        )
        .order("name", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error("[adminService.listServices] Error de Supabase:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Error al listar servicios: ${error.message}${error.details ? ` - ${error.details}` : ""}${error.hint ? ` - ${error.hint}` : ""}`);
      }

      // Mapear specialties a AdminService con valores por defecto
      // Las especialidades no tienen precio, duración, etc., así que usamos valores por defecto
      const mapped = (data ?? []).map((row) => {
        const title = (row.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
        return {
          id: Number(row.id),
          name: String(row.name ?? ""),
          slug: String(row.name ?? "").toLowerCase().replace(/\s+/g, "-"), // Generar slug desde el nombre
          description: "", // Las especialidades no tienen descripción
          price: 0, // Las especialidades no tienen precio
          currency: "CLP",
          duration_minutes: 50, // Duración por defecto
          is_active: Boolean(row.is_active ?? true), // Usar is_active directamente de la tabla
          valid_from: null,
          valid_to: null,
          title_id: title?.id ? Number(title.id) : (row.title_id ? Number(row.title_id) : null),
          title_name: title?.title_name ? String(title.title_name) : null,
          created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
          updated_at: null,
        } as AdminService;
      });

      // Filtrar por estado activo si se solicita
      const filtered = onlyActive 
        ? mapped.filter((s) => s.is_active)
        : mapped;

      return {
        data: filtered,
        total: count ?? filtered.length,
      };
    } catch (error) {
      console.error("[adminService.listServices] Error completo:", error);
      throw error;
    }
  },

  async createService(payload: AdminServicePayload): Promise<AdminService> {
    const supabase = createAdminServer();
    
    // La tabla specialties solo tiene: id, name, title_id, created_at
    // Necesitamos obtener title_id desde title_name si se proporciona
    let titleId: number | null = null;
    
    if (payload.title_id) {
      titleId = payload.title_id;
    } else if (payload.title_name) {
      // Buscar el título por nombre
      const { data: titleData, error: titleError } = await supabase
        .from("professional_titles")
        .select("id")
        .eq("title_name", payload.title_name)
        .single();
      
      if (!titleError && titleData) {
        titleId = Number(titleData.id);
      }
    }

    const { data, error } = await supabase
      .from("specialties")
      .insert({
        name: payload.name,
        title_id: titleId,
        is_active: payload.is_active ?? true,
      })
      .select(
        `
        id,
        name,
        title_id,
        is_active,
        created_at,
        professional_titles(
          id,
          title_name
        )
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo crear la especialidad: ${error?.message ?? "sin detalles"}`);
    }

    // Mapear a AdminService con valores por defecto
    const title = (data.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
    return {
      id: Number(data.id),
      name: String(data.name ?? ""),
      slug: String(payload.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      description: payload.description ?? "",
      price: payload.price ?? 0,
      currency: payload.currency ?? "CLP",
      duration_minutes: payload.duration_minutes ?? 50,
      is_active: Boolean(data.is_active ?? true),
      valid_from: payload.valid_from ?? null,
      valid_to: payload.valid_to ?? null,
      title_id: title?.id ? Number(title.id) : (titleId ?? null),
      title_name: title?.title_name ? String(title.title_name) : null,
      created_at: data.created_at ? String(data.created_at) : new Date().toISOString(),
      updated_at: null,
    };
  },

  async updateService(serviceId: number, payload: Partial<AdminServicePayload>): Promise<AdminService> {
    const supabase = createAdminServer();
    
    // La tabla specialties tiene: id, name, title_id, is_active, created_at
    // Podemos actualizar name, title_id e is_active
    const updates: Record<string, unknown> = {};
    
    if (payload.name) {
      updates.name = payload.name;
    }
    
    // Manejar title_id o title_name
    if (payload.title_id !== undefined) {
      updates.title_id = payload.title_id;
    } else if (payload.title_name) {
      // Buscar el título por nombre
      const { data: titleData, error: titleError } = await supabase
        .from("professional_titles")
        .select("id")
        .eq("title_name", payload.title_name)
        .single();
      
      if (!titleError && titleData) {
        updates.title_id = Number(titleData.id);
      }
    }
    
    // Actualizar is_active si se proporciona
    if (payload.is_active !== undefined) {
      updates.is_active = payload.is_active;
    }

    // Si no hay nada que actualizar, obtener el servicio actual
    if (Object.keys(updates).length === 0) {
      const { data: currentData } = await supabase
        .from("specialties")
        .select(`
          id,
          name,
          title_id,
          is_active,
          created_at,
          professional_titles(
            id,
            title_name
          )
        `)
        .eq("id", serviceId)
        .single();
      
      if (currentData) {
        const title = (currentData.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
        return {
          id: Number(currentData.id),
          name: String(currentData.name ?? ""),
          slug: String(currentData.name ?? "").toLowerCase().replace(/\s+/g, "-"),
          description: payload.description ?? "",
          price: payload.price ?? 0,
          currency: payload.currency ?? "CLP",
          duration_minutes: payload.duration_minutes ?? 50,
          is_active: Boolean(currentData.is_active ?? true),
          valid_from: payload.valid_from ?? null,
          valid_to: payload.valid_to ?? null,
          title_id: title?.id ? Number(title.id) : (currentData.title_id ? Number(currentData.title_id) : null),
          title_name: title?.title_name ? String(title.title_name) : null,
          created_at: currentData.created_at ? String(currentData.created_at) : new Date().toISOString(),
          updated_at: null,
        };
      }
    }

    const { data, error } = await supabase
      .from("specialties")
      .update(updates)
      .eq("id", serviceId)
      .select(
        `
        id,
        name,
        title_id,
        is_active,
        created_at,
        professional_titles(
          id,
          title_name
        )
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo actualizar la especialidad: ${error?.message ?? "sin detalles"}`);
    }

    // Mapear a AdminService con valores por defecto
    const title = (data.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
    return {
      id: Number(data.id),
      name: String(data.name ?? ""),
      slug: String(payload.name ?? data.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      description: payload.description ?? "",
      price: payload.price ?? 0,
      currency: payload.currency ?? "CLP",
      duration_minutes: payload.duration_minutes ?? 50,
      is_active: Boolean(data.is_active ?? true),
      valid_from: payload.valid_from ?? null,
      valid_to: payload.valid_to ?? null,
      title_id: title?.id ? Number(title.id) : (data.title_id ? Number(data.title_id) : null),
      title_name: title?.title_name ? String(title.title_name) : null,
      created_at: data.created_at ? String(data.created_at) : new Date().toISOString(),
      updated_at: null,
    };
  },

  async deactivateService(serviceId: number): Promise<void> {
    const supabase = createAdminServer();
    // Actualizar is_active directamente en la tabla specialties
    const { error } = await supabase
      .from("specialties")
      .update({ is_active: false })
      .eq("id", serviceId);

    if (error) {
      throw new Error(`No se pudo desactivar la especialidad: ${error.message}`);
    }
  },

  async activateService(serviceId: number): Promise<void> {
    const supabase = createAdminServer();
    // Actualizar is_active directamente en la tabla specialties
    const { error } = await supabase
      .from("specialties")
      .update({ is_active: true })
      .eq("id", serviceId);

    if (error) {
      throw new Error(`No se pudo activar la especialidad: ${error.message}`);
    }
  },

  formatPostgrestError,
};

export type AdminServiceError = ReturnType<typeof formatPostgrestError>;

