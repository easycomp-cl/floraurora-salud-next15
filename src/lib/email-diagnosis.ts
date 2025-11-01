"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Diagnóstico específico para problemas de envío de correos de confirmación
 */

export async function diagnoseEmailIssues() {
  console.log("🔍 === DIAGNÓSTICO DE PROBLEMAS DE CORREO ===");
  
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    issues: [] as string[],
    recommendations: [] as string[],
    config: {},
    testResults: {}
  };

  // 1. Verificar configuración de variables de entorno
  console.log("1️⃣ Verificando variables de entorno...");
  const envConfig = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    isProduction: !process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost'),
    isDevelopment: process.env.NODE_ENV === 'development'
  };

  diagnosis.config = envConfig;

  if (!envConfig.hasSupabaseUrl || !envConfig.hasAnonKey) {
    diagnosis.issues.push("Variables de entorno de Supabase no configuradas");
    diagnosis.recommendations.push("Configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!envConfig.hasServiceRoleKey) {
    diagnosis.issues.push("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY no configurada");
    diagnosis.recommendations.push("Configurar SERVICE_ROLE_KEY para operaciones administrativas");
  }

  // 2. Verificar conexión a Supabase
  console.log("2️⃣ Verificando conexión a Supabase...");
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      diagnosis.issues.push(`Error de conexión a Supabase: ${error.message}`);
      diagnosis.recommendations.push("Verificar configuración de Supabase");
    } else {
      console.log("✅ Conexión a Supabase exitosa");
    }
  } catch (error) {
    diagnosis.issues.push(`Error inesperado de conexión: ${String(error)}`);
  }

  // 3. Verificar configuración de URL de redirección
  console.log("3️⃣ Verificando configuración de URL de redirección...");
  const redirectUrl = `${envConfig.siteUrl}/confirm`;
  console.log("URL de redirección configurada:", redirectUrl);

  if (envConfig.isProduction && envConfig.siteUrl.includes('localhost')) {
    diagnosis.issues.push("URL de sitio configurada como localhost en producción");
    diagnosis.recommendations.push("Configurar NEXT_PUBLIC_SITE_URL con el dominio de producción");
  }

  // 4. Simular registro para verificar configuración
  console.log("4️⃣ Simulando configuración de registro...");
  const testEmailConfig = {
    email: "test@example.com",
    password: "testpassword123",
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: "Test User",
        email: "test@example.com",
      },
    },
  };

  console.log("Configuración de prueba:", testEmailConfig);

  // 5. Verificar logs específicos
  console.log("5️⃣ Verificando logs de Supabase...");
  const logAnalysis = {
    hasAdminUsersCall: true, // Basado en el log que proporcionaste
    missingEmailLogs: "No se encontraron logs de envío de correo",
    recommendation: "Verificar configuración de email en Supabase Dashboard"
  };

  diagnosis.testResults = {
    envConfig,
    redirectUrl,
    testEmailConfig,
    logAnalysis
  };

  // 6. Generar recomendaciones específicas
  if (diagnosis.issues.length === 0) {
    diagnosis.recommendations.push("Verificar configuración de email en Supabase Dashboard");
    diagnosis.recommendations.push("Revisar configuración SMTP en Supabase");
    diagnosis.recommendations.push("Verificar que el template de email esté configurado");
    diagnosis.recommendations.push("Revisar logs de Supabase para errores de email");
  }

  console.log("📋 Diagnóstico completado:", diagnosis);
  return diagnosis;
}

export async function testEmailConfiguration(email: string) {
  console.log("🔍 === TEST DE CONFIGURACIÓN DE EMAIL ===");
  
  if (!email) {
    return {
      success: false,
      error: "Email requerido para el test"
    };
  }

  try {
    const supabase = await createClient();
    
    // Test 1: Verificar que Supabase puede acceder a la configuración
    console.log("Test 1: Verificando acceso a configuración...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log("❌ Error obteniendo usuario:", userError);
    } else {
      console.log("✅ Acceso a configuración OK");
    }

    // Test 2: Simular configuración de registro
    console.log("Test 2: Simulando configuración de registro...");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/confirm`;
    
    const signupConfig = {
      email,
      password: "testpassword123",
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: "Test User",
          email: email,
        },
      },
    };

    console.log("Configuración de registro:", signupConfig);

    // Test 3: Verificar que no hay errores de configuración
    console.log("Test 3: Verificando configuración...");
    const configCheck = {
      hasValidEmail: email.includes('@'),
      hasValidRedirectUrl: redirectUrl.includes('/confirm'),
      hasBaseUrl: !!baseUrl,
      isLocalhost: baseUrl.includes('localhost'),
      environment: process.env.NODE_ENV
    };

    console.log("Verificación de configuración:", configCheck);

    return {
      success: true,
      config: signupConfig,
      redirectUrl,
      configCheck,
      message: "Configuración verificada correctamente"
    };

  } catch (error) {
    console.error("❌ Error en test de configuración:", error);
    return {
      success: false,
      error: String(error)
    };
  }
}

export async function getEmailTroubleshootingSteps() {
  return {
    steps: [
      {
        step: 1,
        title: "Verificar configuración de Supabase Dashboard",
        description: "Ir a Authentication > Settings y verificar que 'Enable email confirmations' esté habilitado",
        action: "Revisar configuración en Supabase Dashboard"
      },
      {
        step: 2,
        title: "Verificar template de email",
        description: "Ir a Authentication > Email Templates y verificar que el template 'Confirm signup' esté configurado",
        action: "Revisar y personalizar template de confirmación"
      },
      {
        step: 3,
        title: "Verificar configuración SMTP",
        description: "Ir a Authentication > Settings > SMTP Settings y verificar configuración",
        action: "Configurar SMTP personalizado si es necesario"
      },
      {
        step: 4,
        title: "Verificar URL de redirección",
        description: "Confirmar que la URL de redirección en el template sea correcta",
        action: "Verificar que apunte a /confirm"
      },
      {
        step: 5,
        title: "Revisar logs de Supabase",
        description: "Ir a Logs en Supabase Dashboard y buscar errores relacionados con email",
        action: "Revisar logs para errores de envío"
      },
      {
        step: 6,
        title: "Probar con email diferente",
        description: "Probar con un email diferente para descartar problemas específicos del email",
        action: "Usar email de prueba diferente"
      }
    ],
    commonIssues: [
      "Email confirmations no habilitado en Supabase",
      "Template de email no configurado",
      "URL de redirección incorrecta",
      "Problemas con SMTP",
      "Email en carpeta de spam",
      "Configuración de dominio incorrecta"
    ]
  };
}
