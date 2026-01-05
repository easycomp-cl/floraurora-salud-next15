import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { bheEnqueueSchema, type BHEEnqueueData } from "@/lib/validations/bhe";
import { BHEService } from "@/lib/services/bheService";

/**
 * API Route: POST /api/bhe/enqueue
 * 
 * Encola un nuevo job de BHE para procesamiento por el robot RPA externo.
 * 
 * Requisitos:
 * - Solo puede ser llamado desde el servidor (service role)
 * - Valida idempotencia mediante payment_id único
 * 
 * Uso:
 * - Llamado internamente cuando se confirma un pago exitoso
 * - Puede ser llamado desde webhooks de pagos
 */
export async function POST(request: NextRequest) {
  let validatedData: BHEEnqueueData | null = null;
  
  try {
    const body = await request.json();
    
    // Validar payload con Zod
    validatedData = bheEnqueueSchema.parse(body);
    
    console.log("📋 [BHE Enqueue] Recibida solicitud para encolar job:", {
      payment_id: validatedData.payment_id,
      professional_id: validatedData.professional_id,
      amount: validatedData.amount,
    });
    
    // Encolar el job (el servicio maneja la idempotencia)
    const job = await BHEService.enqueueJob(validatedData);
    
    console.log("✅ [BHE Enqueue] Job encolado exitosamente:", {
      job_id: job.id,
      payment_id: job.payment_id,
      status: job.status,
    });
    
    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        payment_id: job.payment_id,
        status: job.status,
        created_at: job.created_at,
      },
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error("❌ [BHE Enqueue] Error al encolar job:", error);
    
    // Si es error de validación de Zod
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: (error as { errors: unknown[] }).errors,
        },
        { status: 400 }
      );
    }
    
    // Si es error de constraint única (idempotencia)
    if (
      error instanceof Error &&
      error.message.includes("23505") &&
      validatedData
    ) {
      // Buscar el job existente
      try {
        const admin = createAdminServer();
        const { data: existingJob } = await admin
          .from("bhe_jobs")
          .select("id, payment_id, status, created_at")
          .eq("payment_id", validatedData.payment_id)
          .single();
        
        if (existingJob) {
          return NextResponse.json({
            success: true,
            job: existingJob,
            message: "Job ya existe (idempotencia)",
          }, { status: 200 });
        }
      } catch {
        // Continuar con el error original
      }
    }
    
    return NextResponse.json(
      {
        error: "Error al encolar job de BHE",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

