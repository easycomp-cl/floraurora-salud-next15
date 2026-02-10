import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { adminService } from "@/lib/services/adminService";
import { createAdminServer } from "@/utils/supabase/server";

export async function getAdminActorId(request?: NextRequest): Promise<number | null> {
  try {
    // 1. Authorization Bearer token (el cliente usa localStorage, no cookies)
    const authHeader = request?.headers?.get?.("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (bearerToken) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
      if (!error && user?.id) {
        const profile = await adminService.getUserByUuid(user.id);
        if (profile && profile.role_id === 1) return profile.id;
      }
    }

    // 2. X-User-ID header (alternativa)
    if (request) {
      const headerUserId = request.headers.get("X-User-ID");
      if (headerUserId) {
        const adminSupabase = createAdminServer();
        const { data: userRecord, error: userError } = await adminSupabase
          .from("users")
          .select("id, role")
          .eq("user_id", headerUserId)
          .single();

        if (!userError && userRecord && userRecord.role === 1) return userRecord.id;
      }
    }

    // 3. Fallback: cookies (por si hay sesión en cookies)
    const supabase = await createServerClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return null;

    const profile = await adminService.getUserByUuid(user.id);

    if (!profile || profile.role_id !== 1) return null;

    return profile.id;
  } catch (error) {
    console.warn("[getAdminActorId] No se pudo determinar el actor actual", error);
    return null;
  }
}

