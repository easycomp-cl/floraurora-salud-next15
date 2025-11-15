import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const onlyActive = url.searchParams.get("onlyActive") === "true";
    const services = await adminService.listServices(onlyActive);
    return NextResponse.json(services);
  } catch (error) {
    console.error("[GET /api/admin/services] Error completo:", error);
    const message =
      error instanceof Error 
        ? error.message 
        : "Error interno al listar servicios";
    
    // Si el error es que la tabla no existe, devolver array vacío en lugar de error
    if (message.includes("Could not find the table") || message.includes("does not exist")) {
      console.warn("[GET /api/admin/services] Tabla services no existe, devolviendo array vacío");
      return NextResponse.json({ data: [], total: 0 });
    }
    
    const details = error instanceof Error && error.stack 
      ? error.stack 
      : String(error);
    console.error("[GET /api/admin/services] Detalles:", details);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name) {
      return NextResponse.json(
        { error: "El campo name es obligatorio." },
        { status: 400 },
      );
    }

    if (!body?.title_id) {
      return NextResponse.json(
        { error: "El campo title_id (área/título) es obligatorio." },
        { status: 400 },
      );
    }

    const service = await adminService.createService({
      name: String(body.name),
      slug: body.slug ? String(body.slug) : undefined,
      description: body.description ? String(body.description) : undefined,
      minimum_amount: body.minimum_amount !== undefined && body.minimum_amount !== null ? Number(body.minimum_amount) : null,
      maximum_amount: body.maximum_amount !== undefined && body.maximum_amount !== null ? Number(body.maximum_amount) : null,
      duration_minutes: body.duration_minutes ? Number(body.duration_minutes) : undefined,
      is_active: typeof body.is_active === "boolean" ? body.is_active : true,
      title_id: body.title_id ? Number(body.title_id) : undefined,
      title_name: body.title_name ? String(body.title_name) : undefined,
    });

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "create_service",
      entity: "services",
      entityId: service.id,
      metadata: service as unknown as Record<string, unknown>,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/services] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al crear el servicio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

