"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDictionary, loginSchema } from "@gibtu/shared";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { sanitizeRedirectPath } from "@/lib/supabase/redirect";

const dict = getDictionary("tr");

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const initialError =
    errorParam === "callback"
      ? dict.auth.login.callbackError
      : errorParam === "signout"
        ? dict.auth.login.signoutError
        : null;
  const nextPath = sanitizeRedirectPath(searchParams.get("next"), "/dashboard");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(firstIssue?.message ?? dict.auth.login.invalidCredentials);
      return;
    }

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setErrorMessage(dict.auth.configMissingError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        const lower = error.message.toLowerCase();
        if (lower.includes("email not confirmed")) {
          setErrorMessage(dict.auth.login.emailNotConfirmed);
        } else {
          setErrorMessage(dict.auth.login.invalidCredentials);
        }
        return;
      }

      if (data.user && !data.user.email_confirmed_at) {
        router.push(`/auth/verify?email=${encodeURIComponent(parsed.data.email)}`);
        router.refresh();
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border border-border bg-surface p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
        {dict.auth.login.eyebrow}
      </p>
      <h1 className="mt-2 font-serif text-2xl font-normal text-navy">
        {dict.auth.login.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {dict.auth.login.subtitle}
      </p>

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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border border-navy bg-navy px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? dict.auth.submitLoading : dict.auth.login.submitLabel}
        </button>
      </form>

      <p className="mt-6 border-t border-border pt-4 text-xs text-ink-muted">
        {dict.auth.login.noAccountPrompt}{" "}
        <Link href="/register" className="font-medium text-navy underline underline-offset-4">
          {dict.auth.login.registerLinkLabel}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthPageShell>
      <Suspense
        fallback={
          <div className="border border-border bg-surface p-8 text-sm text-ink-muted">
            {dict.common.loading}
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
