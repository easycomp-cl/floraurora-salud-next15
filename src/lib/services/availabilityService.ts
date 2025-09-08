import { supabase } from "@/utils/supabase/client";
import { 
  AvailabilityRule, 
  AvailabilityOverride, 
  BlockedSlot, 
  AvailabilityView 
} from "@/lib/types/availability";

export class AvailabilityService {
  /**
   * Obtiene todas las reglas de disponibilidad de un profesional
   */
  static async getAvailabilityRules(professionalId: number): Promise<AvailabilityRule[]> {
    try {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("professional_id", professionalId)
        .order("weekday")
        .order("start_time");

      if (error) {
        console.error("❌ Error al obtener reglas de disponibilidad:", error);
        throw error;
      }

      // Convertir 23:59:59 de vuelta a 00:00 para la interfaz
      const rules = (data as unknown as AvailabilityRule[]) || [];
      return rules.map(rule => ({
        ...rule,
        end_time: rule.end_time === "23:59:59" ? "00:00" : rule.end_time
      }));
    } catch (error) {
      console.error("💥 Error inesperado al obtener reglas de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Crea una nueva regla de disponibilidad
   */
  static async createAvailabilityRule(rule: Omit<AvailabilityRule, 'id' | 'created_at'>): Promise<AvailabilityRule> {
    console.log("createAvailabilityRule-rule", rule);
    try {
      // Convertir 00:00 a 23:59:59 para la base de datos
      const processedRule = {
        ...rule,
        end_time: rule.end_time === "00:00" ? "23:59:59" : rule.end_time
      };

      const { data, error } = await supabase
        .from("availability_rules")
        .insert(processedRule)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al crear regla de disponibilidad:", error);
        throw error;
      }

      // Convertir de vuelta a 00:00 para la interfaz
      const result = data as unknown as AvailabilityRule;
      if (result.end_time === "23:59:59") {
        result.end_time = "00:00";
      }

      return result;
    } catch (error) {
      console.error("💥 Error inesperado al crear regla de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Actualiza una regla de disponibilidad existente
   */
  static async updateAvailabilityRule(id: number, rule: Partial<AvailabilityRule>): Promise<AvailabilityRule> {
    try {
      // Convertir 00:00 a 23:59:59 para la base de datos
      const processedRule = {
        ...rule,
        end_time: rule.end_time === "00:00" ? "23:59:59" : rule.end_time
      };

      const { data, error } = await supabase
        .from("availability_rules")
        .update(processedRule)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al actualizar regla de disponibilidad:", error);
        throw error;
      }

      // Convertir de vuelta a 00:00 para la interfaz
      const result = data as unknown as AvailabilityRule;
      if (result.end_time === "23:59:59") {
        result.end_time = "00:00";
      }

      return result;
    } catch (error) {
      console.error("💥 Error inesperado al actualizar regla de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Elimina una regla de disponibilidad
   */
  static async deleteAvailabilityRule(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("availability_rules")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error al eliminar regla de disponibilidad:", error);
        throw error;
      }
    } catch (error) {
      console.error("💥 Error inesperado al eliminar regla de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Obtiene todas las excepciones de disponibilidad de un profesional
   */
  static async getAvailabilityOverrides(professionalId: number): Promise<AvailabilityOverride[]> {
    try {
      const { data, error } = await supabase
        .from("availability_overrides")
        .select("*")
        .eq("professional_id", professionalId)
        .order("for_date")
        .order("start_time");

      if (error) {
        console.error("❌ Error al obtener excepciones de disponibilidad:", error);
        throw error;
      }

      return (data as unknown as AvailabilityOverride[]) || [];
    } catch (error) {
      console.error("💥 Error inesperado al obtener excepciones de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Crea una nueva excepción de disponibilidad
   */
  static async createAvailabilityOverride(override: Omit<AvailabilityOverride, 'id' | 'created_at'>): Promise<AvailabilityOverride> {
    try {
      const { data, error } = await supabase
        .from("availability_overrides")
        .insert(override)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al crear excepción de disponibilidad:", error);
        throw error;
      }

      return data as unknown as AvailabilityOverride;
    } catch (error) {
      console.error("💥 Error inesperado al crear excepción de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Elimina una excepción de disponibilidad
   */
  static async deleteAvailabilityOverride(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("availability_overrides")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error al eliminar excepción de disponibilidad:", error);
        throw error;
      }
    } catch (error) {
      console.error("💥 Error inesperado al eliminar excepción de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los bloques de tiempo de un profesional
   */
  static async getBlockedSlots(professionalId: number): Promise<BlockedSlot[]> {
    try {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("professional_id", professionalId)
        .order("starts_at");

      if (error) {
        console.error("❌ Error al obtener bloques de tiempo:", error);
        throw error;
      }

      return (data as unknown as BlockedSlot[]) || [];
    } catch (error) {
      console.error("💥 Error inesperado al obtener bloques de tiempo:", error);
      throw error;
    }
  }

  /**
   * Crea un nuevo bloque de tiempo
   */
  static async createBlockedSlot(blockedSlot: Omit<BlockedSlot, 'id' | 'created_at'>): Promise<BlockedSlot> {
    try {
      const { data, error } = await supabase
        .from("blocked_slots")
        .insert(blockedSlot)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al crear bloque de tiempo:", error);
        throw error;
      }

      return data as unknown as BlockedSlot;
    } catch (error) {
      console.error("💥 Error inesperado al crear bloque de tiempo:", error);
      throw error;
    }
  }

  /**
   * Actualiza un bloque de tiempo existente
   */
  static async updateBlockedSlot(id: number, blockedSlot: Partial<BlockedSlot>): Promise<BlockedSlot> {
    try {
      const { data, error } = await supabase
        .from("blocked_slots")
        .update(blockedSlot)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error al actualizar bloque de tiempo:", error);
        throw error;
      }

      return data as unknown as BlockedSlot;
    } catch (error) {
      console.error("💥 Error inesperado al actualizar bloque de tiempo:", error);
      throw error;
    }
  }

  /**
   * Elimina un bloque de tiempo
   */
  static async deleteBlockedSlot(id: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("blocked_slots")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error al eliminar bloque de tiempo:", error);
        throw error;
      }
    } catch (error) {
      console.error("💥 Error inesperado al eliminar bloque de tiempo:", error);
      throw error;
    }
  }

  /**
   * Obtiene toda la configuración de disponibilidad de un profesional
   */
  static async getAvailabilityView(professionalId: number): Promise<AvailabilityView> {
    try {
      const [weeklyRules, overrides, blockedSlots] = await Promise.all([
        this.getAvailabilityRules(professionalId),
        this.getAvailabilityOverrides(professionalId),
        this.getBlockedSlots(professionalId)
      ]);

      return {
        weeklyRules,
        overrides,
        blockedSlots
      };
    } catch (error) {
      console.error("💥 Error inesperado al obtener vista de disponibilidad:", error);
      throw error;
    }
  }

  /**
   * Valida si un horario es válido
   */
  static validateTimeSlot(startTime: string, endTime: string): boolean {
    // Convertir a minutos para manejar correctamente 00:00
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Si endTime es 00:00, significa que es medianoche del día siguiente (1440 minutos)
    const actualEndMinutes = endMinutes === 0 ? 1440 : endMinutes;
    
    // Validar que la hora de inicio sea menor que la de fin
    if (startMinutes >= actualEndMinutes) {
      return false;
    }
    
    // Validar que estén dentro del rango permitido (08:00 - 00:00)
    const minMinutes = timeToMinutes('08:00'); // 480 minutos
    const maxMinutes = 1440; // 24:00 = 00:00 del día siguiente
    
    return startMinutes >= minMinutes && actualEndMinutes <= maxMinutes;
  }

  /**
   * Valida que una hora esté en formato correcto (solo horas completas)
   */
  static validateHourFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):00$/;
    return timeRegex.test(time);
  }

  /**
   * Valida si dos horarios se solapan
   */
  static timeSlotsOverlap(
    start1: string, 
    end1: string, 
    start2: string, 
    end2: string
  ): boolean {
    // Convertir a minutos para comparación más precisa
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1) === 0 ? 1440 : timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2) === 0 ? 1440 : timeToMinutes(end2);

    // Dos horarios se solapan si:
    // 1. El inicio del primero está dentro del segundo: s1 >= s2 && s1 < e2
    // 2. El fin del primero está dentro del segundo: e1 > s2 && e1 <= e2
    // 3. El primero contiene completamente al segundo: s1 <= s2 && e1 >= e2
    // 4. El segundo contiene completamente al primero: s2 <= s1 && e2 >= e1
    
    return (s1 < e2 && e1 > s2);
  }

  /**
   * Función de prueba para validar la lógica de solapamiento
   * TODO: Remover después de verificar que funciona
   */
  static testTimeSlotsOverlap() {
    console.log("=== Pruebas de Solapamiento ===");
    
    // Caso 1: 11:00-15:00 vs 12:00-14:00 (debería solaparse)
    console.log("11:00-15:00 vs 12:00-14:00:", this.timeSlotsOverlap("11:00", "15:00", "12:00", "14:00"));
    
    // Caso 2: 09:00-12:00 vs 13:00-16:00 (no debería solaparse)
    console.log("09:00-12:00 vs 13:00-16:00:", this.timeSlotsOverlap("09:00", "12:00", "13:00", "16:00"));
    
    // Caso 3: 10:00-14:00 vs 12:00-16:00 (debería solaparse)
    console.log("10:00-14:00 vs 12:00-16:00:", this.timeSlotsOverlap("10:00", "14:00", "12:00", "16:00"));
    
    // Caso 4: 08:00-10:00 vs 10:00-12:00 (no debería solaparse - son adyacentes)
    console.log("08:00-10:00 vs 10:00-12:00:", this.timeSlotsOverlap("08:00", "10:00", "10:00", "12:00"));
    
    // Caso 5: 22:00-00:00 vs 23:00-00:00 (debería solaparse)
    console.log("22:00-00:00 vs 23:00-00:00:", this.timeSlotsOverlap("22:00", "00:00", "23:00", "00:00"));
    
    // Caso 6: 20:00-00:00 vs 08:00-12:00 (no debería solaparse)
    console.log("20:00-00:00 vs 08:00-12:00:", this.timeSlotsOverlap("20:00", "00:00", "08:00", "12:00"));
    
    console.log("=== Pruebas de Validación ===");
    
    // Caso 7: Validar horario con 00:00
    console.log("22:00-00:00 válido:", this.validateTimeSlot("22:00", "00:00"));
    console.log("08:00-00:00 válido:", this.validateTimeSlot("08:00", "00:00"));
    console.log("23:00-00:00 válido:", this.validateTimeSlot("23:00", "00:00"));
  }
}
