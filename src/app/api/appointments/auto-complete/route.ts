import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { DateTime } from "luxon";

/**
 * POST /api/appointments/auto-complete
 * Marca automáticamente como completadas las citas que ya pasaron su fecha programada
 * Solo profesionales pueden usar este endpoint
 * Solo marca citas en estado "pending_confirmation" o "confirmed" que no estén canceladas
 */
export async function POST(request: NextRequest) {
  try {
    // Debug: Verificar cookies disponibles
    const requestCookies = request.cookies.getAll();
    const hasSupabaseCookies = requestCookies.some(c => 
      c.name.includes('supabase') || c.name.includes('sb-') || c.name.includes('auth-token')
    );
    
    // Intentar crear cliente con request primero, luego sin request como fallback
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      console.warn("[auto-complete] Fallback a createClient sin request:", error);
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
      console.error("[auto-complete] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
        hasSupabaseCookies,
        cookieCount: requestCookies.length,
        cookieNames: requestCookies.map(c => c.name).filter(n => 
          n.includes('supabase') || n.includes('sb-') || n.includes('auth-token')
        ),
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el perfil del usuario usando finalUser
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario sea profesional (role = 3)
    if (profile.role !== 3) {
      return NextResponse.json(
        { error: "Solo los profesionales pueden usar este endpoint" },
        { status: 403 }
      );
    }

    // Obtener la fecha y hora actual en la zona horaria de Chile
    const now = DateTime.now().setZone("America/Santiago");
    const nowISO = now.toISO();

    if (!nowISO) {
      return NextResponse.json(
        { error: "Error al obtener la fecha actual" },
        { status: 500 }
      );
    }

    // Usar cliente admin para evitar problemas de RLS
    const adminSupabase = createAdminServer();

    // Buscar citas del profesional que:
    // 1. Estén en estado "pending_confirmation" o "confirmed"
    // 2. No estén canceladas
    // 3. Ya haya pasado su fecha programada (scheduled_at <= ahora)
    const { data: appointmentsToComplete, error: fetchError } = await adminSupabase
      .from("appointments")
      .select("id, scheduled_at, status")
      .eq("professional_id", profile.id)
      .in("status", ["pending_confirmation", "confirmed"])
      .lte("scheduled_at", nowISO);

    if (fetchError) {
      console.error("Error obteniendo citas para completar:", fetchError);
      return NextResponse.json(
        { error: "Error al obtener las citas" },
        { status: 500 }
      );
    }

    if (!appointmentsToComplete || appointmentsToComplete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay citas pendientes de completar",
        completed: 0,
      });
    }

    // Marcar todas las citas encontradas como completadas
    const appointmentIds = appointmentsToComplete.map((apt) => apt.id);
    const { error: updateError } = await adminSupabase
      .from("appointments")
      .update({ status: "completed" })
      .in("id", appointmentIds);

    if (updateError) {
      console.error("Error marcando citas como completadas:", updateError);
      return NextResponse.json(
        { error: "Error al marcar las citas como completadas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${appointmentIds.length} cita(s) marcada(s) como completada(s)`,
      completed: appointmentIds.length,
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
