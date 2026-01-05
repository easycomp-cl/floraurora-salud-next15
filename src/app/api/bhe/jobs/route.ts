import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { BHEService } from "@/lib/services/bheService";

/**
 * API Route: GET /api/bhe/jobs
 * 
 * Obtiene la lista de jobs de BHE para el profesional autenticado.
 * 
 * Query params:
 * - status: Filtro opcional por estado (queued, processing, done, failed, retrying)
 * 
 * Requisitos:
 * - Usuario autenticado
 * - Debe ser un profesional
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }
    
    // Obtener información del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", user.id)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar si es profesional o admin
    const isProfessional = userData.role === 2; // Asumiendo que role 2 = profesional
    const isAdmin = userData.role === 1; // Asumiendo que role 1 = admin
    
    if (!isProfessional && !isAdmin) {
      return NextResponse.json(
        { error: "No autorizado. Solo profesionales pueden ver sus boletas." },
        { status: 403 }
      );
    }
    
    // Obtener professional_id
    let professionalId: number;
    
    if (isAdmin) {
      // Si es admin, puede filtrar por professional_id en query params
      const { searchParams } = new URL(request.url);
      const professionalIdParam = searchParams.get("professional_id");
      
      if (!professionalIdParam) {
        return NextResponse.json(
          { error: "Los administradores deben especificar professional_id" },
          { status: 400 }
        );
      }
      
      professionalId = parseInt(professionalIdParam, 10);
    } else {
      // Si es profesional, obtener su ID
      const { data: professionalData, error: professionalError } = await supabase
        .from("professionals")
        .select("id")
        .eq("id", userData.id)
        .single();
      
      if (professionalError || !professionalData) {
        return NextResponse.json(
          { error: "Profesional no encontrado" },
          { status: 404 }
        );
      }
      
      professionalId = professionalData.id;
    }
    
    // Obtener filtro de estado opcional
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam as "queued" | "processing" | "done" | "failed" | "retrying" | undefined;
    
    // Validar status si se proporciona
    if (statusParam && !["queued", "processing", "done", "failed", "retrying"].includes(statusParam)) {
      return NextResponse.json(
        { error: "Estado inválido. Debe ser: queued, processing, done, failed, retrying" },
        { status: 400 }
      );
    }
    
    // Obtener jobs
    const jobs = await BHEService.getJobsByProfessional(professionalId, status);
    
    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
    
  } catch (error: unknown) {
    console.error("❌ [BHE Jobs] Error al obtener jobs:", error);
    
    return NextResponse.json(
      {
        error: "Error al obtener jobs de BHE",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

