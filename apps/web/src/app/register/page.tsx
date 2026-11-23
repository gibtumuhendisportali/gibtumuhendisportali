"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getDictionary, registerSchema } from "@gibtu/shared";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const dict = getDictionary("tr");

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = registerSchema.safeParse({
      email,
      password,
      passwordConfirm,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(firstIssue?.message ?? dict.auth.genericError);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setErrorMessage(dict.auth.configMissingError);
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        // Avoid exposing whether an account already exists.
        setErrorMessage(dict.auth.genericError);
        return;
      }

      setIsSuccess(true);
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell>
      <div className="border border-border bg-surface p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
          {dict.auth.register.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-2xl font-normal text-navy">
          {dict.auth.register.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {dict.auth.register.subtitle}
        </p>

        {isSuccess ? (
          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <h2 className="font-serif text-lg text-navy">
              {dict.auth.register.successTitle}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {dict.auth.register.successBody}
            </p>
            <p className="border-l-2 border-brass pl-3 text-xs leading-relaxed text-ink-muted">
              {dict.auth.register.personalEmailNote}
            </p>
            <Link
              href={`/auth/verify?email=${encodeURIComponent(email.trim())}`}
              className="inline-block border border-navy bg-navy px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
            >
              {dict.auth.register.goToVerify}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="border border-brass bg-paper px-3.5 py-2.5 text-sm text-ink"
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-navy">
                {dict.auth.emailLabel}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={dict.auth.emailPlaceholder}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-navy">
                {dict.auth.passwordLabel}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">{dict.auth.passwordHint}</p>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-xs font-medium text-navy">
                {dict.auth.passwordConfirmLabel}
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <p className="border-l-2 border-border pl-3 text-xs leading-relaxed text-ink-muted">
              {dict.auth.register.personalEmailNote}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border border-navy bg-navy px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? dict.auth.submitLoading : dict.auth.register.submitLabel}
            </button>
          </form>
        )}

        <p className="mt-6 border-t border-border pt-4 text-xs text-ink-muted">
          {dict.auth.register.hasAccountPrompt}{" "}
          <Link href="/login" className="font-medium text-navy underline underline-offset-4">
            {dict.auth.register.loginLinkLabel}
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
