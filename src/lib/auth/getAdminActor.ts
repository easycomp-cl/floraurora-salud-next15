import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { adminService } from "@/lib/services/adminService";
import { createAdminServer } from "@/utils/supabase/server";

export async function getAdminActorId(request?: NextRequest): Promise<number | null> {
  try {
    // Si hay un request con header X-User-ID, intentar usarlo primero
    if (request) {
      const headerUserId = request.headers.get("X-User-ID");
      if (headerUserId) {
        const adminSupabase = createAdminServer();
        const { data: userRecord, error: userError } = await adminSupabase
          .from("users")
          .select("id, role")
          .eq("user_id", headerUserId)
          .single();

        if (!userError && userRecord && userRecord.role === 1) {
          return userRecord.id;
        }
      }
    }

    // Fallback: usar cookies como antes
    const supabase = await createClient(request);
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

