import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./client";

export async function createClient() {
    const cookieStore = await cookies();
    
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // Ignorar errores en Server Components
                    }
                }
            }
        }
    );
}

// Funciones de utilidad específicas para el servidor
export const serverAuth = {
    // Obtener el usuario actual desde el servidor
    getCurrentUser: async () => {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Obtener la sesión actual desde el servidor
    getCurrentSession: async () => {
        const supabase = await createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        return { session, error };
    },

    // Verificar si el usuario está autenticado
    isAuthenticated: async () => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    },

    // Obtener el rol del usuario actual
    getUserRole: async () => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
        
        return userData?.role || null;
    }
};

// Funciones de base de datos específicas para el servidor
export const serverDb = {
    // Usuarios
    getUserById: async (id: string) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    },

    getUserByEmail: async (email: string) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        return { data, error };
    },

    createUser: async (userData: Database['public']['Tables']['users']['Insert']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();
        return { data, error };
    },

    updateUser: async (id: string, updates: Database['public']['Tables']['users']['Update']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Sesiones
    getSessions: async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                patient:users!sessions_patient_id_fkey(*),
                psychologist:users!sessions_psychologist_id_fkey(*)
            `)
            .order('start_time', { ascending: false });
        return { data, error };
    },

    getSessionsByUser: async (userId: string, role: 'patient' | 'psychologist') => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                patient:users!sessions_patient_id_fkey(*),
                psychologist:users!sessions_psychologist_id_fkey(*)
            `)
            .eq(role === 'patient' ? 'patient_id' : 'psychologist_id', userId)
            .order('start_time', { ascending: false });
        return { data, error };
    },

    getSessionById: async (id: string) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                patient:users!sessions_patient_id_fkey(*),
                psychologist:users!sessions_psychologist_id_fkey(*)
            `)
            .eq('id', id)
            .single();
        return { data, error };
    },

    createSession: async (sessionData: Database['public']['Tables']['sessions']['Insert']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sessions')
            .insert(sessionData)
            .select()
            .single();
        return { data, error };
    },

    updateSession: async (id: string, updates: Database['public']['Tables']['sessions']['Update']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('sessions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Videollamadas
    getVideoCalls: async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('video_calls')
            .select(`
                *,
                session:sessions(*)
            `)
            .order('start_time', { ascending: false });
        return { data, error };
    },

    getVideoCallById: async (id: string) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('video_calls')
            .select(`
                *,
                session:sessions(*)
            `)
            .eq('id', id)
            .single();
        return { data, error };
    },

    createVideoCall: async (videoCallData: Database['public']['Tables']['video_calls']['Insert']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('video_calls')
            .insert(videoCallData)
            .select()
            .single();
        return { data, error };
    },

    updateVideoCall: async (id: string, updates: Database['public']['Tables']['video_calls']['Update']) => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('video_calls')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Funciones de búsqueda y filtrado
    searchUsers: async (query: string, role?: 'patient' | 'psychologist') => {
        const supabase = await createClient();
        let queryBuilder = supabase
            .from('users')
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

        if (role) {
            queryBuilder = queryBuilder.eq('role', role);
        }

        const { data, error } = await queryBuilder;
        return { data, error };
    },

    getUpcomingSessions: async (userId: string, role: 'patient' | 'psychologist') => {
        const supabase = await createClient();
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('sessions')
            .select(`
                *,
                patient:users!sessions_patient_id_fkey(*),
                psychologist:users!sessions_psychologist_id_fkey(*)
            `)
            .eq(role === 'patient' ? 'patient_id' : 'psychologist_id', userId)
            .gte('start_time', now)
            .order('start_time', { ascending: true });
        return { data, error };
    }
};