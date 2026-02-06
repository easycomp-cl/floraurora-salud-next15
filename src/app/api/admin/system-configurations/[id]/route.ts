import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

/**
 * Actualizar una configuración individual
 * PATCH /api/admin/system-configurations/[id]
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que sea admin
    const actorId = await getAdminActorId(request);
    if (!actorId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await context.params;
    const configId = parseInt(id, 10);

    if (isNaN(configId)) {
      return NextResponse.json(
        { error: "ID de configuración inválido" },
        { status: 400 }
      );
    }

    const supabase = createAdminServer();
    const body = await request.json();
    const { config_value, is_active } = body;

    // Validar que se proporcione al menos un campo para actualizar
    if (config_value === undefined && is_active === undefined) {
      return NextResponse.json(
        { error: "Debe proporcionar config_value o is_active" },
        { status: 400 }
      );
    }

    // Construir objeto de actualización
    const updateData: {
      config_value?: string;
      is_active?: boolean;
      updated_by: number;
    } = {
      updated_by: actorId,
    };

    if (config_value !== undefined) {
      updateData.config_value = String(config_value);
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    // Actualizar la configuración
    const { data: updatedConfig, error: updateError } = await supabase
      .from("system_configurations")
      .update(updateData)
      .eq("id", configId)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error actualizando configuración:", updateError);
      return NextResponse.json(
        { error: `Error al actualizar la configuración: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updatedConfig) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // Formatear el valor según su tipo de dato
    let value: string | number | boolean | object = updatedConfig.config_value;

    switch (updatedConfig.data_type) {
      case "number":
        value = Number(updatedConfig.config_value);
        break;
      case "boolean":
        value =
          updatedConfig.config_value === "true" ||
          updatedConfig.config_value === "1";
        break;
      case "json":
        try {
          value = JSON.parse(updatedConfig.config_value);
        } catch {
          value = updatedConfig.config_value;
        }
        break;
      default:
        value = updatedConfig.config_value;
    }

    return NextResponse.json({
      ...updatedConfig,
      value,
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
