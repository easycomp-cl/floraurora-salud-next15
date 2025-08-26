// lib/accountProvider.ts
import { createClient } from "@supabase/supabase-js";
import { createClient as createClientServer } from "@/utils/supabase/server"; // tu SSR client (cookies)
                                                             // si no lo tienes, puedes crear
// Admin client (Service Role) — SOLO backend
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/** Prints provider info for a given email. Use only on the server. */
export async function logAccountProvider(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  const supabase = await createClientServer();

  // 1) Look up in Supabase Auth by exact email (Admin API)
  const { data: listed, error: adminErr } = await admin.auth.admin.listUsers({
        email,
  });

  if (adminErr) {
    console.error("❌ Auth service unavailable:", adminErr);
    return { exists: false };
  }

  // pick exact match by email to avoid false positives
  const authUser =
    listed?.users?.find((u) => (u.email || "").toLowerCase() === email) ?? null;

  // 2) Look up in your domain table (public.users) by exact email
  const { data: domainUser, error: domainErr } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (domainErr) {
    console.error("❌ DB error reading public.users:", domainErr);
  }

  // 3) If nothing exists anywhere → print "doesn't exist"
  if (!authUser && !domainUser) {
    console.log(`🚫 The account doesn't exist for: ${email}`);
    return { exists: false };
  }

  // 4) Resolve providers (identities can be null; use app_metadata as fallback)
  let providers: string[] = [];
  if (authUser) {
    const fromIdentities = Array.isArray(authUser.identities)
      ? authUser.identities.map((i: any) => i.provider).filter(Boolean)
      : [];
    const fromAppMeta = Array.isArray(authUser.app_metadata?.providers)
      ? authUser.app_metadata.providers
      : authUser.app_metadata?.provider
      ? [authUser.app_metadata.provider]
      : [];

    providers = Array.from(new Set([...fromIdentities, ...fromAppMeta]));
  }

  // 5) Friendly logs
  if (authUser) {
    const pretty = providers.length ? providers.join(", ") : "none";
    console.log(`✅ Supabase Auth: user found for ${email}. Providers: ${pretty}`);
  } else {
    console.log(`ℹ️ No Supabase Auth user for ${email}.`);
  }

  if (domainUser) {
    console.log(
      `📇 public.users: row exists (id=${domainUser.id}, role=${domainUser.role}).`
    );
  } else {
    console.log(`ℹ️ public.users: no row for ${email}.`);
  }

  return {
    exists: true,
    inAuth: !!authUser,
    inDomain: !!domainUser,
    providers, // e.g. ["google"], ["email"], or []
  };
}
