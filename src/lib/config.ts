// Configuración de la aplicación
export const config = {
  // Configuración de desarrollo
  development: {
    // Habilitar logs de debug (cambiar a false para deshabilitar)
    enableDebugLogs: false,
    
    // Habilitar componente de debug visual
    enableAuthDebug: true,
    
    // Habilitar logs de Supabase
    enableSupabaseLogs: false,
    
    // Habilitar logs de middleware
    enableMiddlewareLogs: false,
    
    // Habilitar logs de autenticación
    enableAuthLogs: false,
  },
  
  // Configuración de producción
  production: {
    enableDebugLogs: false,
    enableAuthDebug: false,
    enableSupabaseLogs: false,
    enableMiddlewareLogs: false,
    enableAuthLogs: false,
  }
};

// Función helper para obtener la configuración actual
export function getConfig() {
  if (process.env.NODE_ENV === 'production') {
    return config.production;
  }
  return config.development;
}

// Función helper para verificar si los logs están habilitados
export function shouldLog(category: keyof typeof config.development) {
  const currentConfig = getConfig();
  return currentConfig[category];
}
