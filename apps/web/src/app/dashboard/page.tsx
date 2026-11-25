import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, type MeResponse } from "@gibtu/shared";
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

  let me: MeResponse | null = null;
  let apiError = false;

  if (session?.access_token) {
    try {
      me = await apiRequest<MeResponse>("/v1/me", {
        method: "GET",
        accessToken: session.access_token,
        cache: "no-store",
      });
    } catch {
      me = null;
      apiError = true;
    }
  } else {
    apiError = true;
  }

  if (!apiError && me && !me.onboarded) {
    redirect("/onboarding");
  }

  const d1User = me?.user ?? null;
  const d1Profile = me?.profile ?? null;
  const resolvedEmail = d1User?.email ?? user.email ?? "-";
  const isPlatformAdmin =
    d1User?.role === "platform_admin" && d1User.verificationStatus === "verified";

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-navy">
            {dict.common.brandName}
          </Link>
          <div className="flex items-center gap-3">
            {isPlatformAdmin && (
              <Link
                href="/admin/verifications"
                className="border border-brass bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:bg-brass/10"
              >
                {dict.dashboard.adminQueueLink}
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="border border-navy px-3.5 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-surface"
              >
                {dict.common.logout}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
            {dict.dashboard.eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
            {d1Profile ? `${dict.dashboard.title}, ${d1Profile.fullName}` : dict.dashboard.title}
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

        {d1User && (
          <section className="mt-8 border border-navy bg-navy p-6 text-paper">
            <h2 className="font-heading text-xl font-semibold text-paper">
              {d1User.verificationStatus === "verified"
                ? dict.dashboard.statusVerifiedTitle
                : d1User.verificationStatus === "rejected"
                  ? dict.dashboard.statusRejectedTitle
                  : dict.dashboard.statusPendingTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-paper/85">
              {d1User.verificationStatus === "verified"
                ? dict.dashboard.statusVerifiedBody
                : d1User.verificationStatus === "rejected"
                  ? dict.dashboard.statusRejectedBody
                  : dict.dashboard.statusPendingBody}
            </p>
            {d1User.verificationStatus === "rejected" && d1User.rejectionReason && (
              <p className="mt-3 border-l-2 border-brass pl-3 text-xs text-brass">
                {d1User.rejectionReason}
              </p>
            )}
          </section>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="border border-border bg-surface p-6">
            <h2 className="font-heading text-xl font-semibold text-navy">
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
                <dt className="text-xs text-ink-muted">{dict.dashboard.apiStatusTitle}</dt>
                <dd className="mt-1 text-xs text-ink-muted">
                  {d1User ? dict.dashboard.apiVerifiedText : dict.dashboard.apiUnavailableText}
                </dd>
              </div>
            </dl>
          </section>

          {d1Profile && (
            <section className="border border-border bg-surface p-6">
              <h2 className="font-heading text-xl font-semibold text-navy">
                {dict.dashboard.profileSummaryTitle}
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="border-t border-border pt-3">
                  <dt className="text-xs text-ink-muted">{dict.dashboard.userTypeLabel}</dt>
                  <dd className="mt-1 font-medium text-navy">
                    {d1Profile.userType === "alumni"
                      ? dict.dashboard.userTypeAlumni
                      : dict.dashboard.userTypeStudent}
                  </dd>
                </div>
                <div className="border-t border-border pt-3">
                  <dt className="text-xs text-ink-muted">{dict.dashboard.departmentLabel}</dt>
                  <dd className="mt-1 font-medium text-navy">{d1Profile.department}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                  <div>
                    <dt className="text-xs text-ink-muted">{dict.dashboard.entryYearLabel}</dt>
                    <dd className="mt-1 font-medium text-navy">{d1Profile.entryYear}</dd>
                  </div>
                  {d1Profile.graduationYear && (
                    <div>
                      <dt className="text-xs text-ink-muted">
                        {dict.dashboard.graduationYearLabel}
                      </dt>
                      <dd className="mt-1 font-medium text-navy">{d1Profile.graduationYear}</dd>
                    </div>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  <dt className="text-xs text-ink-muted">{dict.dashboard.directoryPrivacyLabel}</dt>
                  <dd className="mt-1 text-xs text-ink-muted">
                    {dict.dashboard.directoryHiddenText}
                  </dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
