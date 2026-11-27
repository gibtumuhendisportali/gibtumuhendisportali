import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type AdminCommunitiesResponse,
  type MeResponse,
} from "@gibtu/shared";
import { AdminCommunitiesClient } from "../../../components/admin/AdminCommunitiesClient";
import { ApiClientError, apiRequest } from "../../../lib/api/client";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCommunitiesPage() {
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login?next=/admin/communities");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/communities");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login?next=/admin/communities");
  }

  let meData: MeResponse;
  try {
    meData = await apiRequest<MeResponse>("/v1/me", {
      accessToken: session.access_token,
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      redirect("/login?next=/admin/communities");
    }
    throw err;
  }

  if (!meData.onboarded || !meData.user) {
    redirect("/onboarding");
  }

  if (
    meData.user.role !== "platform_admin" ||
    meData.user.verificationStatus !== "verified"
  ) {
    redirect("/dashboard");
  }

  const data = await apiRequest<AdminCommunitiesResponse>("/v1/admin/communities", {
    accessToken: session.access_token,
  });

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-navy">
            {dict.common.brandName}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/verifications"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.dashboard.adminQueueLink}
            </Link>
            <Link
              href="/dashboard"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.adminCommunities.backToDashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-brass">
          {dict.adminCommunities.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {dict.adminCommunities.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {dict.adminCommunities.subtitle}
        </p>

        <div className="mt-8">
          <AdminCommunitiesClient
            communities={data.communities}
            initialMembers={data.members}
            dict={dict.adminCommunities}
          />
        </div>
      </main>
    </div>
  );
}
