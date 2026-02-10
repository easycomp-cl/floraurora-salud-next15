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

function mapUserRow(row: Record<string, unknown>, isBlockedInAuth?: boolean): AdminUser {
  // Convertir is_active a status (AdminUserStatus)
  // Si el usuario está bloqueado en auth.users (app_metadata.blocked = true), status = "blocked"
  // Si no está activo pero no está bloqueado, status = "inactive"
  // Si está activo, status = "active"
  const isActive = Boolean(row.is_active ?? true);
  let status: AdminUserStatus;
  
  if (isBlockedInAuth === true) {
    status = "blocked";
  } else if (isActive) {
    status = "active";
  } else {
    status = "inactive";
  }

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
    minimum_amount: row.minimum_amount !== undefined && row.minimum_amount !== null ? Number(row.minimum_amount) : null,
    maximum_amount: row.maximum_amount !== undefined && row.maximum_amount !== null ? Number(row.maximum_amount) : null,
    duration_minutes: Number(row.duration_minutes ?? 50),
    is_active: Boolean(row.is_active ?? true),
  };
}

function mapSpecialtyToService(specialty: Record<string, unknown>): AdminServiceSummary {
  return {
    id: Number(specialty.id ?? 0),
    name: String(specialty.name ?? ""),
    minimum_amount: specialty.minimum_amount !== undefined && specialty.minimum_amount !== null ? Number(specialty.minimum_amount) : null,
    maximum_amount: specialty.maximum_amount !== undefined && specialty.maximum_amount !== null ? Number(specialty.maximum_amount) : null,
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
    use_promotional_price: Boolean(row.use_promotional_price ?? false),
    plan_type: (row.plan_type as "commission" | "monthly" | null) ?? null,
    monthly_plan_expires_at: (row.monthly_plan_expires_at as string) ?? null,
    last_monthly_payment_date: (row.last_monthly_payment_date as string) ?? null,
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

    // Obtener información de bloqueo de auth.users para cada usuario
    const userIds = (data ?? []).map((row) => String(row.user_id)).filter(Boolean);
    const blockedUserIds = new Set<string>();
    
    if (userIds.length > 0) {
      // Obtener usuarios bloqueados de auth.users
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsers?.users) {
          authUsers.users.forEach((authUser) => {
            if (authUser.app_metadata?.blocked === true) {
              blockedUserIds.add(authUser.id);
            }
          });
        }
      } catch (authErr) {
        console.warn("Error al obtener usuarios bloqueados de auth.users:", authErr);
        // Continuar sin la información de bloqueo si falla
      }
    }

    // Mapear usuarios con información de bloqueo
    const mapped = (data ?? []).map((row) => {
      const user_id = String(row.user_id ?? "");
      const isBlocked = blockedUserIds.has(user_id);
      return mapUserRow(row, isBlocked);
    });

    // Si el filtro es "blocked", filtrar solo los bloqueados
    let filteredData = mapped;
    if (filters.status === "blocked") {
      filteredData = mapped.filter((user) => user.status === "blocked");
    }

    return {
      data: filteredData,
      page,
      pageSize,
      total: filters.status === "blocked" ? filteredData.length : (count ?? mapped.length),
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

    // Verificar si el usuario está bloqueado en auth.users
    let isBlocked = false;
    if (data.user_id) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(String(data.user_id));
        if (!authError && authUser?.user) {
          isBlocked = authUser.user.app_metadata?.blocked === true;
        }
      } catch (authErr) {
        console.warn("Error al verificar bloqueo en auth.users:", authErr);
        // Continuar sin la información de bloqueo si falla
      }
    }

    return mapUserRow(data, isBlocked);
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

    // Verificar si el usuario está bloqueado en auth.users
    let isBlocked = false;
    if (data.user_id) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(String(data.user_id));
        if (!authError && authUser?.user) {
          isBlocked = authUser.user.app_metadata?.blocked === true;
        }
      } catch (authErr) {
        console.warn("Error al verificar bloqueo en auth.users:", authErr);
        // Continuar sin la información de bloqueo si falla
      }
    }

    return mapUserRow(data, isBlocked);
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

    // Un usuario recién creado no debería estar bloqueado, pero verificamos por consistencia
    const createdUser = mapUserRow(data, false);

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

    // Verificar si el usuario está bloqueado en auth.users después de la actualización
    let isBlocked = false;
    if (data.user_id) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(String(data.user_id));
        if (!authError && authUser?.user) {
          isBlocked = authUser.user.app_metadata?.blocked === true;
        }
      } catch (authErr) {
        console.warn("Error al verificar bloqueo en auth.users:", authErr);
        // Continuar sin la información de bloqueo si falla
      }
    }

    return mapUserRow(data, isBlocked);
  },

  async setUserBlock(
    userId: number,
    options: { blocked: boolean; reason?: string; until?: string | null },
  ): Promise<AdminUser> {
    const supabase = createAdminServer();
    
    // Primero obtener el usuario para obtener el user_id (UUID) de auth.users
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (!user.user_id) {
      throw new Error("El usuario no tiene un user_id de autenticación asociado");
    }

    // Bloquear/desbloquear en auth.users de Supabase
    // Usar app_metadata para marcar el usuario como bloqueado
    // Esto permite verificar el estado en el middleware y rechazar el acceso
    const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(user.user_id);
    
    if (authError) {
      console.error("Error al obtener usuario de auth.users:", authError);
      throw new Error(`No se pudo obtener el usuario de autenticación: ${authError.message}`);
    }

    // Obtener app_metadata actual o crear uno nuevo
    const currentAppMetadata = authUserData?.user?.app_metadata || {};
    
    // Actualizar app_metadata con el estado de bloqueo
    const { data: updatedAuthUser, error: updateAuthError } = await supabase.auth.admin.updateUserById(
      user.user_id,
      {
        app_metadata: {
          ...currentAppMetadata,
          blocked: options.blocked,
          blocked_at: options.blocked ? new Date().toISOString() : null,
          blocked_reason: options.blocked ? (options.reason || null) : null,
        },
      },
    );

    if (updateAuthError) {
      console.error("Error al actualizar usuario en auth.users:", updateAuthError);
      throw new Error(
        `No se pudo ${options.blocked ? "bloquear" : "desbloquear"} el usuario en autenticación: ${updateAuthError.message}`,
      );
    }

    // Verificar que el usuario fue actualizado correctamente
    if (updatedAuthUser?.user) {
      const isBlocked = updatedAuthUser.user.app_metadata?.blocked === true;
      if (options.blocked && !isBlocked) {
        console.warn("Advertencia: El usuario no fue bloqueado correctamente en auth.users");
      }
    }

    // Actualizar is_active en la tabla users
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
      // Si falla la actualización en users, intentar revertir el bloqueo en auth.users
      if (options.blocked) {
        console.error("Error al actualizar users, revirtiendo bloqueo en auth.users");
        const currentAppMetadata = updatedAuthUser?.user?.app_metadata || {};
        await supabase.auth.admin.updateUserById(user.user_id, {
          app_metadata: {
            ...currentAppMetadata,
            blocked: false,
            blocked_at: null,
            blocked_reason: null,
          },
        });
      }
      throw new Error(`No se pudo actualizar el estado de bloqueo: ${error?.message ?? "sin detalles"}`);
    }

    // El usuario ya fue actualizado con el bloqueo, usar el estado actual
    return mapUserRow(data, options.blocked);
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
        created_at
      `,
      )
      .single();

    if (error || !data) {
      throw new Error(`No se pudo asignar el rol: ${error?.message ?? "sin detalles"}`);
    }

    // Verificar si el usuario está bloqueado en auth.users después de asignar el rol
    let isBlocked = false;
    if (data.user_id) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(String(data.user_id));
        if (!authError && authUser?.user) {
          isBlocked = authUser.user.app_metadata?.blocked === true;
        }
      } catch (authErr) {
        console.warn("Error al verificar bloqueo en auth.users:", authErr);
        // Continuar sin la información de bloqueo si falla
      }
    }

    const updatedUser = mapUserRow(data, isBlocked);

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

    const { getSiteUrl } = await import("@/lib/utils/url");
    const baseUrl = getSiteUrl();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: user.email,
      options: {
        redirectTo: `${baseUrl}/reset-password`,
      },
    });

    if (error || !data?.properties?.action_link) {
      throw new Error(`No se pudo generar el enlace de recuperación: ${error?.message ?? "sin detalles"}`);
    }

    // Usar el enlace original de Supabase. NO reemplazar el host: el link debe apuntar
    // a Supabase (ej. https://xxx.supabase.co/auth/v1/verify) para que verifique el token
    // y luego redirija a redirect_to (nuestro /reset-password). Si cambiamos el host
    // por el del sitio, el usuario termina en /auth/v1/verify en nuestra app → 404.
    const recoveryLink = data.properties.action_link;

    await sendNotificationEmail({
      to: user.email,
      subject: "Crear tu contraseña - FlorAurora Salud",
      message:
        "Tu cuenta ha sido autorizada. Haz clic en el botón para crear tu contraseña y acceder a la plataforma.",
      actionUrl: recoveryLink,
      actionText: "Crear contraseña",
    });

    return { recoveryLink };
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
        use_promotional_price,
        plan_type,
        monthly_plan_expires_at,
        last_monthly_payment_date,
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
          use_promotional_price,
          plan_type,
          monthly_plan_expires_at,
          last_monthly_payment_date,
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
            use_promotional_price,
            plan_type,
            monthly_plan_expires_at,
            last_monthly_payment_date,
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

          // Asignar especialidades a cada profesional con la estructura completa
          professionalsData.forEach((row) => {
            const professionalId = Number(row.id);
            const specialties = specialtiesMap.get(professionalId) || [];
            row.professional_specialties = specialties.map((specialty) => ({
              specialties: specialty
            }));
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

  async setProfessionalPromotionalPrice(professionalId: number, usePromotionalPrice: boolean): Promise<void> {
    const supabase = createAdminServer();
    const { error } = await supabase
      .from("professionals")
      .update({ use_promotional_price: usePromotionalPrice })
      .eq("id", professionalId);

    if (error) {
      throw new Error(`No se pudo actualizar el precio promocional del profesional: ${error.message}`);
    }
  },

  async assignServicesToProfessional(payload: AssignProfessionalPayload): Promise<void> {
    const supabase = createAdminServer();
    
    // Verificar que el profesional existe
    const { data: professional, error: professionalError } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", payload.professionalId)
      .single();

    if (professionalError || !professional) {
      console.error("[adminService.assignServicesToProfessional] Error verificando profesional:", professionalError);
      throw new Error(`No se encontró el profesional con ID ${payload.professionalId}: ${professionalError?.message ?? "sin detalles"}`);
    }

    // Detectar qué esquema usa la BD: services+service_professionals o specialties+professional_specialties
    // listServices devuelve datos de specialties, así que los IDs pueden ser de specialties
    const { data: existingServices, error: servicesError } = await supabase
      .from("services")
      .select("id")
      .limit(1);

    const useServicesTable = !servicesError && existingServices !== null;
    const useSpecialtiesSchema = servicesError?.message?.includes("Could not find the table") || servicesError?.code === "PGRST205";

    if (payload.serviceIds.length > 0) {
      if (useServicesTable) {
        // Esquema con tabla services
        const { data: existing, error: verifyError } = await supabase
          .from("services")
          .select("id")
          .in("id", payload.serviceIds);

        if (verifyError) {
          console.error("[adminService.assignServicesToProfessional] Error verificando servicios:", verifyError);
          throw new Error(`Error al verificar servicios: ${verifyError.message}`);
        }
        const validIds = existing?.map((s) => s.id) || [];
        const invalidIds = payload.serviceIds.filter((id) => !validIds.includes(id));
        if (invalidIds.length > 0) {
          throw new Error(`Los siguientes servicios no existen: ${invalidIds.join(", ")}`);
        }
      } else if (useSpecialtiesSchema) {
        // Esquema con tabla specialties (listServices usa specialties)
        const { data: existingSpecs, error: specsError } = await supabase
          .from("specialties")
          .select("id")
          .in("id", payload.serviceIds);

        if (specsError) {
          console.error("[adminService.assignServicesToProfessional] Error verificando especialidades:", specsError);
          throw new Error(`Error al verificar especialidades: ${specsError.message}`);
        }
        const validIds = existingSpecs?.map((s) => s.id) || [];
        const invalidIds = payload.serviceIds.filter((id) => !validIds.includes(id));
        if (invalidIds.length > 0) {
          throw new Error(`Los siguientes servicios/especialidades no existen: ${invalidIds.join(", ")}`);
        }
      } else {
        console.warn("[adminService.assignServicesToProfessional] No se pudo determinar esquema, continuando sin verificación previa");
      }
    }

    if (useServicesTable) {
      // Usar service_professionals
      const { error: deleteError } = await supabase
        .from("service_professionals")
        .delete()
        .eq("professional_id", payload.professionalId);

      if (deleteError && !deleteError.message.includes("does not exist")) {
        console.warn("[adminService.assignServicesToProfessional] Advertencia al eliminar servicios previos:", deleteError.message);
      }

      if (payload.serviceIds.length === 0) return;

      const rows = payload.serviceIds.map((serviceId) => ({
        professional_id: payload.professionalId,
        service_id: serviceId,
      }));

      const { error: insertError } = await supabase
        .from("service_professionals")
        .insert(rows)
        .select();

      if (insertError) {
        if (insertError.code === "23505" || insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
          await supabase.from("service_professionals").delete().eq("professional_id", payload.professionalId);
          const { error: retryError } = await supabase.from("service_professionals").insert(rows).select();
          if (retryError) throw new Error(`No se pudieron asignar los servicios: ${retryError.message}`);
        } else {
          throw new Error(`No se pudieron asignar los servicios: ${insertError.message}`);
        }
      }
    } else if (useSpecialtiesSchema) {
      // Usar professional_specialties
      const { error: deleteError } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("professional_id", payload.professionalId);

      if (deleteError) {
        console.error("[adminService.assignServicesToProfessional] Error eliminando especialidades previas:", deleteError);
        throw new Error(`Error al eliminar especialidades previas: ${deleteError.message}`);
      }

      if (payload.serviceIds.length === 0) return;

      const rows = payload.serviceIds.map((specialtyId) => ({
        professional_id: payload.professionalId,
        specialty_id: specialtyId,
      }));

      const { error: insertError } = await supabase
        .from("professional_specialties")
        .insert(rows)
        .select();

      if (insertError) {
        console.error("[adminService.assignServicesToProfessional] Error insertando especialidades:", insertError);
        throw new Error(`No se pudieron asignar los servicios: ${insertError.message}`);
      }
    } else {
      throw new Error("No se encontró la tabla services ni specialties. Ejecuta las migraciones necesarias.");
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
        description,
        minimum_amount,
        maximum_amount,
        duration_minutes,
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
      // Mapear los datos de specialties con los nuevos campos
      const mapped = (data ?? []).map((row) => {
        const title = (row.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
        return {
          id: Number(row.id),
          name: String(row.name ?? ""),
          slug: String(row.name ?? "").toLowerCase().replace(/\s+/g, "-"), // Generar slug desde el nombre
          description: row.description ? String(row.description) : "",
          minimum_amount: row.minimum_amount ? Number(row.minimum_amount) : null,
          maximum_amount: row.maximum_amount ? Number(row.maximum_amount) : null,
          duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : 50,
          is_active: Boolean(row.is_active ?? true),
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
    
    // El title_id es obligatorio
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
    
    if (!titleId) {
      throw new Error("El campo title_id (área/título) es obligatorio");
    }

    const { data, error } = await supabase
      .from("specialties")
      .insert({
        name: payload.name,
        title_id: titleId,
        description: payload.description ?? null,
        minimum_amount: payload.minimum_amount ?? null,
        maximum_amount: payload.maximum_amount ?? null,
        duration_minutes: payload.duration_minutes ?? null,
        is_active: payload.is_active ?? true,
      })
      .select(
        `
        id,
        name,
        title_id,
        description,
        minimum_amount,
        maximum_amount,
        duration_minutes,
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

    // Mapear a AdminService
    const title = (data.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
    return {
      id: Number(data.id),
      name: String(data.name ?? ""),
      slug: payload.slug ?? String(payload.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      description: data.description ? String(data.description) : (payload.description ?? ""),
      minimum_amount: data.minimum_amount ? Number(data.minimum_amount) : (payload.minimum_amount ?? null),
      maximum_amount: data.maximum_amount ? Number(data.maximum_amount) : (payload.maximum_amount ?? null),
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : (payload.duration_minutes ?? 50),
      is_active: Boolean(data.is_active ?? true),
      title_id: title?.id ? Number(title.id) : (titleId ?? null),
      title_name: title?.title_name ? String(title.title_name) : null,
      created_at: data.created_at ? String(data.created_at) : new Date().toISOString(),
      updated_at: null,
    };
  },

  async updateService(serviceId: number, payload: Partial<AdminServicePayload>): Promise<AdminService> {
    const supabase = createAdminServer();
    
    // La tabla specialties tiene: id, name, title_id, description, minimum_amount, maximum_amount, duration_minutes, is_active, created_at
    const updates: Record<string, unknown> = {};
    
    if (payload.name) {
      updates.name = payload.name;
    }
    
    if (payload.description !== undefined) {
      updates.description = payload.description;
    }
    
    if (payload.minimum_amount !== undefined) {
      updates.minimum_amount = payload.minimum_amount;
    }
    
    if (payload.maximum_amount !== undefined) {
      updates.maximum_amount = payload.maximum_amount;
    }
    
    if (payload.duration_minutes !== undefined) {
      updates.duration_minutes = payload.duration_minutes;
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
          description,
          minimum_amount,
          maximum_amount,
          duration_minutes,
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
          slug: payload.slug ?? String(currentData.name ?? "").toLowerCase().replace(/\s+/g, "-"),
          description: currentData.description ? String(currentData.description) : (payload.description ?? ""),
          minimum_amount: currentData.minimum_amount ? Number(currentData.minimum_amount) : (payload.minimum_amount ?? null),
          maximum_amount: currentData.maximum_amount ? Number(currentData.maximum_amount) : (payload.maximum_amount ?? null),
          duration_minutes: currentData.duration_minutes ? Number(currentData.duration_minutes) : (payload.duration_minutes ?? 50),
          is_active: Boolean(currentData.is_active ?? true),
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
        description,
        minimum_amount,
        maximum_amount,
        duration_minutes,
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

    // Mapear a AdminService
    const title = (data.professional_titles as unknown as Record<string, unknown> | null | undefined) ?? null;
    return {
      id: Number(data.id),
      name: String(data.name ?? ""),
      slug: payload.slug ?? String(payload.name ?? data.name ?? "").toLowerCase().replace(/\s+/g, "-"),
      description: data.description ? String(data.description) : (payload.description ?? ""),
      minimum_amount: data.minimum_amount ? Number(data.minimum_amount) : (payload.minimum_amount ?? null),
      maximum_amount: data.maximum_amount ? Number(data.maximum_amount) : (payload.maximum_amount ?? null),
      duration_minutes: data.duration_minutes ? Number(data.duration_minutes) : (payload.duration_minutes ?? 50),
      is_active: Boolean(data.is_active ?? true),
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

