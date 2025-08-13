"use client";

import supabase from "@/utils/supabase/client";

// Función para iniciar sesión con email y password
export async function clientLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error during login:", error);
    return { data: null, error };
  }
}

// Función para registrarse con email y password
export async function clientSignup(email: string, password: string, fullName: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          email: email,
        },
      },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error during signup:", error);
    return { data: null, error };
  }
}

// Función para cerrar sesión
export async function clientSignout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("Error during signout:", error);
    return { error };
  }
}

// Función para iniciar sesión con Google
export async function clientSignInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error during Google sign in:", error);
    return { data: null, error };
  }
}
