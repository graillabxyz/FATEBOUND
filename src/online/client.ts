import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  return data.session
    ? { Authorization: `Bearer ${data.session.access_token}` }
    : {};
}
export async function cloudFetch(path: string, init: RequestInit = {}) {
  return fetch(path, {
    ...init,
    headers: {
      ...Object.fromEntries(new Headers(init.headers)),
      ...(await authHeaders()),
    },
  });
}
