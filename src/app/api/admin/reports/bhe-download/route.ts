import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * API Route: GET /api/admin/reports/bhe-download
 * 
 * Genera una URL firmada para descargar el PDF de una boleta de BHE desde el bucket "invoices".
 * 
 * Requisitos:
 * - Usuario autenticado como administrador
 * - El PDF debe existir en el bucket "invoices" con el path proporcionado
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfPath = searchParams.get("path");
    
    if (!pdfPath) {
      return NextResponse.json(
        { error: "El path del PDF es requerido" },
        { status: 400 }
      );
    }
    
    const admin = createAdminServer();
    
    // Generar URL firmada (válida por 1 hora)
    const { data, error } = await admin.storage
      .from("invoices")
      .createSignedUrl(pdfPath, 3600);
    
    if (error || !data?.signedUrl) {
      console.error("Error al generar URL firmada:", error);
      return NextResponse.json(
        { error: "Error al generar URL de descarga" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      download_url: data.signedUrl,
      expires_in: 3600, // segundos
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
