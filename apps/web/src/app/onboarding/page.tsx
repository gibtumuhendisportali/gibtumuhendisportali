import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, type MeResponse } from "@gibtu/shared";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { apiRequest } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
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
    redirect("/login?next=/onboarding");
  }

  if (!user.email_confirmed_at) {
    redirect(`/auth/verify?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    try {
      const me = await apiRequest<MeResponse>("/v1/me", {
        method: "GET",
        accessToken: session.access_token,
        cache: "no-store",
      });
      if (me.onboarded) {
        redirect("/dashboard");
      }
    } catch {
      // Allow rendering onboarding form; submit handler will report API errors cleanly if API is down.
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-navy">
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

      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
        <div className="border border-border bg-surface p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
            {dict.onboarding.eyebrow}
          </p>
          <h1 className="mt-2 font-heading text-2xl font-semibold text-navy">
            {dict.onboarding.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {dict.onboarding.subtitle}
          </p>

          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}
