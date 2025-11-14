import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";
import { auditService } from "@/lib/services/auditService";
import { getAdminActorId } from "@/lib/auth/getAdminActor";
import type { AdminRole, AdminUserStatus } from "@/lib/types/admin";

const parseRole = (value: string | null): AdminRole | "all" | undefined => {
  if (!value) return undefined;
  if (["admin", "patient", "professional"].includes(value)) {
    return value as AdminRole;
  }
  if (value === "all") {
    return "all";
  }
  return undefined;
};

const parseStatus = (value: string | null): AdminUserStatus | "all" | undefined => {
  if (!value) return undefined;
  if (["active", "inactive", "blocked", "pending"].includes(value)) {
    return value as AdminUserStatus;
  }
  if (value === "all") {
    return "all";
  }
  return undefined;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
    const search = url.searchParams.get("search") ?? undefined;
    const role = parseRole(url.searchParams.get("role"));
    const status = parseStatus(url.searchParams.get("status"));

    const result = await adminService.listUsers({
      page: Number.isNaN(page) ? 1 : page,
      pageSize: Number.isNaN(pageSize) ? 20 : pageSize,
      search,
      role,
      status,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/users] Error", error);
    const message = error instanceof Error ? error.message : "Error interno al listar usuarios";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.email || !body?.password || !body?.role) {
      return NextResponse.json(
        { error: "Los campos email, password y role son obligatorios." },
        { status: 400 },
      );
    }

    const user = await adminService.createUser({
      email: String(body.email),
      password: String(body.password),
      role: String(body.role) as AdminRole,
      name: body.name ? String(body.name) : undefined,
      last_name: body.last_name ? String(body.last_name) : undefined,
      phone_number: body.phone_number ? String(body.phone_number) : undefined,
      rut: body.rut ? String(body.rut) : undefined,
    });

    const actorId = await getAdminActorId();
    await auditService.log({
      actorId,
      action: "create_user",
      entity: "users",
      entityId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/users] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al crear el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

