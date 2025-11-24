import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * API Route para cerrar sesión y limpiar cookies
 * POST /api/auth/signout
 * 
 * Esta ruta asegura que todas las cookies de Supabase se limpien correctamente
 * al cerrar sesión, evitando problemas de cookies desactualizadas
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    
    // Cerrar sesión en Supabase
    await supabase.auth.signOut();
    
    // Crear respuesta y limpiar cookies manualmente
    const response = NextResponse.json({ success: true });
    
    // Obtener todas las cookies del request para identificar las de Supabase
    const allCookies = request.cookies.getAll();
    const supabaseCookieNames = allCookies
      .filter(c => 
        c.name.includes('supabase') || 
        c.name.includes('sb-') ||
        c.name.includes('auth-token')
      )
      .map(c => c.name);
    
    // Limpiar todas las cookies de Supabase encontradas
    supabaseCookieNames.forEach(name => {
      response.cookies.delete(name);
      // También establecer con fecha de expiración en el pasado
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
    
    // Limpiar también cookies comunes de Supabase por si acaso
    const commonCookieNames = [
      'sb-scdityxlxpyuvetyhduy-auth-token.0',
      'sb-scdityxlxpyuvetyhduy-auth-token.1',
      'sb-auth-token',
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
    ];
    
    commonCookieNames.forEach(name => {
      response.cookies.delete(name);
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });
    
    console.log("✅ [signout] Cookies limpiadas:", {
      cookiesEncontradas: supabaseCookieNames.length,
      nombres: supabaseCookieNames,
    });
    
    return response;
  } catch (error) {
    console.error("❌ [signout] Error al cerrar sesión:", error);
    return NextResponse.json(
      { success: false, error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}



