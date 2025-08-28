"use server";

import { createClient } from "@/utils/supabase/server";

export async function insertConfirmedUser(userData: { 
  id: string; 
  name: string; 
  last_name: string; 
  email: string; 
  role: number; 
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("users").insert({
    user_id: userData.id,
    name: userData.name,
    last_name: userData.last_name,
    email: userData.email,
    is_active: true,
    role: userData.role,
  });

  if (error) {
    console.error("Error al insertar el usuario confirmado en la tabla 'users':", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
