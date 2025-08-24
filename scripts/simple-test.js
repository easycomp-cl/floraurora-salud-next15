// Script simple para probar la conexión a Supabase
// Este script debe ejecutarse desde la aplicación web, no desde Node.js

console.log('🧪 Script de prueba simple para Supabase');

// Verificar si estamos en el navegador
if (typeof window !== 'undefined') {
  console.log('✅ Ejecutándose en el navegador');
  
  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔧 Variables de entorno:');
  console.log('   URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
  console.log('   Key:', supabaseKey ? '✅ Configurada' : '❌ No configurada');
  
  if (supabaseUrl && supabaseKey) {
    console.log('🎉 Todas las variables están configuradas');
    console.log('💡 Ahora puedes probar el GoogleAuthDebugger en la página web');
  } else {
    console.log('❌ Faltan variables de entorno');
    console.log('💡 Verifica tu archivo .env.local');
  }
} else {
  console.log('❌ Este script debe ejecutarse en el navegador');
  console.log('💡 Abre la página de testing en tu navegador');
}
