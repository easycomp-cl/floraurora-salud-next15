import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";
import { validateAuth } from "@/utils/supabase/auth-validation";

// Interfaces para tipado seguro
interface SpecialtyData {
  id: number;
  name: string;
  title_id: number;
  created_at: string;
  minimum_amount: number | null;
  maximum_amount: number | null;
}

// Type guard para verificar si es un objeto único o un array
function isSpecialtyData(obj: SpecialtyData | SpecialtyData[] | null): obj is SpecialtyData {
  return obj !== null && !Array.isArray(obj) && typeof obj === 'object' && 'id' in obj;
}

interface SpecialtyWithPrice {
  id: number;
  name: string;
  title_id: number;
  created_at: string;
  professional_amount: number | null;
  minimum_amount: number | null;
  maximum_amount: number | null;
}

/**
 * API Route para obtener los precios de especialidades de un profesional
 * GET /api/professional/prices
 */
export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authValidation = await validateAuth(request);

    if (!authValidation.isValid) {
      return NextResponse.json(
        { 
          error: authValidation.error || "No autenticado",
          needsReauth: authValidation.needsReauth 
        },
        { status: authValidation.needsReauth ? 401 : 403 }
      );
    }

    const professionalIdNum = Number(authValidation.userRecordId);
    
    // Obtener especialidades con precios y rangos
    const adminSupabase = createAdminServer();
    const { data, error } = await adminSupabase
      .from('professional_specialties')
      .select(`
        specialty_id,
        professional_amount,
        specialties(
          id,
          name,
          title_id,
          created_at,
          minimum_amount,
          maximum_amount
        )
      `)
      .eq('professional_id', professionalIdNum);

    if (error) {
      console.error('Error fetching professional prices:', error);
      return NextResponse.json(
        { error: "Error al obtener los precios" },
        { status: 500 }
      );
    }

    // Mapear los datos con tipado seguro
    const specialties: SpecialtyWithPrice[] = (data || [])
      .map((item) => {
        // Manejar el caso donde specialties puede ser un objeto único o un array
        const specialtyRaw = item.specialties;
        
        if (!isSpecialtyData(specialtyRaw)) {
          return null;
        }

        const specialty = specialtyRaw;

        return {
          id: Number(specialty.id),
          name: String(specialty.name),
          title_id: Number(specialty.title_id),
          created_at: String(specialty.created_at),
          professional_amount: item.professional_amount !== null && item.professional_amount !== undefined 
            ? Number(item.professional_amount) 
            : null,
          minimum_amount: specialty.minimum_amount !== null && specialty.minimum_amount !== undefined
            ? Number(specialty.minimum_amount)
            : null,
          maximum_amount: specialty.maximum_amount !== null && specialty.maximum_amount !== undefined
            ? Number(specialty.maximum_amount)
            : null,
        };
      })
      .filter((s): s is SpecialtyWithPrice => s !== null);

    return NextResponse.json({
      success: true,
      data: specialties,
    });
  } catch (error) {
    console.error("Error obteniendo precios:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

/**
 * API Route para actualizar el precio de una especialidad profesional
 * PUT /api/professional/prices
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { specialtyId, professionalAmount } = body;

    // Validar datos requeridos
    if (!specialtyId || professionalAmount === undefined || professionalAmount === null) {
      return NextResponse.json(
        {
          error: "Faltan datos requeridos: specialtyId y professionalAmount",
        },
        { status: 400 }
      );
    }

    // Validar que professionalAmount sea un número válido
    const amount = Number(professionalAmount);
    if (Number.isNaN(amount) || amount < 0) {
      return NextResponse.json(
        { error: "El precio debe ser un número válido mayor o igual a 0" },
        { status: 400 }
      );
    }

    // Validar autenticación
    const authValidation = await validateAuth(request);

    if (!authValidation.isValid) {
      return NextResponse.json(
        { 
          error: authValidation.error || "No autenticado",
          needsReauth: authValidation.needsReauth 
        },
        { status: authValidation.needsReauth ? 401 : 403 }
      );
    }

    const professionalIdNum = Number(authValidation.userRecordId);
    
    // Verificar que la especialidad pertenezca al profesional y obtener rangos
    const adminSupabase = createAdminServer();
    const { data: existing, error: checkError } = await adminSupabase
      .from('professional_specialties')
      .select('specialty_id, specialties(minimum_amount, maximum_amount)')
      .eq('professional_id', professionalIdNum)
      .eq('specialty_id', specialtyId)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "La especialidad no está asociada a este profesional" },
        { status: 404 }
      );
    }

    // Obtener los rangos de precio permitidos
    interface SpecialtyRange {
      minimum_amount: number | null;
      maximum_amount: number | null;
    }
    
    // Manejar el caso donde specialties puede ser un objeto único o un array
    const specialtyRaw = existing.specialties;
    let specialtyRange: SpecialtyRange | null = null;
    
    if (specialtyRaw && !Array.isArray(specialtyRaw) && typeof specialtyRaw === 'object') {
      specialtyRange = specialtyRaw as SpecialtyRange;
    } else if (Array.isArray(specialtyRaw) && specialtyRaw.length > 0) {
      // Si es un array, tomar el primer elemento
      specialtyRange = specialtyRaw[0] as SpecialtyRange;
    }
    
    const minAmount = specialtyRange?.minimum_amount !== null && specialtyRange?.minimum_amount !== undefined
      ? Number(specialtyRange.minimum_amount)
      : null;
    const maxAmount = specialtyRange?.maximum_amount !== null && specialtyRange?.maximum_amount !== undefined
      ? Number(specialtyRange.maximum_amount)
      : null;

    // Validar que el precio esté dentro del rango permitido
    if (minAmount !== null && amount < minAmount) {
      return NextResponse.json(
        { 
          error: `El precio mínimo permitido es $${minAmount.toLocaleString('es-CL')}`,
          minAmount,
          maxAmount 
        },
        { status: 400 }
      );
    }
    if (maxAmount !== null && amount > maxAmount) {
      return NextResponse.json(
        { 
          error: `El precio máximo permitido es $${maxAmount.toLocaleString('es-CL')}`,
          minAmount,
          maxAmount 
        },
        { status: 400 }
      );
    }

    // Actualizar el precio
    const { error: updateError } = await adminSupabase
      .from('professional_specialties')
      .update({ professional_amount: amount })
      .eq('professional_id', professionalIdNum)
      .eq('specialty_id', specialtyId);

    if (updateError) {
      console.error('Error updating professional specialty price:', updateError);
      return NextResponse.json(
        { error: "Error al actualizar el precio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Precio actualizado exitosamente",
      data: {
        specialtyId,
        professionalAmount: amount,
      },
    });
  } catch (error) {
    console.error("Error actualizando precio:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

