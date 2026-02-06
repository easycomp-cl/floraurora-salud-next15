import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function GET(request: NextRequest) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabase = createAdminServer();

    // Obtener todas las configuraciones (solo admin puede ver todas)
    const { data: configurations, error } = await supabase
      .from("system_configurations")
      .select("*")
      .order("category", { ascending: true })
      .order("config_key", { ascending: true });

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

export async function PUT(request: NextRequest) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabase = createAdminServer();

    const body = await request.json();
    const { configurations } = body;

    if (!Array.isArray(configurations)) {
      return NextResponse.json(
        { error: "Formato inválido. Se espera un array de configuraciones." },
        { status: 400 }
      );
    }

    // Actualizar cada configuración
    const updatePromises = configurations.map(async (config: { id: number; config_value: string; is_active?: boolean }) => {
      const updateData: { config_value: string; updated_by?: number; is_active?: boolean } = {
        config_value: config.config_value,
        updated_by: actorId,
      };

      if (config.is_active !== undefined) {
        updateData.is_active = config.is_active;
      }

      const { error } = await supabase
        .from("system_configurations")
        .update(updateData)
        .eq("id", config.id);

      if (error) {
        throw new Error(`Error actualizando configuración ${config.id}: ${error.message}`);
      }
    });

    await Promise.all(updatePromises);

    // Obtener las configuraciones actualizadas
    const { data: updatedConfigurations, error: fetchError } = await supabase
      .from("system_configurations")
      .select("*")
      .order("category", { ascending: true })
      .order("config_key", { ascending: true });

    if (fetchError) {
      throw new Error(`Error obteniendo configuraciones actualizadas: ${fetchError.message}`);
    }

    // Formatear las configuraciones
    const formattedConfigurations = updatedConfigurations?.map((config) => {
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
    console.error("Error actualizando configuraciones:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

