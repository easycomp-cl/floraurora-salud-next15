"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Utilidades para debugging del sistema de correos de confirmación
 */

export async function debugEmailConfiguration() {
  console.log("🔍 === DEBUG EMAIL CONFIGURATION ===");
  
  // Verificar variables de entorno
  const config = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + "...",
  };
  
  console.log("📧 Configuración de variables de entorno:", config);
  
  // Verificar conexión a Supabase
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("❌ Error de conexión a Supabase:", error);
      return { success: false, error: error.message };
    }
    
    console.log("✅ Conexión a Supabase exitosa");
    
    return { success: true, config };
  } catch (error) {
    console.error("❌ Error inesperado:", error);
    return { success: false, error: String(error) };
  }
}

export async function debugEmailSettings() {
  console.log("🔍 === DEBUG EMAIL SETTINGS ===");
  
  try {
    const supabase = await createClient();
    
    // Verificar configuración de autenticación
    const { data: authConfig, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("❌ Error obteniendo configuración de auth:", authError);
    } else {
      console.log("✅ Configuración de auth obtenida:", {
        hasUser: !!authConfig.user,
        userId: authConfig.user?.id?.substring(0, 8) + "...",
      });
    }
    
    // Verificar URL de redirección configurada
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${siteUrl}/confirm`;
    
    console.log("📧 URLs de redirección:", {
      siteUrl,
      redirectUrl,
      isLocalhost: siteUrl.includes('localhost'),
      isProduction: !siteUrl.includes('localhost')
    });
    
    return { success: true, redirectUrl };
  } catch (error) {
    console.error("❌ Error inesperado en debugEmailSettings:", error);
    return { success: false, error: String(error) };
  }
}

export async function testEmailDelivery(email: string) {
  console.log("🔍 === TEST EMAIL DELIVERY ===");
  
  if (!email) {
    console.error("❌ Email no proporcionado para testing");
    return { success: false, error: "Email requerido" };
  }
  
  try {
    const supabase = await createClient();
    
    // Simular envío de correo de confirmación
    console.log("📧 Simulando envío de correo a:", email);
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/confirm`;
    
    // Este es solo un test - no enviamos realmente el correo
    console.log("🔍 Configuración de envío:", {
      email,
      redirectUrl,
      baseUrl
    });
    
    console.log("✅ Test de configuración completado");
    
    return { 
      success: true, 
      message: "Configuración de correo verificada",
      redirectUrl 
    };
  } catch (error) {
    console.error("❌ Error en testEmailDelivery:", error);
    return { success: false, error: String(error) };
  }
}

export async function getEmailLogs() {
  console.log("🔍 === EMAIL LOGS ===");
  
  // Esta función podría integrarse con un sistema de logging real
  // Por ahora, solo retornamos información de configuración
  
  const logs = {
    timestamp: new Date().toISOString(),
    config: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
    status: "active"
  };
  
  console.log("📋 Logs de configuración:", logs);
  
  return logs;
}
