import { createClient } from '@supabase/supabase-js';

export const SUPABASE_REQUEST_TIMEOUT_MS = 15000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// the anon key used by the public client. some projects use
// NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY instead of ANON_KEY.
// try both so the env can use whichever name the dashboard shows.
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables (URL or anon key not set)'
  );
}

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);

  init?.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => globalThis.clearTimeout(timeout));
}

export function withSupabaseTimeout<T>(promise: Promise<T>, message = "Tempo limite ao conectar com o Supabase.") {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      globalThis.setTimeout(() => reject(new Error(message)), SUPABASE_REQUEST_TIMEOUT_MS);
    }),
  ]);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: "easystock-auth-token",
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
