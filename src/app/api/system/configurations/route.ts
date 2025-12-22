import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[system-configurations] Fallback a createClient sin request:", error);
      supabase = await createClient();
    }

    // Primero intentar obtener la sesión (esto puede refrescar las cookies)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Luego obtener el usuario (más confiable)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    
    // Usar el usuario de getUser() o de la sesión como fallback
    const finalUser = user || session?.user;

    if (authError && !finalUser) {
      console.error("[system-configurations] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el perfil del usuario para verificar el rol
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Si es admin, puede ver todas las configuraciones
    // Si no es admin, solo puede ver las activas
    const query = supabase
      .from("system_configurations")
      .select("*")
      .order("category", { ascending: true })
      .order("config_key", { ascending: true });

    if (profile.role !== 1) {
      query.eq("is_active", true);
    }

    const { data: configurations, error } = await query;

    if (error) {
      console.error("Error obteniendo configuraciones:", error);
      return NextResponse.json(
        { error: "Error al obtener configuraciones" },
        { status: 500 }
      );
    }

    // Convertir los valores según su tipo de dato
    const formattedConfigurations = configurations?.map((config) => {
      let value: string | number | boolean | object = config.config_value;

      switch (config.data_type) {
        case "number":
          value = Number(config.config_value);
          break;
        case "boolean":
          value = config.config_value === "true" || config.config_value === "1";
          break;
        case "json":
          try {
            value = JSON.parse(config.config_value);
          } catch {
            value = config.config_value;
          }
          break;
        default:
          value = config.config_value;
      }

      return {
        ...config,
        value,
      };
    });

    return NextResponse.json(formattedConfigurations || []);
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

