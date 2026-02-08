import { NextRequest, NextResponse } from "next/server";
import { createAdminServer } from "@/utils/supabase/server";

/**
 * API route para crear/verificar usuario y perfil de paciente después de confirmar email
 * Se usa desde la página de confirmación para evitar problemas de RLS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, firstName, lastName } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId y email son requeridos" },
        { status: 400 }
      );
    }

    const admin = createAdminServer();

    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: checkError } = await admin
      .from("users")
      .select("id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ Error al verificar usuario:", checkError);
      return NextResponse.json(
        { error: "Error al verificar usuario" },
        { status: 500 }
      );
    }

    let userRecordId: number | null = null;

    // Si el usuario no existe, crearlo
    if (!existingUser) {
      const { data: userRecord, error: insertError } = await admin
        .from("users")
        .insert({
          user_id: userId,
          email: email,
          name: firstName || email.split("@")[0],
          last_name: lastName || "",
          is_active: true,
          role: 2, // Rol de paciente por defecto
          created_at: new Date().toISOString()
        })
        .select("id")
        .maybeSingle();

      if (insertError) {
        // Si es un error de duplicación, el usuario ya existe (race condition)
        if (insertError.code === '23505') {
          console.log("⚠️ Usuario ya existe (race condition), obteniendo ID...");
          const { data: fetchedUser } = await admin
            .from("users")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
          userRecordId = fetchedUser?.id ?? null;
        } else {
          console.error("❌ Error al insertar usuario:", insertError);
          return NextResponse.json(
            { error: "Error al crear usuario" },
            { status: 500 }
          );
        }
      } else {
        userRecordId = userRecord?.id ?? null;
        console.log("✅ Usuario creado en tabla users:", userRecordId);
      }
    } else {
      userRecordId = existingUser.id;
      console.log("✅ Usuario ya existe en tabla users:", userRecordId);
    }

    // Crear perfil de paciente si no existe
    if (userRecordId) {
      const { data: existingPatient, error: patientCheckError } = await admin
        .from("patients")
        .select("id")
        .eq("id", userRecordId)
        .maybeSingle();

      if (patientCheckError && patientCheckError.code !== "PGRST116") {
        console.error("⚠️ Error al verificar perfil de paciente:", patientCheckError);
      } else if (!existingPatient) {
        const { error: patientInsertError } = await admin
          .from("patients")
          .insert({
            id: userRecordId,
            emergency_contact_name: "",
            emergency_contact_phone: "",
            health_insurances_id: 1,
          });

        if (patientInsertError) {
          if (patientInsertError.code === '23505') {
            console.log("⚠️ Perfil de paciente ya existe, continuando...");
          } else {
            console.error("⚠️ Error al crear perfil de paciente:", patientInsertError);
            // No es crítico, devolver éxito de todas formas
          }
        } else {
          console.log("✅ Perfil de paciente creado");
          
          // Enviar notificación al correo de contacto
          try {
            const { sendPatientRegistrationNotification } = await import("@/lib/services/emailService");
            await sendPatientRegistrationNotification({
              patientName: `${firstName || email.split("@")[0]} ${lastName || ""}`.trim(),
              patientEmail: email,
              patientPhone: null,
            });
            console.log("✅ Notificación de registro de paciente enviada al correo de contacto");
          } catch (notificationError) {
            console.error("⚠️ Error al enviar notificación de registro (no crítico):", notificationError);
            // No es crítico, el registro ya se completó exitosamente
          }
        }
      } else {
        console.log("✅ Perfil de paciente ya existe");
      }
    }

    return NextResponse.json({
      success: true,
      userId: userRecordId,
      message: "Usuario y perfil creados/verificados exitosamente"
    });
  } catch (error) {
    console.error("❌ Error en confirm-user API:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
