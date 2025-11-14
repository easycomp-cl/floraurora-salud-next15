import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rut = searchParams.get("rut");
    const email = searchParams.get("email");

    if (!rut) {
      return NextResponse.json(
        { error: "RUT es requerido" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // 1. PRIMERO: Verificar si existe una solicitud pendiente o rechazada con este RUT
    const { data: pendingRequest, error: requestError } = await admin
      .from("professional_requests")
      .select("id, status, email, full_name, created_at")
      .eq("rut", rut)
      .in("status", ["pending", "resubmitted", "rejected"])
      .maybeSingle();

    if (requestError) {
      console.error("Error al verificar solicitud:", requestError);
      return NextResponse.json(
        { error: "Error al verificar solicitud" },
        { status: 500 }
      );
    }

    // Si hay solicitud pendiente o reenviada, retornar eso primero
    if (pendingRequest && (pendingRequest.status === "pending" || pendingRequest.status === "resubmitted")) {
      return NextResponse.json({
        type: "pending_request",
        exists: true,
        request: {
          id: pendingRequest.id,
          status: pendingRequest.status,
          email: pendingRequest.email,
          full_name: pendingRequest.full_name,
          created_at: pendingRequest.created_at,
        },
      });
    }

    // 2. SEGUNDO: Verificar si existe un usuario con este RUT en la tabla users
    const { data: userByRut, error: userRutError } = await admin
      .from("users")
      .select("id, email, name, last_name, role")
      .eq("rut", rut)
      .maybeSingle();

    if (userRutError) {
      console.error("Error al verificar usuario por RUT:", userRutError);
      // Continuar con otras validaciones
    }

    if (userByRut) {
      return NextResponse.json({
        type: "existing_user_rut",
        exists: true,
        user: {
          id: userByRut.id,
          email: userByRut.email,
          name: userByRut.name,
          last_name: userByRut.last_name,
          role: userByRut.role,
        },
      });
    }

    // 3. TERCERO: Si se proporciona email, verificar si existe un usuario con ese email
    if (email) {
      const { data: userByEmail, error: userEmailError } = await admin
        .from("users")
        .select("id, email, name, last_name, role, rut")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      if (userEmailError) {
        console.error("Error al verificar usuario por email:", userEmailError);
        // Continuar
      }

      if (userByEmail) {
        return NextResponse.json({
          type: "existing_user_email",
          exists: true,
          user: {
            id: userByEmail.id,
            email: userByEmail.email,
            name: userByEmail.name,
            last_name: userByEmail.last_name,
            role: userByEmail.role,
            rut: userByEmail.rut,
          },
        });
      }
    }

    // Si no hay ningún problema, retornar que no existe
    return NextResponse.json({
      type: "none",
      exists: false,
    });
  } catch (error) {
    console.error("[GET /api/check-professional-request] Error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error interno al verificar solicitud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

