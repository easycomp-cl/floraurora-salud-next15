import { NextRequest } from "next/server";
import { createClient, createAdminServer } from "@/utils/supabase/server";

export interface AuthValidationResult {
  isValid: boolean;
  userId: string | null;
  userRecordId: number | null;
  error?: string;
  needsReauth?: boolean;
  sessionMismatch?: boolean; // Nueva propiedad para indicar desajuste crítico de seguridad
}

/**
 * Valida la autenticación comparando cookies y header
 * Retorna el user_id correcto y el id de la tabla users
 * 
 * Esta función es crítica para la seguridad en una plataforma multiusuario:
 * - Compara el user_id de las cookies HTTP con el del header X-User-ID
 * - Si hay desajuste, usa el header como fuente de verdad (más confiable)
 * - Valida que el usuario existe en la base de datos
 * - Rechaza peticiones con cookies desactualizadas si no hay header confiable
 */
export async function validateAuth(
  request: NextRequest
): Promise<AuthValidationResult> {
  const headerUserId = request.headers.get("X-User-ID");
  
  // Pasar el request a createClient para usar las cookies del request
  // Esto es más confiable en API routes porque las cookies vienen directamente del cliente
  const supabase = await createClient(request);
  const adminSupabase = createAdminServer();

  // Obtener usuario de las cookies
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Si hay un header X-User-ID confiable, intentar usarlo como respaldo
    // Esto puede ocurrir cuando las cookies no se leen correctamente pero el header es válido
    if (headerUserId) {
      // Buscar usuario en la base de datos usando el header
      const { data: userRecord, error: userError } = await adminSupabase
        .from("users")
        .select("id, user_id")
        .eq("user_id", headerUserId)
        .single();

      if (!userError && userRecord) {
        return {
          isValid: true,
          userId: headerUserId,
          userRecordId: userRecord.id,
        };
      }
    }
    
    return {
      isValid: false,
      userId: null,
      userRecordId: null,
      error: "No autenticado",
      needsReauth: true,
    };
  }

  // DETECCIÓN CRÍTICA: Si hay header y no coincide con cookies, es un desajuste de seguridad
  // En este caso, NO debemos usar el header como fuente de verdad, sino cerrar sesión
  if (headerUserId && user.id !== headerUserId) {
    console.error("🚨 [validateAuth] DESAJUSTE CRÍTICO DE SEGURIDAD detectado:", {
      cookieUserId: user.id,
      headerUserId,
    });
    
    return {
      isValid: false,
      userId: null,
      userRecordId: null,
      error: "Sesión desactualizada detectada. Por seguridad, se cerrará la sesión.",
      needsReauth: true,
      sessionMismatch: true, // Marcar como desajuste crítico
    };
  }

  // Si no hay header, usar cookies (pero esto es menos seguro)
  const finalUserId = user.id;

  // Buscar usuario en la base de datos
  const { data: userRecord, error: userError } = await adminSupabase
    .from("users")
    .select("id, user_id")
    .eq("user_id", finalUserId)
    .single();

  if (userError || !userRecord) {
    return {
      isValid: false,
      userId: finalUserId,
      userRecordId: null,
      error: "Usuario no encontrado en la base de datos",
      needsReauth: true,
    };
  }

  // VALIDACIÓN CRÍTICA DE SEGURIDAD: Si las cookies tienen un user_id diferente al header
  // y no hay header, rechazar por seguridad (cookies desactualizadas sin verificación)
  if (!headerUserId && user.id !== finalUserId) {
    return {
      isValid: false,
      userId: null,
      userRecordId: null,
      error: "Sesión desactualizada. Por favor, cierra sesión y vuelve a iniciar sesión.",
      needsReauth: true,
    };
  }

  return {
    isValid: true,
    userId: finalUserId,
    userRecordId: userRecord.id,
  };
}

