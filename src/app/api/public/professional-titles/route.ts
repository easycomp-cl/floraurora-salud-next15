import { NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * API pública para obtener los títulos profesionales activos
 * Usada en el formulario de registro de profesionales
 */
export async function GET() {
  try {
    const supabase = createAdminServer();
    const { data, error } = await supabase
      .from("professional_titles")
      .select("id, title_name")
      .eq("is_active", true)
      .order("title_name");

    if (error) {
      throw new Error(`Error al listar títulos: ${error.message}`);
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("[GET /api/public/professional-titles] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al listar títulos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

