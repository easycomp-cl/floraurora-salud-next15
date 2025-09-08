const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAvailabilityData() {
  console.log('🔧 Configurando datos de disponibilidad...\n');

  try {
    // 1. Verificar si hay profesionales
    console.log('👥 Verificando profesionales...');
    const { data: professionals, error: profError } = await supabase
      .from('professionals')
      .select('id, users(name, last_name)')
      .eq('is_active', true)
      .limit(1);

    if (profError) {
      console.error('❌ Error al obtener profesionales:', profError.message);
      return;
    }

    if (!professionals || professionals.length === 0) {
      console.log('⚠️ No hay profesionales activos. Creando uno de prueba...');
      
      // Crear usuario de prueba
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          name: 'Dr. Test',
          last_name: 'Profesional',
          email: 'test@example.com',
          phone_number: '+1234567890',
          role: 2, // Profesional
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        console.error('❌ Error al crear usuario:', userError.message);
        return;
      }

      // Crear profesional de prueba
      const { data: professional, error: profCreateError } = await supabase
        .from('professionals')
        .insert({
          user_id: user.id,
          title_id: 1, // Asumiendo que existe
          profile_description: 'Profesional de prueba',
          is_active: true
        })
        .select()
        .single();

      if (profCreateError) {
        console.error('❌ Error al crear profesional:', profCreateError.message);
        return;
      }

      console.log('✅ Profesional de prueba creado:', professional.id);
    } else {
      console.log('✅ Profesionales encontrados:', professionals.length);
    }

    // 2. Obtener el primer profesional
    const { data: allProfessionals, error: allProfError } = await supabase
      .from('professionals')
      .select('id, users(name, last_name)')
      .eq('is_active', true)
      .limit(1);

    if (allProfError || !allProfessionals || allProfessionals.length === 0) {
      console.error('❌ No se pudo obtener profesionales');
      return;
    }

    const professionalId = allProfessionals[0].id;
    console.log(`👨‍⚕️ Usando profesional: ${allProfessionals[0].users.name} ${allProfessionals[0].users.last_name} (ID: ${professionalId})`);

    // 3. Verificar reglas de disponibilidad existentes
    console.log('\n📅 Verificando reglas de disponibilidad...');
    const { data: existingRules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('professional_id', professionalId);

    if (rulesError) {
      console.error('❌ Error al obtener reglas:', rulesError.message);
      return;
    }

    if (existingRules && existingRules.length > 0) {
      console.log(`✅ Ya existen ${existingRules.length} reglas de disponibilidad`);
      console.log('📋 Reglas existentes:');
      existingRules.forEach(rule => {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        console.log(`   • ${dayNames[rule.weekday] || rule.weekday}: ${rule.start_time} - ${rule.end_time}`);
      });
    } else {
      console.log('⚠️ No hay reglas de disponibilidad. Creando reglas de prueba...');
      
      // Crear reglas de disponibilidad para todos los días laborales (lunes a viernes)
      const availabilityRules = [
        { professional_id: professionalId, weekday: 1, start_time: '08:00', end_time: '18:00' }, // Lunes
        { professional_id: professionalId, weekday: 2, start_time: '08:00', end_time: '18:00' }, // Martes
        { professional_id: professionalId, weekday: 3, start_time: '08:00', end_time: '18:00' }, // Miércoles
        { professional_id: professionalId, weekday: 4, start_time: '08:00', end_time: '18:00' }, // Jueves
        { professional_id: professionalId, weekday: 5, start_time: '08:00', end_time: '18:00' }, // Viernes
        { professional_id: professionalId, weekday: 6, start_time: '09:00', end_time: '14:00' }, // Sábado (horario reducido)
      ];

      const { data: newRules, error: createRulesError } = await supabase
        .from('availability_rules')
        .insert(availabilityRules)
        .select();

      if (createRulesError) {
        console.error('❌ Error al crear reglas:', createRulesError.message);
        return;
      }

      console.log('✅ Reglas de disponibilidad creadas:', newRules.length);
      newRules.forEach(rule => {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        console.log(`   • ${dayNames[rule.weekday] || rule.weekday}: ${rule.start_time} - ${rule.end_time}`);
      });
    }

    // 4. Verificar excepciones de disponibilidad
    console.log('\n📅 Verificando excepciones de disponibilidad...');
    const { data: existingOverrides, error: overridesError } = await supabase
      .from('availability_overrides')
      .select('*')
      .eq('professional_id', professionalId);

    if (overridesError) {
      console.error('❌ Error al obtener excepciones:', overridesError.message);
      return;
    }

    if (existingOverrides && existingOverrides.length > 0) {
      console.log(`✅ Ya existen ${existingOverrides.length} excepciones de disponibilidad`);
    } else {
      console.log('ℹ️ No hay excepciones de disponibilidad (esto es normal)');
    }

    // 5. Verificar bloques de tiempo
    console.log('\n🚫 Verificando bloques de tiempo...');
    const { data: existingBlocked, error: blockedError } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('professional_id', professionalId);

    if (blockedError) {
      console.error('❌ Error al obtener bloques:', blockedError.message);
      return;
    }

    if (existingBlocked && existingBlocked.length > 0) {
      console.log(`✅ Ya existen ${existingBlocked.length} bloques de tiempo`);
    } else {
      console.log('ℹ️ No hay bloques de tiempo (esto es normal)');
    }

    console.log('\n🎉 Configuración de disponibilidad completada!');
    console.log('\n📋 Resumen:');
    console.log(`   • Profesional ID: ${professionalId}`);
    console.log(`   • Reglas de disponibilidad: ${existingRules?.length || 0}`);
    console.log(`   • Excepciones: ${existingOverrides?.length || 0}`);
    console.log(`   • Bloques de tiempo: ${existingBlocked?.length || 0}`);

  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar configuración
setupAvailabilityData().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
