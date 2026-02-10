const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const config = {
  // Configuración de la aplicación
  app: {
    name: "FlorAurora Salud",
    description: "Plataforma de psicología y video llamadas",
    url: appUrl,
  },

  // Configuración de Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Rutas de la aplicación
  routes: {
    // Rutas públicas
    public: {
      home: "/",
      about: "/about",
      services: "/services",
      professionals: "/professionals",
      contact: "/contact",
    },

    // Rutas de autenticación
    auth: {
      login: "/login",
      signup: "/signup",
      signupPro: "/signup-pro",
      callback: "/callback",
      confirm: "/confirm",
      confirmed: "/confirmed",
      logout: "/logout",
      forgotPassword: "/forgot-password",
      resetPassword: "/reset-password",
    },

    // Rutas protegidas
    protected: {
      dashboard: "/dashboard",
      appointments: "/dashboard/appointments",
      sessions: "/dashboard/sessions",
      profile: "/dashboard/profile",
      admin: "/admin",
    },

    // Rutas de API
    api: {
      auth: "/api/auth",
      users: "/api/users",
      appointments: "/api/appointments",
      profiles: "/api/profiles",
    },
  },

  // Configuración de autenticación
  auth: {
    // Tiempo de expiración de sesión (en segundos)
    sessionExpiry: 60 * 60 * 24 * 7, // 7 días
    
    // Rutas que requieren autenticación
    protectedRoutes: [
      "/dashboard",
      "/dashboard/appointments",
      "/dashboard/sessions",
      "/dashboard/profile",
      "/admin",
      "/profile",
    ],

    // Rutas que no requieren autenticación
    publicRoutes: [
      "/",
      "/about",
      "/services",
      "/professionals",
      "/contact",
      "/login",
      "/signup",
      "/signup-pro",
      "/callback",
      "/confirm",
      "/confirmed",
      "/forgot-password",
      "/reset-password",
    ],

    // Rutas de redirección después de autenticación
    redirects: {
      afterLogin: "/dashboard",
      afterLogout: "/",
      afterSignup: "/dashboard",
      unauthorized: "/login",
    },
  },

  // Configuración de Google OAuth
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || `${appUrl}/callback`,
  },

  // Configuración de Google Meet/Calendar API
  googleMeet: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "meeting@floraurorasalud.cl",
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY, // Base64 encoded JSON key
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    workspaceUserEmail: process.env.GOOGLE_WORKSPACE_USER_EMAIL || "meeting@floraurorasalud.cl", // Usuario de Workspace para Domain-Wide Delegation
    enabled: process.env.GOOGLE_MEET_API_ENABLED === "true",
  },

  // Configuración de Transbank Webpay Plus
  transbank: {
    commerceCode: process.env.TRANSBANK_COMMERCE_CODE,
    apiKey: process.env.TRANSBANK_API_KEY,
    environment: (process.env.TRANSBANK_ENVIRONMENT?.toUpperCase() || "TEST") === "PROD" ? "production" : "integration",
  },

  // Configuración de desarrollo
  development: {
    isDev: process.env.NODE_ENV === "development",
    debug: process.env.NODE_ENV === "development",
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "error",
  },
};

// Función para verificar si una ruta está protegida
export function isProtectedRoute(pathname: string): boolean {
  return config.auth.protectedRoutes.some((route: string) => 
    pathname.startsWith(route)
  );
}

// Función para verificar si una ruta es pública
export function isPublicRoute(pathname: string): boolean {
  return config.auth.publicRoutes.some((route: string) => 
    pathname === route || pathname.startsWith(route)
  );
}

// Función para obtener la ruta de redirección apropiada
export function getRedirectRoute(pathname: string, isAuthenticated: boolean): string {
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return config.auth.redirects.unauthorized;
  }
  
  if (isAuthenticated && pathname === config.auth.redirects.unauthorized) {
    return config.auth.redirects.afterLogin;
  }
  
  return pathname;
}

export function getTransbankEnvironment(): {
  isProduction: boolean;
  environment: "production" | "integration";
  detectedBy: string;
} {
  // 1. Verificar TRANSBANK_ENVIRONMENT explícitamente configurado
  // Usar trim() para eliminar espacios en blanco que podrían causar problemas
  const transbankEnvRaw = process.env.TRANSBANK_ENVIRONMENT;
  const transbankEnv = transbankEnvRaw?.trim().toUpperCase();
  
  if (transbankEnv === "PROD" || transbankEnv === "PRODUCTION") {
    return {
      isProduction: true,
      environment: "production",
      detectedBy: `TRANSBANK_ENVIRONMENT=${transbankEnvRaw} (trimmed: ${transbankEnv})`,
    };
  }
  if (transbankEnv === "TEST" || transbankEnv === "INTEGRATION" || transbankEnv === "INTEGRACION") {
    return {
      isProduction: false,
      environment: "integration",
      detectedBy: `TRANSBANK_ENVIRONMENT=${transbankEnvRaw} (trimmed: ${transbankEnv})`,
    };
  }

  // 2. Si TRANSBANK_ENVIRONMENT no está configurado o está vacío, verificar NODE_ENV
  const nodeEnv = process.env.NODE_ENV?.toLowerCase().trim();
  if (nodeEnv === "production") {
    // En producción, por defecto usar producción a menos que se especifique lo contrario
    return {
      isProduction: true,
      environment: "production",
      detectedBy: `NODE_ENV=production (fallback) - TRANSBANK_ENVIRONMENT=${transbankEnvRaw || "no configurado"}`,
    };
  }

  // 3. Por defecto, usar integración (para desarrollo/testing)
  return {
    isProduction: false,
    environment: "integration",
    detectedBy: `default (development/testing) - TRANSBANK_ENVIRONMENT=${transbankEnvRaw || "no configurado"}, NODE_ENV=${process.env.NODE_ENV || "no configurado"}`,
  };
}

// Exportar función helper para obtener configuración de Transbank
export function getTransbankConfig(): {
  commerceCode: string | undefined;
  apiKey: string | undefined;
  isProduction: boolean;
  environment: "production" | "integration";
  detectedBy: string;
} {
  const envConfig = getTransbankEnvironment();
  
  // Limpiar credenciales: eliminar espacios en blanco que pueden causar errores 401
  const commerceCodeRaw = process.env.TRANSBANK_COMMERCE_CODE;
  const apiKeyRaw = process.env.TRANSBANK_API_KEY;
  
  const commerceCode = commerceCodeRaw?.trim() || undefined;
  const apiKey = apiKeyRaw?.trim() || undefined;
  
  // Validar que las credenciales no estén vacías después del trim
  if (commerceCodeRaw && !commerceCode) {
    console.warn("⚠️ [Transbank Config] TRANSBANK_COMMERCE_CODE está vacío después de trim()");
  }
  if (apiKeyRaw && !apiKey) {
    console.warn("⚠️ [Transbank Config] TRANSBANK_API_KEY está vacío después de trim()");
  }
  
  return {
    commerceCode,
    apiKey,
    ...envConfig,
  };
}