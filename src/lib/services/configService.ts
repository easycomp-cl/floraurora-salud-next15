import { createAdminServer } from "@/utils/supabase/server";
import type {
  NotificationTemplate,
  UpsertNotificationTemplateInput,
  SystemSettings,
  SchedulingSettings,
  RuleSettings,
  CarouselItem,
  UpsertCarouselItemInput,
} from "@/lib/types/adminConfig";

const NOTIFICATION_SELECT = `
  id,
  channel,
  template_key,
  name,
  subject,
  body,
  variables,
  is_active,
  updated_at
`;

const mapNotificationTemplate = (row: Record<string, unknown>): NotificationTemplate => ({
  id: Number(row.id),
  channel: row.channel as NotificationTemplate["channel"],
  template_key: String(row.template_key),
  name: String(row.name),
  subject: row.subject ? String(row.subject) : null,
  body: String(row.body ?? ""),
  variables: Array.isArray(row.variables)
    ? (row.variables as string[])
    : typeof row.variables === "string"
      ? JSON.parse(row.variables as string)
      : [],
  is_active: Boolean(row.is_active ?? true),
  updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
});

const mapCarouselItem = (row: Record<string, unknown>): CarouselItem => ({
  id: Number(row.id),
  title: row.title ? String(row.title) : null,
  message: row.message ? String(row.message) : null,
  image_url: row.image_url ? String(row.image_url) : null,
  cta_label: row.cta_label ? String(row.cta_label) : null,
  cta_link: row.cta_link ? String(row.cta_link) : null,
  start_date: row.start_date ? String(row.start_date) : null,
  end_date: row.end_date ? String(row.end_date) : null,
  display_order: Number(row.display_order ?? 0),
  is_active: Boolean(row.is_active ?? true),
  updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
});

const fetchSystemSetting = async <T>(supabase: ReturnType<typeof createAdminServer>, key: string, fallback: T): Promise<T> => {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.warn(`[configService] No se pudo leer la configuración ${key}`, error);
    return fallback;
  }

  if (!data?.value) {
    return fallback;
  }

  try {
    return data.value as T;
  } catch (err) {
    console.warn(`[configService] Error parseando configuración ${key}`, err);
    return fallback;
  }
};

export const configService = {
  async listNotificationTemplates(): Promise<NotificationTemplate[]> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("notification_templates")
      .select(NOTIFICATION_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(`No se pudieron obtener las plantillas: ${error.message}`);
    }

    return (data ?? []).map((row) => mapNotificationTemplate(row as Record<string, unknown>));
  },

  async upsertNotificationTemplate(
    templateId: number | null,
    input: UpsertNotificationTemplateInput,
    actorId: number | null,
  ): Promise<NotificationTemplate> {
    const supabase = createAdminServer();
    const payload = {
      channel: input.channel,
      template_key: input.template_key,
      name: input.name,
      subject: input.subject ?? null,
      body: input.body,
      variables: input.variables ?? [],
      is_active: input.is_active ?? true,
      updated_by: actorId ?? null,
    };

    const query = templateId
      ? supabase
          .from("notification_templates")
          .update(payload)
          .eq("id", templateId)
          .select(NOTIFICATION_SELECT)
          .single()
      : supabase
          .from("notification_templates")
          .insert(payload)
          .select(NOTIFICATION_SELECT)
          .single();

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(`No se pudo guardar la plantilla: ${error?.message ?? "sin detalles"}`);
    }

    return mapNotificationTemplate(data as Record<string, unknown>);
  },

  async deleteNotificationTemplate(templateId: number): Promise<void> {
    const supabase = createAdminServer();
    const { error } = await supabase
      .from("notification_templates")
      .update({ is_active: false })
      .eq("id", templateId);

    if (error) {
      throw new Error(`No se pudo desactivar la plantilla: ${error.message}`);
    }
  },

  async getSystemSettings(): Promise<SystemSettings> {
    const supabase = createAdminServer();
    const scheduling = await fetchSystemSetting<SchedulingSettings>(supabase, "scheduling", {
      timezone: "America/Santiago",
      active_days: [1, 2, 3, 4, 5],
      business_hours: { start: "08:00", end: "20:00" },
    });

    const rules = await fetchSystemSetting<RuleSettings>(supabase, "rules", {
      min_cancelation_hours: 12,
      reschedule_limit_hours: 6,
    });

    return { scheduling, rules };
  },

  async updateSystemSettings(
    partial: Partial<SystemSettings>,
    actorId: number | null,
  ): Promise<SystemSettings> {
    const supabase = createAdminServer();

    if (partial.scheduling) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "scheduling",
          value: partial.scheduling,
          updated_by: actorId ?? null,
        });
      if (error) {
        throw new Error(`No se pudo actualizar la configuración de horarios: ${error.message}`);
      }
    }

    if (partial.rules) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: "rules",
          value: partial.rules,
          updated_by: actorId ?? null,
        });
      if (error) {
        throw new Error(`No se pudieron actualizar las reglas globales: ${error.message}`);
      }
    }

    return this.getSystemSettings();
  },

  async listCarouselItems(): Promise<CarouselItem[]> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("home_carousel_items")
      .select(
        `
        id,
        title,
        message,
        image_url,
        cta_label,
        cta_link,
        start_date,
        end_date,
        display_order,
        is_active,
        updated_at
      `,
      )
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`No se pudieron obtener los elementos del carrusel: ${error.message}`);
    }

    return (data ?? []).map((row) => mapCarouselItem(row as Record<string, unknown>));
  },

  async upsertCarouselItem(
    itemId: number | null,
    input: UpsertCarouselItemInput,
    actorId: number | null,
  ): Promise<CarouselItem> {
    const supabase = createAdminServer();
    const payload = {
      title: input.title ?? null,
      message: input.message ?? null,
      image_url: input.image_url ?? null,
      cta_label: input.cta_label ?? null,
      cta_link: input.cta_link ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
      updated_by: actorId ?? null,
    };

    const query = itemId
      ? supabase
          .from("home_carousel_items")
          .update(payload)
          .eq("id", itemId)
          .select(
            `
            id,
            title,
            message,
            image_url,
            cta_label,
            cta_link,
            start_date,
            end_date,
            display_order,
            is_active,
            updated_at
          `,
          )
          .single()
      : supabase
          .from("home_carousel_items")
          .insert(payload)
          .select(
            `
            id,
            title,
            message,
            image_url,
            cta_label,
            cta_link,
            start_date,
            end_date,
            display_order,
            is_active,
            updated_at
          `,
          )
          .single();

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(`No se pudo guardar el elemento del carrusel: ${error?.message ?? "sin detalles"}`);
    }

    return mapCarouselItem(data as Record<string, unknown>);
  },

  async deleteCarouselItem(itemId: number): Promise<void> {
    const supabase = createAdminServer();
    const { error } = await supabase
      .from("home_carousel_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      throw new Error(`No se pudo eliminar el elemento del carrusel: ${error.message}`);
    }
  },

  async getActiveCarouselItems(): Promise<CarouselItem[]> {
    const supabase = createAdminServer();
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("home_carousel_items")
      .select(
        `
        id,
        title,
        message,
        image_url,
        cta_label,
        cta_link,
        start_date,
        end_date,
        display_order,
        is_active,
        updated_at
      `,
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("[configService] No se pudo obtener carrusel activo", error);
      return [];
    }

    const filtered =
      data?.filter((row) => {
        const starts = row.start_date ? String(row.start_date) <= today : true;
        const ends = row.end_date ? String(row.end_date) >= today : true;
        return starts && ends;
      }) ?? [];

    return filtered.map((row) => mapCarouselItem(row as Record<string, unknown>));
  },
};

