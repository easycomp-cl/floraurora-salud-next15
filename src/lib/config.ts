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
