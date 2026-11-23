export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseConfigValidation {
  config: SupabasePublicConfig | null;
  missing: string[];
  errorMessage: string | null;
}

export function validateSupabasePublicConfig(
  env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): SupabaseConfigValidation {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const legacyAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const key = publishableKey || legacyAnonKey;

  const missing: string[] = [];
  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veya geriye dönük NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  if (missing.length > 0 || !url || !key) {
    return {
      config: null,
      missing,
      errorMessage: `Eksik Supabase ortam değişkeni: ${missing.join(", ")}.`,
    };
  }

  return {
    config: { url, anonKey: key },
    missing: [],
    errorMessage: null,
  };
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  return validateSupabasePublicConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }).config;
}
