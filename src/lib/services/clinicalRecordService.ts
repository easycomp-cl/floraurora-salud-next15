import { createAdminServer } from "@/utils/supabase/server";

// Tipos para fichas de ingreso
export interface PatientIntakeRecord {
  id: string;
  patient_id: number;
  professional_id: number;
  full_name?: string | null;
  rut?: string | null;
  birth_date?: string | null;
  age?: number | null;
  gender?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  medical_history?: string | null;
  family_history?: string | null;
  consultation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntakeRecordData {
  patient_id: number;
  professional_id: number;
  full_name?: string;
  rut?: string;
  birth_date?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  medical_history?: string;
  family_history?: string;
  consultation_reason?: string;
}

export interface UpdateIntakeRecordData {
  full_name?: string;
  rut?: string;
  birth_date?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  medical_history?: string;
  family_history?: string;
  consultation_reason?: string;
}

// Tipos para fichas de evolución
export interface ClinicalEvolutionRecord {
  id: string;
  appointment_id: string;
  professional_id: number;
  patient_id: number;
  notes?: string | null;
  evolution?: string | null;
  observations?: string | null;
  diagnosis?: string | null;
  session_development?: string | null;
  treatment_applied?: string | null;
  next_session_indications?: string | null;
  medical_history?: string | null;
  family_history?: string | null;
  consultation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEvolutionRecordData {
  appointment_id: string;
  professional_id: number;
  patient_id: number;
  notes?: string;
  evolution?: string;
  observations?: string;
  diagnosis?: string;
  session_development?: string;
  treatment_applied?: string;
  next_session_indications?: string;
}

export interface UpdateEvolutionRecordData {
  notes?: string;
  evolution?: string;
  observations?: string;
  diagnosis?: string;
  session_development?: string;
  treatment_applied?: string;
  next_session_indications?: string;
}

// Tipo para historial clínico completo
export interface ClinicalHistory {
  intakeRecord: PatientIntakeRecord | null;
  evolutionRecords: ClinicalEvolutionRecord[];
}

// Tipo para logs de acceso
export interface AccessLogData {
  clinical_record_id?: string;
  intake_record_id?: string;
  professional_id: number;
  action: "view" | "create" | "update" | "delete";
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

export const clinicalRecordService = {
  /**
   * Obtiene la ficha de ingreso de un paciente para un profesional específico
   */
  async getIntakeRecord(
    patientId: number,
    professionalId: number
  ): Promise<PatientIntakeRecord | null> {
    const supabase = createAdminServer();

    const { data, error } = await supabase
      .from("patient_intake_records")
      .select("*")
      .eq("patient_id", patientId)
      .eq("professional_id", professionalId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró registro, retornar null
        return null;
      }
      console.error("Error obteniendo ficha de ingreso:", error);
      throw error;
    }

    return data as PatientIntakeRecord;
  },

  /**
   * Crea una nueva ficha de ingreso
   */
  async createIntakeRecord(
    data: CreateIntakeRecordData
  ): Promise<PatientIntakeRecord> {
    const supabase = createAdminServer();

    const { data: record, error } = await supabase
      .from("patient_intake_records")
      .insert({
        patient_id: data.patient_id,
        professional_id: data.professional_id,
        full_name: data.full_name || null,
        rut: data.rut || null,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        medical_history: data.medical_history || null,
        family_history: data.family_history || null,
        consultation_reason: data.consultation_reason || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando ficha de ingreso:", error);
      throw error;
    }

    return record as PatientIntakeRecord;
  },

  /**
   * Actualiza una ficha de ingreso existente
   */
  async updateIntakeRecord(
    patientId: number,
    professionalId: number,
    data: UpdateIntakeRecordData
  ): Promise<PatientIntakeRecord> {
    const supabase = createAdminServer();

    const updateData: Record<string, unknown> = {};
    if (data.full_name !== undefined) updateData.full_name = data.full_name || null;
    if (data.rut !== undefined) updateData.rut = data.rut || null;
    if (data.birth_date !== undefined) updateData.birth_date = data.birth_date || null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.medical_history !== undefined) updateData.medical_history = data.medical_history || null;
    if (data.family_history !== undefined) updateData.family_history = data.family_history || null;
    if (data.consultation_reason !== undefined) updateData.consultation_reason = data.consultation_reason || null;

    const { data: record, error } = await supabase
      .from("patient_intake_records")
      .update(updateData)
      .eq("patient_id", patientId)
      .eq("professional_id", professionalId)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando ficha de ingreso:", error);
      throw error;
    }

    return record as PatientIntakeRecord;
  },

  /**
   * Obtiene la ficha de evolución de una sesión específica
   */
  async getEvolutionRecord(
    appointmentId: string
  ): Promise<ClinicalEvolutionRecord | null> {
    const supabase = createAdminServer();

    const { data, error } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("appointment_id", appointmentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No se encontró registro, retornar null
        return null;
      }
      console.error("Error obteniendo ficha de evolución:", error);
      throw error;
    }

    return data as ClinicalEvolutionRecord;
  },

  /**
   * Crea o actualiza una ficha de evolución
   */
  async createOrUpdateEvolutionRecord(
    appointmentId: string,
    data: CreateEvolutionRecordData | UpdateEvolutionRecordData,
    isUpdate: boolean = false
  ): Promise<ClinicalEvolutionRecord> {
    const supabase = createAdminServer();

    if (isUpdate) {
      // Actualizar registro existente
      const updateData: Record<string, unknown> = {};
      if ("notes" in data) updateData.notes = data.notes || null;
      if ("evolution" in data) updateData.evolution = data.evolution || null;
      if ("observations" in data) updateData.observations = data.observations || null;
      if ("diagnosis" in data) updateData.diagnosis = data.diagnosis || null;
      if ("session_development" in data) updateData.session_development = data.session_development || null;
      if ("treatment_applied" in data) updateData.treatment_applied = data.treatment_applied || null;
      if ("next_session_indications" in data) updateData.next_session_indications = data.next_session_indications || null;

      const { data: record, error } = await supabase
        .from("clinical_records")
        .update(updateData)
        .eq("appointment_id", appointmentId)
        .select()
        .single();

      if (error) {
        console.error("Error actualizando ficha de evolución:", error);
        throw error;
      }

      return record as ClinicalEvolutionRecord;
    } else {
      // Crear nuevo registro
      const createData = data as CreateEvolutionRecordData;
      const { data: record, error } = await supabase
        .from("clinical_records")
        .insert({
          appointment_id: appointmentId,
          professional_id: createData.professional_id,
          patient_id: createData.patient_id,
          notes: createData.notes || null,
          evolution: createData.evolution || null,
          observations: createData.observations || null,
          diagnosis: createData.diagnosis || null,
          session_development: createData.session_development || null,
          treatment_applied: createData.treatment_applied || null,
          next_session_indications: createData.next_session_indications || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creando ficha de evolución:", error);
        throw error;
      }

      return record as ClinicalEvolutionRecord;
    }
  },

  /**
   * Obtiene el historial clínico completo de un paciente para un profesional
   */
  async getClinicalHistory(
    patientId: number,
    professionalId: number
  ): Promise<ClinicalHistory> {
    const supabase = createAdminServer();

    // Obtener ficha de ingreso
    const intakeRecord = await this.getIntakeRecord(patientId, professionalId);

    // Obtener todas las fichas de evolución del paciente con este profesional
    const { data: evolutionRecords, error } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("patient_id", patientId)
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error obteniendo historial clínico:", error);
      throw error;
    }

    return {
      intakeRecord,
      evolutionRecords: (evolutionRecords || []) as ClinicalEvolutionRecord[],
    };
  },

  /**
   * Registra un acceso o modificación en los logs de auditoría
   */
  async logAccess(logData: AccessLogData): Promise<void> {
    const supabase = createAdminServer();

    const { error } = await supabase.from("clinical_record_access_logs").insert({
      clinical_record_id: logData.clinical_record_id || null,
      intake_record_id: logData.intake_record_id || null,
      professional_id: logData.professional_id,
      action: logData.action,
      ip_address: logData.ip_address || null,
      user_agent: logData.user_agent || null,
      metadata: logData.metadata || null,
    });

    if (error) {
      console.error("Error registrando acceso en logs:", error);
      // No lanzar error para no interrumpir el flujo principal
    }
  },

  /**
   * Verifica si existe una ficha de ingreso para un paciente-profesional
   */
  async intakeRecordExists(
    patientId: number,
    professionalId: number
  ): Promise<boolean> {
    const supabase = createAdminServer();

    const { data, error } = await supabase
      .from("patient_intake_records")
      .select("id")
      .eq("patient_id", patientId)
      .eq("professional_id", professionalId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("Error verificando existencia de ficha de ingreso:", error);
      throw error;
    }

    return !!data;
  },
};

