import { createAdminServer } from "@/utils/supabase/server";
import type { BHEEnqueueData } from "@/lib/validations/bhe";

/**
 * Tipo para un job de BHE
 */
export type BHEJob = {
  id: string;
  payment_id: string;
  appointment_id: string | null;
  professional_id: number;
  patient_id: number | null;
  patient_rut: string | null;
  amount: number;
  glosa: string;
  issue_date: string;
  status: "queued" | "processing" | "done" | "failed" | "retrying";
  attempts: number;
  next_run_at: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  result_folio: string | null;
  folio: string | null;
  result_pdf_bucket: string | null;
  result_pdf_path: string | null;
  last_error: string | null;
  email_status: "pending" | "sent" | "failed" | null;
  professional_rut: string | null;
  professional_address: string | null;
  professional_region: number | null;
  professional_comuna: number | null;
  patient_names: string | null;
  patient_address: string | null;
  patient_region: number | null;
  patient_comuna: number | null;
  patient_email: string | null;
  service_date: string | null;
  service_detail: string | null;
  codigo_barras: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/**
 * Servicio para manejar Boletas de Honorarios Electrónicas (BHE)
 */
export class BHEService {
  /**
   * Encolar un nuevo job de BHE
   * @param data Datos del job a encolar
   * @returns El job creado
   */
  static async enqueueJob(data: BHEEnqueueData): Promise<BHEJob> {
    const admin = createAdminServer();
    
    // Normalizar issue_date si no se proporciona
    const issueDate = data.issue_date || new Date().toISOString().split('T')[0];
    
    const { data: job, error } = await admin
      .from("bhe_jobs")
      .insert({
        payment_id: data.payment_id,
        appointment_id: data.appointment_id || null,
        professional_id: data.professional_id,
        patient_id: data.patient_id || null,
        patient_rut: data.patient_rut || null,
        amount: data.amount,
        glosa: data.glosa,
        issue_date: issueDate,
        status: "queued",
        next_run_at: new Date().toISOString(), // Disponible inmediatamente
        email_status: "pending",
        professional_rut: data.professional_rut || null,
        professional_address: data.professional_address || null,
        professional_region: data.professional_region || null,
        professional_comuna: data.professional_comuna || null,
        patient_names: data.patient_names || null,
        patient_address: data.patient_address || null,
        patient_region: data.patient_region || null,
        patient_comuna: data.patient_comuna || null,
        patient_email: data.patient_email || null,
        service_date: data.service_date || null,
        service_detail: data.service_detail || null,
        metadata: data.metadata || null,
      })
      .select()
      .single();
    
    if (error) {
      // Si es error de constraint única (payment_id duplicado), es idempotencia
      if (error.code === "23505") {
        // Buscar el job existente
        const { data: existingJob } = await admin
          .from("bhe_jobs")
          .select()
          .eq("payment_id", data.payment_id)
          .single();
        
        if (existingJob) {
          return existingJob as BHEJob;
        }
      }
      
      throw new Error(`Error al encolar job de BHE: ${error.message}`);
    }
    
    if (!job) {
      throw new Error("No se pudo crear el job de BHE");
    }
    
    return job as BHEJob;
  }
  
  /**
   * Obtener jobs de BHE para un profesional
   * @param professionalId ID del profesional
   * @param status Filtro opcional por estado
   * @returns Lista de jobs
   */
  static async getJobsByProfessional(
    professionalId: number,
    status?: BHEJob["status"]
  ): Promise<BHEJob[]> {
    const admin = createAdminServer();
    
    let query = admin
      .from("bhe_jobs")
      .select()
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error al obtener jobs de BHE: ${error.message}`);
    }
    
    return (data || []) as BHEJob[];
  }
  
  /**
   * Obtener un job por ID
   * @param jobId ID del job
   * @returns El job o null si no existe
   */
  static async getJobById(jobId: string): Promise<BHEJob | null> {
    const admin = createAdminServer();
    
    const { data, error } = await admin
      .from("bhe_jobs")
      .select()
      .eq("id", jobId)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener job de BHE: ${error.message}`);
    }
    
    return data as BHEJob;
  }
  
  /**
   * Generar una URL firmada (signed URL) para descargar el PDF de una boleta
   * @param jobId ID del job
   * @param expiresIn Segundos hasta que expire la URL (default: 1 hora)
   * @returns URL firmada o null si no hay PDF
   */
  static async getPDFSignedUrl(
    jobId: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    const job = await this.getJobById(jobId);
    
    if (!job || job.status !== "done" || !job.result_pdf_path || !job.result_pdf_bucket) {
      return null;
    }
    
    const admin = createAdminServer();
    
    const { data, error } = await admin.storage
      .from(job.result_pdf_bucket)
      .createSignedUrl(job.result_pdf_path, expiresIn);
    
    if (error || !data?.signedUrl) {
      console.error("Error al generar URL firmada:", error);
      return null;
    }
    
    return data.signedUrl;
  }
  
  /**
   * Reclamar un job para procesamiento (usado por workers externos)
   * @param workerId Identificador único del worker
   * @returns El job reclamado o null si no hay jobs disponibles
   */
  static async claimJob(workerId: string): Promise<BHEJob | null> {
    const admin = createAdminServer();
    
    // Llamar a la función SQL claim_bhe_job
    const { data, error } = await admin.rpc("claim_bhe_job", {
      worker_id: workerId,
    });
    
    if (error) {
      throw new Error(`Error al reclamar job: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return null; // No hay jobs disponibles
    }
    
    return data[0] as BHEJob;
  }
  
  /**
   * Marcar un job como completado (usado por workers externos)
   * @param jobId ID del job
   * @param folio Folio de la boleta emitida
   * @param pdfBucket Bucket donde se almacenó el PDF
   * @param pdfPath Ruta del PDF en Storage
   */
  static async completeJob(
    jobId: string,
    folio: string,
    pdfBucket: string,
    pdfPath: string
  ): Promise<void> {
    const admin = createAdminServer();
    
    // Llamar a la función SQL complete_bhe_job
    const { error } = await admin.rpc("complete_bhe_job", {
      job_id: jobId,
      folio,
      pdf_bucket: pdfBucket,
      pdf_path: pdfPath,
    });
    
    if (error) {
      throw new Error(`Error al completar job: ${error.message}`);
    }
  }
  
  /**
   * Marcar un job como fallido y programar reintento (usado por workers externos)
   * @param jobId ID del job
   * @param errorMessage Mensaje de error
   * @param maxAttempts Número máximo de intentos (default: 5)
   */
  static async failJob(
    jobId: string,
    errorMessage: string,
    maxAttempts: number = 5
  ): Promise<void> {
    const admin = createAdminServer();
    
    // Llamar a la función SQL fail_bhe_job
    const { error } = await admin.rpc("fail_bhe_job", {
      job_id: jobId,
      error_message: errorMessage,
      max_attempts: maxAttempts,
    });
    
    if (error) {
      throw new Error(`Error al marcar job como fallido: ${error.message}`);
    }
  }
}

