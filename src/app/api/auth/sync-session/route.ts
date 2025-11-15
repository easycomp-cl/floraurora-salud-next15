import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * API Route para sincronizar la sesión del cliente con el servidor
 * POST /api/auth/sync-session
 * 
 * Esta ruta sincroniza las cookies HTTP del servidor con la sesión del cliente
 * después del login. Esto asegura que las cookies estén disponibles para las APIs.
 * 
 * El cliente envía el access_token y refresh_token en el body, y el servidor
 * los usa para establecer las cookies correctamente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;
    
    if (!access_token) {
      return NextResponse.json(
        { success: false, error: "Access token requerido" },
        { status: 400 }
      );
    }
    
    // Crear respuesta primero para poder establecer cookies
    const response = NextResponse.json({
      success: true,
    });
    
    // Crear cliente con acceso a la respuesta para establecer cookies
    const supabase = await createClient(request, response);
    
    // Establecer la sesión usando los tokens del cliente
    // Esto debería establecer las cookies automáticamente a través de setAll
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || undefined,
    });
    
    if (sessionError || !session) {
      console.error("❌ [sync-session] Error estableciendo sesión:", sessionError);
      return NextResponse.json(
        { success: false, error: "Error al sincronizar sesión" },
        { status: 500 }
      );
    }
    
    // Actualizar el body de la respuesta con el userId
    // Las cookies ya están establecidas en la respuesta por setAll
    const responseData = {
      success: true,
      userId: session.user?.id,
    };
    
    // Crear nueva respuesta con el mismo body pero manteniendo las cookies
    const finalResponse = NextResponse.json(responseData);
    
    // Copiar todas las cookies establecidas por Supabase SSR
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: cookie.name.includes('refresh') ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
      });
    });
    
    console.log("✅ [sync-session] Sesión sincronizada:", {
      userId: session.user?.id,
      hasAccessToken: !!session.access_token,
      cookiesEstablecidas: finalResponse.cookies.getAll().length,
      nombresCookies: finalResponse.cookies.getAll().map(c => c.name),
    });
    
    return finalResponse;
  } catch (error) {
    console.error("❌ [sync-session] Error inesperado:", error);
    return NextResponse.json(
      { success: false, error: "Error al sincronizar sesión" },
      { status: 500 }
    );
  }
}

