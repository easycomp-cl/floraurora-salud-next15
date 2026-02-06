import { NextRequest, NextResponse } from "next/server";
import { validateAuth } from "@/utils/supabase/auth-validation";
import { createAdminServer } from "@/utils/supabase/server";
import type { SatisfactionSurvey } from "@/lib/services/satisfactionSurveyService";

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación y obtener usuario
    const authResult = await validateAuth(request);
    
    if (!authResult.isValid || !authResult.userRecordId) {
      console.error("❌ [admin/ratings] Validación de autenticación fallida:", {
        isValid: authResult.isValid,
        userRecordId: authResult.userRecordId,
        error: authResult.error,
        hasHeader: !!request.headers.get("X-User-ID"),
        headerValue: request.headers.get("X-User-ID"),
      });
      
      return NextResponse.json(
        { error: authResult.error || "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que el usuario es admin
    const adminSupabase = createAdminServer();
    const { data: user, error: userError } = await adminSupabase
      .from("users")
      .select("role")
      .eq("id", authResult.userRecordId)
      .single();

    if (userError || !user || user.role !== 1) {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden acceder." },
        { status: 403 }
      );
    }

    // Obtener todas las encuestas usando el servidor admin (bypass RLS)
    const { data: surveys, error: surveysError } = await adminSupabase
      .from("satisfaction_surveys")
      .select("*")
      .order("created_at", { ascending: false });

    if (surveysError) {
      console.error("Error obteniendo encuestas:", surveysError);
      return NextResponse.json(
        { error: "Error al obtener las encuestas", details: surveysError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: surveys as SatisfactionSurvey[],
    });
  } catch (error) {
    console.error("Error en GET /api/admin/ratings:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
