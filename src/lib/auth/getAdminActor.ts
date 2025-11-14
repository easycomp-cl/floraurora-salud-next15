import { createClient } from "@/utils/supabase/server";
import { adminService } from "@/lib/services/adminService";

export async function getAdminActorId(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return null;
    }

    const profile = await adminService.getUserByUuid(user.id);
    return profile?.id ?? null;
  } catch (error) {
    console.warn("[getAdminActorId] No se pudo determinar el actor actual", error);
    return null;
  }
}

