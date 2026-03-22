import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { BHEService } from "@/lib/services/bheService";

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request?.headers?.get?.("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerToken) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
    if (!error && user) return user;
  }
  const supabase = await createClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * API Route: GET /api/bhe/jobs/[id]/download
 * 
 * Genera una URL firmada para descargar el PDF de una boleta de BHE.
 * 
 * Requisitos:
 * - Usuario autenticado (Bearer token o cookies)
 * - Debe ser el profesional dueño de la boleta o el paciente asociado
 * - El job debe estar en estado 'done' y tener PDF disponible
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID del job es requerido" },
        { status: 400 }
      );
    }
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const supabase = await createClient(request);
    
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
    
    // Obtener el job
    const job = await BHEService.getJobById(id);
    
    if (!job) {
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }
    
    // Verificar permisos (role 1=admin, 2=paciente, 3=profesional)
    const isAdmin = userData.role === 1;
    const isProfessional = userData.role === 3;
    const isPatient = userData.role === 2;
    
    let hasPermission = false;
    
    if (isAdmin) {
      hasPermission = true;
    } else if (isProfessional) {
      // Verificar si el profesional es el dueño del job
      const { data: professionalData } = await supabase
        .from("professionals")
        .select("id")
        .eq("id", userData.id)
        .single();
      
      hasPermission = professionalData?.id === job.professional_id;
    } else if (isPatient && job.patient_id) {
      // Verificar si el paciente es el asociado al job
      const { data: patientData } = await supabase
        .from("patients")
        .select("id")
        .eq("id", userData.id)
        .single();
      
      hasPermission = patientData?.id === job.patient_id;
    }
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: "No autorizado para descargar esta boleta" },
        { status: 403 }
      );
    }
    
    // Verificar que el job esté completado y tenga PDF
    if (job.status !== "done") {
      return NextResponse.json(
        {
          error: "La boleta aún no está disponible",
          status: job.status,
        },
        { status: 400 }
      );
    }
    
    if (!job.result_pdf_path || !job.result_pdf_bucket) {
      return NextResponse.json(
        { error: "El PDF de la boleta no está disponible" },
        { status: 404 }
      );
    }
    
    // Generar URL firmada (válida por 1 hora)
    const signedUrl = await BHEService.getPDFSignedUrl(id, 3600);
    
    if (!signedUrl) {
      return NextResponse.json(
        { error: "Error al generar URL de descarga" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      download_url: signedUrl,
      expires_in: 3600, // segundos
      folio: job.result_folio,
    });
    
  } catch (error: unknown) {
    console.error("❌ [BHE Download] Error al generar URL de descarga:", error);
    
    return NextResponse.json(
      {
        error: "Error al generar URL de descarga",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

