import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, type AuthMeResponse } from "@gibtu/shared";
import { apiRequest } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  if (!user.email_confirmed_at) {
    redirect(`/auth/verify?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let apiIdentity: AuthMeResponse["user"] | null = null;
  let apiError = false;

  if (session?.access_token) {
    try {
      const response = await apiRequest<AuthMeResponse>("/v1/auth/me", {
        method: "GET",
        accessToken: session.access_token,
        cache: "no-store",
      });
      apiIdentity = response.user;
    } catch {
      apiIdentity = null;
      apiError = true;
    }
  } else {
    apiError = true;
  }

  const resolvedEmail = apiIdentity?.email ?? user.email ?? "-";
  const resolvedUserId = apiIdentity?.supabaseUserId ?? user.id;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-serif text-lg font-medium tracking-tight text-navy"
          >
            {dict.common.brandName}
          </Link>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="border border-navy px-3.5 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-surface"
            >
              {dict.common.logout}
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
            {dict.dashboard.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-navy">
            {dict.dashboard.title}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{dict.dashboard.subtitle}</p>
        </div>

        {apiError && (
          <div
            role="alert"
            className="mt-6 border border-brass bg-surface px-4 py-3 text-sm text-ink"
          >
            {dict.dashboard.apiErrorBanner}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="border border-border bg-surface p-6">
            <h2 className="font-serif text-xl text-navy">
              {dict.dashboard.accountSectionTitle}
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="border-t border-border pt-3">
                <dt className="text-xs text-ink-muted">{dict.dashboard.emailLabel}</dt>
                <dd className="mt-1 font-medium text-navy">{resolvedEmail}</dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="text-xs text-ink-muted">{dict.dashboard.emailVerifiedLabel}</dt>
                <dd className="mt-1 font-medium text-navy">
                  {user.email_confirmed_at
                    ? dict.dashboard.emailVerifiedYes
                    : dict.dashboard.emailVerifiedNo}
                </dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="text-xs text-ink-muted">{dict.dashboard.supabaseIdLabel}</dt>
                <dd className="mt-1 font-mono text-xs text-ink-muted">{resolvedUserId}</dd>
              </div>
            </dl>
          </section>

          <div className="space-y-6">
            <section className="border border-border bg-surface p-6">
              <h2 className="font-serif text-xl text-navy">
                {dict.dashboard.apiStatusTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {apiIdentity
                  ? dict.dashboard.apiVerifiedText
                  : dict.dashboard.apiUnavailableText}
              </p>
            </section>

            <section className="border border-border bg-surface p-6">
              <h2 className="font-serif text-xl text-navy">
                {dict.dashboard.institutionalStatusTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {dict.dashboard.institutionalStatusBody}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
