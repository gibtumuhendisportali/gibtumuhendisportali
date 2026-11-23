import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeRedirectPath } from "./redirect";

export const ALLOWED_EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export interface CallbackSupabaseClient {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: unknown | null }>;
    verifyOtp: (params: {
      type: EmailOtpType;
      token_hash: string;
    }) => Promise<{ error: unknown | null }>;
  };
}

export async function handleAuthCallback(
  request: NextRequest,
  getClient: () => Promise<CallbackSupabaseClient | null>,
): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const nextPath = sanitizeRedirectPath(searchParams.get("next"), "/dashboard");

  const supabase = await getClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=callback", origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, origin));
    }
  } else if (tokenHash && rawType && ALLOWED_EMAIL_OTP_TYPES.has(rawType as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(nextPath, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
