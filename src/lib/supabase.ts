import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Server-only Supabase clients. Env vars (set in Vercel):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — public, used with the staff member's session
//   SUPABASE_SECRET_KEY — never exposed to the browser; lets the booking API insert past row level security

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && publishableKey);

// Acts as the signed-in staff member, so row level security limits them to their branch.
export async function createStaffClient() {
  const cookieStore = await cookies();
  return createServerClient(url!, publishableKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only; the proxy refreshes the session instead.
        }
      },
    },
  });
}

// Bypasses row level security. Only for the booking API's insert; returns null until the secret key is configured.
export function createServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return null;
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
