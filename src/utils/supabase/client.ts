import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

// Crear una única instancia del cliente para evitar múltiples instancias
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // Habilitar para OAuth
        flowType: 'pkce',
        debug: false, // Deshabilitar debug en producción
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'sb-auth-token'
      },
      global: {
        headers: {
          'X-Client-Info': 'floraurora-psychology-platform'
        }
      }
    });
  }
  return supabaseInstance;
})();

// Tipos para las tablas de la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'patient' | 'psychologist' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'patient' | 'psychologist' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'patient' | 'psychologist' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          patient_id: string
          psychologist_id: string
          start_time: string
          end_time: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          psychologist_id: string
          start_time: string
          end_time: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          psychologist_id?: string
          start_time?: string
          end_time?: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
        }
      }
      video_calls: {
        Row: {
          id: string
          session_id: string
          room_name: string
          start_time: string
          end_time: string | null
          recording_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          room_name: string
          start_time: string
          end_time?: string | null
          recording_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          room_name?: string
          start_time?: string
          end_time?: string | null
          recording_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Cliente tipado con la interfaz de la base de datos
export const supabaseTyped = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Funciones de utilidad para autenticación
export const auth = {
  signUp: async (email: string, password: string, userData: { full_name: string; role: 'patient' | 'psychologist' }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Funciones de utilidad para la base de datos
export const db = {
  // Usuarios
  getUsers: async () => {
    const { data, error } = await supabaseTyped
      .from('users')
      .select('*');
    return { data, error };
  },

  getUserById: async (id: string) => {
    const { data, error } = await supabaseTyped
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  createUser: async (userData: Database['public']['Tables']['users']['Insert']) => {
    const { data, error } = await supabaseTyped
      .from('users')
      .insert(userData)
      .select()
      .single();
    return { data, error };
  },

  updateUser: async (id: string, updates: Database['public']['Tables']['users']['Update']) => {
    const { data, error } = await supabaseTyped
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Sesiones
  getSessions: async () => {
    const { data, error } = await supabaseTyped
      .from('sessions')
      .select(`
        *,
        patient:users!sessions_patient_id_fkey(*),
        psychologist:users!sessions_psychologist_id_fkey(*)
      `);
    return { data, error };
  },

  getSessionsByUser: async (userId: string, role: 'patient' | 'psychologist') => {
    const { data, error } = await supabaseTyped
      .from('sessions')
      .select(`
        *,
        patient:users!sessions_patient_id_fkey(*),
        psychologist:users!sessions_psychologist_id_fkey(*)
      `)
      .eq(role === 'patient' ? 'patient_id' : 'psychologist_id', userId);
    return { data, error };
  },

  createSession: async (sessionData: Database['public']['Tables']['sessions']['Insert']) => {
    const { data, error } = await supabaseTyped
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    return { data, error };
  },

  updateSession: async (id: string, updates: Database['public']['Tables']['sessions']['Update']) => {
    const { data, error } = await supabaseTyped
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Videollamadas
  getVideoCalls: async () => {
    const { data, error } = await supabaseTyped
      .from('video_calls')
      .select(`
        *,
        session:sessions(*)
      `);
    return { data, error };
  },

  createVideoCall: async (videoCallData: Database['public']['Tables']['video_calls']['Insert']) => {
    const { data, error } = await supabaseTyped
      .from('video_calls')
      .insert(videoCallData)
      .select()
      .single();
    return { data, error };
  },

  updateVideoCall: async (id: string, updates: Database['public']['Tables']['video_calls']['Update']) => {
    const { data, error } = await supabaseTyped
      .from('video_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  }
};

export default supabase;