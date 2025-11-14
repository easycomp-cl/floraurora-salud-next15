import { NextResponse } from "next/server";
import { adminService } from "@/lib/services/adminService";

export async function GET() {
  try {
    const professionals = await adminService.listProfessionals();
    return NextResponse.json({ data: professionals });
  } catch (error) {
    console.error("[GET /api/admin/professionals] Error completo:", error);
    const message =
      error instanceof Error 
        ? error.message 
        : "Error interno al listar profesionales";
    const details = error instanceof Error && error.stack 
      ? error.stack 
      : String(error);
    console.error("[GET /api/admin/professionals] Detalles:", details);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

