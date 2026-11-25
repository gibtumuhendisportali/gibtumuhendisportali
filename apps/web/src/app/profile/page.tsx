import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary, type MeResponse } from "@gibtu/shared";
import { ProfileEditorClient } from "@/components/profile/ProfileEditorClient";
import { apiRequest } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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
    redirect("/login?next=/profile");
  }

  if (!user.email_confirmed_at) {
    redirect(`/auth/verify?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  let me: MeResponse | null = null;
  try {
    me = await apiRequest<MeResponse>("/v1/me", {
      method: "GET",
      accessToken: session.access_token,
      cache: "no-store",
    });
  } catch {
    redirect("/dashboard");
  }

  if (!me.onboarded || !me.user || !me.profile) {
    redirect("/onboarding");
  }

  if (me.user.verificationStatus !== "verified") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="font-heading text-lg font-semibold text-navy">
            {dict.common.brandName}
          </Link>
          <Link
            href="/dashboard"
            className="border border-border px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
          >
            {dict.profile.backToDashboard}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
          {dict.profile.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {dict.profile.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.profile.subtitle}</p>

        <ProfileEditorClient initialProfile={me.profile} />
      </main>
    </div>
  );
}
