"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { emailSchema, getDictionary } from "@gibtu/shared";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const dict = getDictionary("tr");

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErrorMessage(dict.auth.verify.resendMissingEmail);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setErrorMessage(dict.auth.configMissingError);
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Return neutral guidance without leaking account existence.
        setStatusMessage(dict.auth.verify.resendSuccess);
        return;
      }

      setStatusMessage(dict.auth.verify.resendSuccess);
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border border-border bg-surface p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
        {dict.auth.verify.eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-2xl font-normal text-navy">
        {dict.auth.verify.title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{dict.auth.verify.body}</p>

      <p className="mt-4 border-l-2 border-brass pl-3 text-xs leading-relaxed text-ink-muted">
        {dict.auth.verify.institutionalSeparationNote}
      </p>

      <form onSubmit={handleResend} noValidate className="mt-6 space-y-3 border-t border-border pt-6">
        {errorMessage && (
          <div role="alert" className="border border-brass bg-paper px-3.5 py-2 text-sm text-ink">
            {errorMessage}
          </div>
        )}
        {statusMessage && (
          <div role="status" className="border border-sage bg-paper px-3.5 py-2 text-sm text-ink">
            {statusMessage}
          </div>
        )}

        <div>
          <label htmlFor="verify-email" className="block text-xs font-medium text-navy">
            {dict.auth.emailLabel}
          </label>
          <input
            id="verify-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict.auth.emailPlaceholder}
            className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full border border-navy bg-paper px-4 py-2 text-sm font-medium text-navy hover:bg-navy hover:text-surface transition-colors disabled:opacity-60"
        >
          {isSending ? dict.auth.verify.resendLoading : dict.auth.verify.resendButton}
        </button>
      </form>

      <div className="mt-6 border-t border-border pt-4 text-xs">
        <Link href="/login" className="font-medium text-navy underline underline-offset-4">
          {dict.auth.verify.backToLogin}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <AuthPageShell>
      <Suspense
        fallback={
          <div className="border border-border bg-surface p-8 text-sm text-ink-muted">
            {dict.common.loading}
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </AuthPageShell>
  );
}
