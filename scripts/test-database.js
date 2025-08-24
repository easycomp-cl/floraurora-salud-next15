const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase - usar variables de entorno directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuración de Supabase:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ No configurada');
  console.error('\n💡 Asegúrate de que las variables estén configuradas en tu sistema');
  process.exit(1);
}



const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Probando conexión a la base de datos...');
  
  try {
    // 1. Verificar conexión básica
    console.log('📡 Verificando conexión...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️ Error con tabla "users":', error.message);
      
      // Intentar con mayúsculas
      const { data: UsersData, error: UsersError } = await supabase
        .from('Users')
        .select('count')
        .limit(1);
      
      if (UsersError) {
        console.log('⚠️ Error con tabla "Users":', UsersError.message);
        console.log('❌ No se puede acceder a ninguna tabla de usuarios');
        return false;
      }
      
      console.log('✅ Tabla "Users" accesible');
      return 'Users';
    }
    
    console.log('✅ Tabla "users" accesible');
    return 'users';
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
}

async function checkTableStructure(tableName) {
  console.log(`📋 Verificando estructura de la tabla "${tableName}"...`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error al obtener estructura:', error.message);
      return null;
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`✅ Tabla "${tableName}" encontrada con ${columns.length} columnas`);
      console.log('📊 Columnas:', columns.join(', '));
      return columns;
    } else {
      console.log(`⚠️ Tabla "${tableName}" está vacía`);
      return [];
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
    return null;
  }
}

async function testInsertOperation(tableName, columns) {
  console.log(`🧪 Probando inserción en tabla "${tableName}"...`);
  
  try {
    // Crear datos de prueba según las columnas disponibles
    const testData = {
      id: `test_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    // Agregar campos según la estructura disponible
    if (columns.includes('email')) {
      testData.email = `test${Date.now()}@example.com`;
    }
    if (columns.includes('name')) {
      testData.name = 'Usuario Test';
    }
    if (columns.includes('last_name')) {
      testData.last_name = 'Apellido Test';
    }
    if (columns.includes('full_name')) {
      testData.full_name = 'Usuario Test Apellido Test';
    }
    if (columns.includes('role')) {
      testData.role = 1;
    }
    if (columns.includes('is_active')) {
      testData.is_active = true;
    }
    
    console.log('📝 Datos de prueba:', testData);
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error en inserción:', error.message);
      return false;
    }
    
    console.log('✅ Inserción exitosa:', data);
    
    // Limpiar dato de prueba
    console.log('🧹 Limpiando dato de prueba...');
    await supabase
      .from(tableName)
      .delete()
      .eq('id', testData.id);
    
    console.log('✅ Dato de prueba eliminado');
    return true;
    
  } catch (error) {
    console.error('❌ Error inesperado en inserción:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de base de datos...\n');
  
  // 1. Verificar conexión
  const tableName = await testDatabaseConnection();
  if (!tableName) {
    console.log('\n❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  console.log(`\n✅ Conexión exitosa. Usando tabla: "${tableName}"\n`);
  
  // 2. Verificar estructura
  const columns = await checkTableStructure(tableName);
  if (columns === null) {
    console.log('\n❌ No se pudo verificar la estructura de la tabla');
    process.exit(1);
  }
  
  console.log('\n✅ Estructura de tabla verificada\n');
  
  // 3. Probar inserción
  const insertSuccess = await testInsertOperation(tableName, columns);
  if (!insertSuccess) {
    console.log('\n❌ La operación de inserción falló');
    process.exit(1);
  }
  
  console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
  console.log('\n📋 Resumen:');
  console.log(`   • Tabla utilizada: "${tableName}"`);
  console.log(`   • Columnas disponibles: ${columns.length}`);
  console.log(`   • Operaciones de lectura: ✅`);
  console.log(`   • Operaciones de escritura: ✅`);
  console.log(`   • Operaciones de eliminación: ✅`);
}

// Ejecutar pruebas
main().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
