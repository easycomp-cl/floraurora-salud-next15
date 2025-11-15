import { NextResponse } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";
import { DateTime } from "luxon";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const professionalIdParam = searchParams.get("professionalId");

    if (!professionalIdParam) {
      return NextResponse.json(
        { error: "professionalId es requerido" },
        { status: 400 }
      );
    }

    const professionalId = Number(professionalIdParam);
    if (Number.isNaN(professionalId)) {
      return NextResponse.json(
        { error: "professionalId inválido" },
        { status: 400 }
      );
    }

    // Obtener el usuario actual para verificar permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que el professionalId corresponde al usuario actual
    const { data: userRecord } = await supabase
      .from("users")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!userRecord || userRecord.id !== professionalId) {
      return NextResponse.json(
        { error: "No autorizado para ver estas métricas" },
        { status: 403 }
      );
    }

    // Calcular rango de fechas
    // Asegurar que la semana empiece en lunes (Luxon por defecto usa lunes, pero lo hacemos explícito)
    const now = DateTime.now().setZone("America/Santiago"); // Usar zona horaria de Chile
    const dayOfWeek = now.weekday; // 1 = lunes, 7 = domingo en Luxon
    
    // Calcular lunes de la semana actual
    // Si hoy es lunes (1), no retroceder; si es domingo (7), retroceder 6 días
    const daysFromMonday = dayOfWeek === 7 ? 6 : dayOfWeek - 1;
    const startOfWeek = now.minus({ days: daysFromMonday }).startOf("day").toISO();
    
    // Calcular domingo de la semana actual (último día de la semana)
    // Si hoy es domingo (7), no avanzar; si no, avanzar hasta domingo
    const daysToSunday = dayOfWeek === 7 ? 0 : 7 - dayOfWeek;
    const endOfWeek = now.plus({ days: daysToSunday }).endOf("day").toISO();
    
    // Para citas totales: mes actual
    const startOfMonth = now.startOf("month").toISO(); // Primer día del mes actual
    const endOfMonth = now.endOf("month").toISO(); // Último día del mes actual
    
    // Para citas completadas: también semana actual
    const from = startOfWeek;
    const to = endOfWeek;

    // Obtener métricas en paralelo
    const [
      totalAppointmentsResult,
      upcomingAppointmentsResult,
      completedAppointmentsResult,
    ] = await Promise.all([
      // Total de citas del profesional del mes actual
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .gte("scheduled_at", startOfMonth)
        .lte("scheduled_at", endOfMonth),
      
      // Próximas citas
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .gte("scheduled_at", now.toISO())
        .in("status", ["confirmed", "pending_confirmation"]),
      
      // Citas completadas (semana actual)
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("professional_id", professionalId)
        .eq("status", "completed")
        .gte("scheduled_at", from)
        .lte("scheduled_at", to),
    ]);

    // Calcular ingresos de la semana actual
    // Usar cliente admin para evitar problemas de RLS
    const adminSupabase = createAdminServer();
    
    // Obtener las citas de la semana actual primero (igual que para citas totales)
    const { data: appointmentsData, error: appointmentsError } = await adminSupabase
      .from("appointments")
      .select("id, scheduled_at")
      .eq("professional_id", professionalId)
      .gte("scheduled_at", startOfWeek)
      .lte("scheduled_at", endOfWeek);
    
    if (appointmentsError) {
      console.error(`[metrics] Error obteniendo citas para profesional ${professionalId}:`, appointmentsError);
    }
    
    let totalRevenue = 0;
    
    if (appointmentsData && appointmentsData.length > 0) {
      // Crear un Set con los IDs de citas en diferentes formatos posibles
      // Los appointment_id en payments pueden estar como "APT-00000052" o como "52" o como 52
      const appointmentIdsSet = new Set<string>();
      appointmentsData.forEach(a => {
        const idNum = typeof a.id === 'number' ? a.id : Number(String(a.id).replace(/\D/g, ''));
        if (!isNaN(idNum)) {
          // Agregar formato numérico
          appointmentIdsSet.add(String(idNum));
          // Agregar formato con ceros a la izquierda (como "00000052")
          appointmentIdsSet.add(String(idNum).padStart(8, '0'));
          // Agregar formato APT-00000052
          appointmentIdsSet.add(`APT-${String(idNum).padStart(8, '0')}`);
          // Agregar formato apt00000052 (sin guión)
          appointmentIdsSet.add(`apt${String(idNum).padStart(8, '0')}`);
        }
        // También agregar el ID tal como viene
        appointmentIdsSet.add(String(a.id));
      });
      
      // Obtener TODOS los pagos exitosos del profesional
      // También buscar pagos específicos para las citas de la semana actual
      const appointmentIdsForPaymentSearch = appointmentsData.map(a => {
        const idNum = typeof a.id === 'number' ? a.id : Number(String(a.id).replace(/\D/g, ''));
        return !isNaN(idNum) ? idNum : null;
      }).filter(id => id !== null);
      
      // Buscar pagos de dos formas:
      // 1. Todos los pagos del profesional (método original)
      // 2. Pagos específicos para las citas de la semana (por si el formato es diferente)
      const [allPaymentsResult, specificPaymentsResult] = await Promise.all([
        adminSupabase
          .from("payments")
          .select("amount, appointment_id, provider_payment_status, professional_id")
          .eq("professional_id", professionalId)
          .eq("provider_payment_status", "succeeded"),
        // Buscar pagos usando los IDs numéricos directamente
        appointmentIdsForPaymentSearch.length > 0
          ? adminSupabase
              .from("payments")
              .select("amount, appointment_id, provider_payment_status, professional_id")
              .eq("professional_id", professionalId)
              .eq("provider_payment_status", "succeeded")
              .or(appointmentIdsForPaymentSearch.map(id => 
                `appointment_id.eq.${id},appointment_id.eq.APT-${String(id).padStart(8, '0')},appointment_id.eq.apt${String(id).padStart(8, '0')}`
              ).join(','))
          : { data: [], error: null }
      ]);
      
      const { data: allPayments, error: paymentsError } = allPaymentsResult;
      const { data: specificPayments } = specificPaymentsResult;
      
      // Combinar ambos resultados, eliminando duplicados
      const allPaymentsCombined = [...(allPayments || [])];
      if (specificPayments) {
        specificPayments.forEach(sp => {
          const exists = allPaymentsCombined.some(ap => ap.appointment_id === sp.appointment_id);
          if (!exists) {
            allPaymentsCombined.push(sp);
          }
        });
      }
      
      const allPaymentsFinal = allPaymentsCombined;
      
      if (paymentsError) {
        console.error(`[metrics] Error obteniendo pagos para profesional ${professionalId}:`, paymentsError);
      }
      
      if (allPaymentsFinal && allPaymentsFinal.length > 0) {
        // Filtrar pagos que correspondan a citas de la semana actual
        const validPayments = allPaymentsFinal.filter(p => {
          const paymentAppointmentId = String(p.appointment_id || "");
          
          // Extraer solo números del appointment_id del pago
          const normalizedPaymentId = paymentAppointmentId.replace(/\D/g, '');
          
          // Verificar si el appointment_id del pago coincide con alguna cita de la semana actual
          // Puede estar en formato "APT-00000052", "52", "00000052", etc.
          let isValid = false;
          
          // Comparar directamente
          if (appointmentIdsSet.has(paymentAppointmentId)) {
            isValid = true;
          }
          // Comparar con ID normalizado (solo números)
          else if (normalizedPaymentId && appointmentIdsSet.has(normalizedPaymentId)) {
            isValid = true;
          }
          // Comparar con formato APT-000000XX
          else if (normalizedPaymentId && appointmentIdsSet.has(`APT-${normalizedPaymentId.padStart(8, '0')}`)) {
            isValid = true;
          }
          // Comparar con formato apt000000XX (sin guión)
          else if (normalizedPaymentId && appointmentIdsSet.has(`apt${normalizedPaymentId.padStart(8, '0')}`)) {
            isValid = true;
          }
          // Comparar cada cita de la semana con el pago (más exhaustivo)
          else {
            for (const appointment of appointmentsData) {
              const appointmentIdNum = typeof appointment.id === 'number' 
                ? appointment.id 
                : Number(String(appointment.id).replace(/\D/g, ''));
              
              const paymentIdNum = Number(normalizedPaymentId);
              
              if (!isNaN(appointmentIdNum) && !isNaN(paymentIdNum) && appointmentIdNum === paymentIdNum) {
                isValid = true;
                break;
              }
            }
          }
          
          // Si aún no es válido, intentar buscar directamente en la base de datos para esta cita
          if (!isValid && normalizedPaymentId) {
            for (const appointment of appointmentsData) {
              const appointmentIdNum = typeof appointment.id === 'number' 
                ? appointment.id 
                : Number(String(appointment.id).replace(/\D/g, ''));
              
              const paymentIdNum = Number(normalizedPaymentId);
              
              // Verificar si el número del pago coincide con el número de la cita
              if (!isNaN(appointmentIdNum) && !isNaN(paymentIdNum) && appointmentIdNum === paymentIdNum) {
                isValid = true;
                break;
              }
            }
          }
          
          return isValid;
        });
        
        // Sumar los montos de los pagos válidos
        totalRevenue = validPayments.reduce((sum, p) => {
          const amount = Number(p.amount) || 0;
          return sum + amount;
        }, 0);
      }
    }

    return NextResponse.json({
      totalAppointments: totalAppointmentsResult.count || 0,
      upcomingAppointments: upcomingAppointmentsResult.count || 0,
      completedAppointments: completedAppointmentsResult.count || 0,
      totalRevenue,
    });
  } catch (error) {
    console.error("[GET /api/professional/metrics] Error", error);
    const message =
      error instanceof Error ? error.message : "Error interno al calcular las métricas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

