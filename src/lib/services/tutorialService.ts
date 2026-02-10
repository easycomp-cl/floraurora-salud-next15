import { createAdminServer } from "@/utils/supabase/server";
import type {
  TutorialVideo,
  UpsertTutorialVideoInput,
  TutorialVisibility,
} from "@/lib/types/adminConfig";

const TUTORIAL_SELECT = `
  id,
  title,
  description,
  youtube_url,
  visibility,
  display_order,
  is_active,
  created_at,
  updated_at
`;

const mapTutorialVideo = (row: Record<string, unknown>): TutorialVideo => ({
  id: Number(row.id),
  title: String(row.title ?? ""),
  description: row.description ? String(row.description) : null,
  youtube_url: String(row.youtube_url ?? ""),
  visibility: (row.visibility as TutorialVisibility) ?? "professionals",
  display_order: Number(row.display_order ?? 0),
  is_active: Boolean(row.is_active ?? true),
  created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
  updated_at: row.updated_at ? String(row.updated_at) : new Date().toISOString(),
});

export const tutorialService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- actorId reservado para filtrado futuro
  async listAll(actorId: number | null): Promise<TutorialVideo[]> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("tutorial_videos")
      .select(TUTORIAL_SELECT)
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`No se pudieron obtener los tutoriales: ${error.message}`);
    }

    return (data ?? []).map((row) => mapTutorialVideo(row as Record<string, unknown>));
  },

  async listForProfessionals(): Promise<TutorialVideo[]> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("tutorial_videos")
      .select(TUTORIAL_SELECT)
      .eq("is_active", true)
      .in("visibility", ["professionals", "both"])
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`No se pudieron obtener los tutoriales: ${error.message}`);
    }

    return (data ?? []).map((row) => mapTutorialVideo(row as Record<string, unknown>));
  },

  async listForPatients(): Promise<TutorialVideo[]> {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("tutorial_videos")
      .select(TUTORIAL_SELECT)
      .eq("is_active", true)
      .in("visibility", ["patients", "both"])
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`No se pudieron obtener los tutoriales: ${error.message}`);
    }

    return (data ?? []).map((row) => mapTutorialVideo(row as Record<string, unknown>));
  },

  async upsert(
    videoId: number | null,
    input: UpsertTutorialVideoInput,
    actorId: number | null,
  ): Promise<TutorialVideo> {
    const supabase = createAdminServer();
    const payload = {
      title: input.title,
      description: input.description ?? null,
      youtube_url: input.youtube_url,
      visibility: input.visibility ?? "professionals",
      display_order: input.display_order ?? 0,
      is_active: input.is_active ?? true,
      updated_by: actorId ?? null,
    };

    const query = videoId
      ? supabase
          .from("tutorial_videos")
          .update(payload)
          .eq("id", videoId)
          .select(TUTORIAL_SELECT)
          .single()
      : supabase
          .from("tutorial_videos")
          .insert(payload)
          .select(TUTORIAL_SELECT)
          .single();

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(`No se pudo guardar el tutorial: ${error?.message ?? "sin detalles"}`);
    }

    return mapTutorialVideo(data as Record<string, unknown>);
  },

  async delete(videoId: number): Promise<void> {
    const supabase = createAdminServer();
    const { error } = await supabase
      .from("tutorial_videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      throw new Error(`No se pudo eliminar el tutorial: ${error.message}`);
    }
  },
};
