#!/usr/bin/env node

/**
 * Script para verificar la configuración de autenticación
 * Ejecuta: node scripts/check-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de autenticación...\n');

// Verificar archivo .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env.local encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let hasSupabaseUrl = false;
  let hasSupabaseKey = false;
  
  lines.forEach(line => {
    if (line.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      hasSupabaseUrl = true;
      const value = line.split('=')[1];
      console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${value ? 'Configurado' : 'Vacío'}`);
    }
    if (line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      hasSupabaseKey = true;
      const value = line.split('=')[1];
      console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${value ? 'Configurado' : 'Vacío'}`);
    }
  });
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.log('❌ Faltan variables de entorno requeridas');
  } else {
    console.log('✅ Todas las variables de entorno están configuradas');
  }
} else {
  console.log('❌ Archivo .env.local NO encontrado');
  console.log('   Crea el archivo .env.local en la raíz del proyecto');
}

// Verificar package.json
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  console.log('\n📦 Dependencias de autenticación:');
  if (dependencies['@supabase/supabase-js']) {
    console.log('   ✅ @supabase/supabase-js instalado');
  } else {
    console.log('   ❌ @supabase/supabase-js NO instalado');
  }
  
  if (dependencies['@supabase/ssr']) {
    console.log('   ✅ @supabase/ssr instalado');
  } else {
    console.log('   ❌ @supabase/ssr NO instalado');
  }
}

// Verificar estructura de archivos
console.log('\n📁 Estructura de archivos:');
const filesToCheck = [
  'src/utils/supabase/client.ts',
  'src/utils/supabase/server.ts',
  'src/lib/hooks/useAuth.ts',
  'src/components/auth/ProtectedRoute.tsx',
  'src/middleware.ts'
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NO encontrado`);
  }
});

// Recomendaciones
console.log('\n💡 Recomendaciones:');
console.log('1. Asegúrate de que el archivo .env.local esté en la raíz del proyecto');
console.log('2. Verifica que las credenciales de Supabase sean correctas');
console.log('3. Reinicia el servidor de desarrollo después de crear/modificar .env.local');
console.log('4. Verifica que Supabase esté funcionando y accesible');
console.log('5. Revisa la consola del navegador para errores específicos');

console.log('\n🔧 Para más ayuda, revisa el archivo ENV_SETUP.md');
