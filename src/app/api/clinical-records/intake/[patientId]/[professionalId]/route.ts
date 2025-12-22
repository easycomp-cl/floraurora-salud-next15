import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { clinicalRecordService } from "@/lib/services/clinicalRecordService";
import type { CreateIntakeRecordData, UpdateIntakeRecordData } from "@/lib/services/clinicalRecordService";

/**
 * GET /api/clinical-records/intake/[patientId]/[professionalId]
 * Obtiene la ficha de ingreso de un paciente para un profesional específico
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ patientId: string; professionalId: string }> }
) {
  try {
    const { patientId, professionalId } = await context.params;
    const patientIdNum = parseInt(patientId, 10);
    const professionalIdNum = parseInt(professionalId, 10);

    if (isNaN(patientIdNum) || isNaN(professionalIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-intake GET] Fallback a createClient sin request:", error);
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
      console.error("[clinical-intake GET] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario sea el profesional asignado o admin
    const isAdmin = profile.role === 1;
    const isProfessional = profile.role === 3;

    if (!isAdmin && (!isProfessional || profile.id !== professionalIdNum)) {
      return NextResponse.json(
        { error: "No tienes permiso para acceder a esta ficha de ingreso" },
        { status: 403 }
      );
    }

    // Obtener la ficha de ingreso
    const intakeRecord = await clinicalRecordService.getIntakeRecord(
      patientIdNum,
      professionalIdNum
    );

    // Registrar acceso en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    await clinicalRecordService.logAccess({
      intake_record_id: intakeRecord?.id,
      professional_id: professionalIdNum,
      action: "view",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
    });

    return NextResponse.json({
      intakeRecord: intakeRecord || null,
    });
  } catch (error) {
    console.error("Error en GET intake record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clinical-records/intake/[patientId]/[professionalId]
 * Crea una nueva ficha de ingreso
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ patientId: string; professionalId: string }> }
) {
  try {
    const { patientId, professionalId } = await context.params;
    const patientIdNum = parseInt(patientId, 10);
    const professionalIdNum = parseInt(professionalId, 10);

    if (isNaN(patientIdNum) || isNaN(professionalIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-intake POST] Fallback a createClient sin request:", error);
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
      console.error("[clinical-intake POST] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea profesional y sea el asignado
    if (profile.role !== 3 || profile.id !== professionalIdNum) {
      return NextResponse.json(
        { error: "Solo el profesional asignado puede crear fichas de ingreso" },
        { status: 403 }
      );
    }

    // Verificar que no exista ya una ficha de ingreso
    const exists = await clinicalRecordService.intakeRecordExists(
      patientIdNum,
      professionalIdNum
    );

    if (exists) {
      return NextResponse.json(
        { error: "Ya existe una ficha de ingreso para este paciente" },
        { status: 409 }
      );
    }

    // Crear la ficha de ingreso
    const intakeData: CreateIntakeRecordData = {
      patient_id: patientIdNum,
      professional_id: professionalIdNum,
      full_name: body.full_name,
      rut: body.rut,
      birth_date: body.birth_date,
      gender: body.gender,
      email: body.email,
      phone: body.phone,
      address: body.address,
      medical_history: body.medical_history,
      family_history: body.family_history,
      consultation_reason: body.consultation_reason,
    };

    const intakeRecord = await clinicalRecordService.createIntakeRecord(intakeData);

    // Registrar creación en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    await clinicalRecordService.logAccess({
      intake_record_id: intakeRecord.id,
      professional_id: professionalIdNum,
      action: "create",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      metadata: { created: true },
    });

    return NextResponse.json({
      success: true,
      intakeRecord,
    });
  } catch (error) {
    console.error("Error en POST intake record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clinical-records/intake/[patientId]/[professionalId]
 * Actualiza una ficha de ingreso existente
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ patientId: string; professionalId: string }> }
) {
  try {
    const { patientId, professionalId } = await context.params;
    const patientIdNum = parseInt(patientId, 10);
    const professionalIdNum = parseInt(professionalId, 10);

    if (isNaN(patientIdNum) || isNaN(professionalIdNum)) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Intentar usar createClient con request primero, si falla usar sin request
    let supabase;
    try {
      supabase = await createClient(request);
    } catch (error) {
      // Si falla con request, intentar sin él (usará cookies() de Next.js)
      console.warn("[clinical-intake PUT] Fallback a createClient sin request:", error);
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
      console.error("[clinical-intake PUT] Error de autenticación:", {
        authError: authError?.message,
        hasUser: !!user,
        hasSession: !!session,
      });
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    if (!finalUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role")
      .eq("user_id", finalUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que sea profesional y sea el asignado
    if (profile.role !== 3 || profile.id !== professionalIdNum) {
      return NextResponse.json(
        { error: "Solo el profesional asignado puede actualizar fichas de ingreso" },
        { status: 403 }
      );
    }

    // Obtener ficha existente para guardar valores anteriores en logs
    const existingRecord = await clinicalRecordService.getIntakeRecord(
      patientIdNum,
      professionalIdNum
    );

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Ficha de ingreso no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la ficha de ingreso
    const updateData: UpdateIntakeRecordData = {
      full_name: body.full_name,
      rut: body.rut,
      birth_date: body.birth_date,
      gender: body.gender,
      email: body.email,
      phone: body.phone,
      address: body.address,
      medical_history: body.medical_history,
      family_history: body.family_history,
      consultation_reason: body.consultation_reason,
    };

    const updatedRecord = await clinicalRecordService.updateIntakeRecord(
      patientIdNum,
      professionalIdNum,
      updateData
    );

    // Registrar actualización en logs
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null;
    const userAgent = request.headers.get("user-agent") || null;

    await clinicalRecordService.logAccess({
      intake_record_id: updatedRecord.id,
      professional_id: professionalIdNum,
      action: "update",
      ip_address: ipAddress || undefined,
      user_agent: userAgent || undefined,
      metadata: {
        previous_values: existingRecord,
        updated_fields: Object.keys(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      intakeRecord: updatedRecord,
    });
  } catch (error) {
    console.error("Error en PUT intake record:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

