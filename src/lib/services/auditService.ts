import { createAdminServer } from "@/utils/supabase/server";

export interface AdminLogPayload {
  actorId: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

export interface AdminLogFilters {
  actorId?: number;
  entity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminLogEntry {
  id: number;
  actor_id: number | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
}

const DEFAULT_PAGE_SIZE = 25;

export const auditService = {
  async log(payload: AdminLogPayload): Promise<void> {
    const supabase = createAdminServer();
    const entry = {
      actor_id: payload.actorId ?? null,
      action: payload.action,
      entity: payload.entity,
      entity_id: payload.entityId !== undefined && payload.entityId !== null ? String(payload.entityId) : null,
      metadata: payload.metadata ?? null,
      ip_address: payload.ipAddress ?? null,
    };

    const { error } = await supabase.from("admin_logs").insert(entry);
    if (error) {
      console.error("[auditService] Error al registrar log", error);
    }
  },

  async list(filters: AdminLogFilters = {}): Promise<{ data: AdminLogEntry[]; total: number }> {
    const supabase = createAdminServer();
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, 100);
    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    let query = supabase
      .from("admin_logs")
      .select(
        `
          id,
          actor_id,
          action,
          entity,
          entity_id,
          metadata,
          created_at,
          ip_address
        `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (typeof filters.actorId === "number") {
      query = query.eq("actor_id", filters.actorId);
    }

    if (filters.entity) {
      query = query.ilike("entity", `%${filters.entity}%`);
    }

    if (filters.from) {
      query = query.gte("created_at", filters.from);
    }

    if (filters.to) {
      query = query.lte("created_at", filters.to);
    }

    const { data, error, count } = await query.range(fromIndex, toIndex);

    if (error) {
      throw new Error(`No se pudieron obtener los logs administrativos: ${error.message}`);
    }

    return {
      data: ((data ?? []) as AdminLogEntry[]).map((entry) => ({
        ...entry,
        metadata: entry.metadata ?? null,
      })),
      total: count ?? 0,
    };
  },
};

