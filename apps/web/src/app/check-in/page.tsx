import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type EventsListResponse,
  type MeResponse,
} from "@gibtu/shared";
import { CheckInClient } from "../../components/checkin/CheckInClient";
import { ApiClientError, apiRequest } from "../../lib/api/client";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login?next=/check-in");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/check-in");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login?next=/check-in");
  }

  let meData: MeResponse;
  try {
    meData = await apiRequest<MeResponse>("/v1/me", {
      accessToken: session.access_token,
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      redirect("/login?next=/check-in");
    }
    throw err;
  }

  if (!meData.onboarded || !meData.user) {
    redirect("/onboarding");
  }

  const isVerified = meData.user.verificationStatus === "verified";
  const isPlatformAdmin = meData.user.role === "platform_admin" && isVerified;
  const allowedCommunityIds = new Set(
    meData.user.communityPermissions.map((perm) => perm.communityId),
  );

  if (!isVerified || (!isPlatformAdmin && allowedCommunityIds.size === 0)) {
    redirect("/dashboard");
  }

  const eventsData = await apiRequest<EventsListResponse>("/v1/events", {
    accessToken: session.access_token,
  });

  const manageableEvents = isPlatformAdmin
    ? eventsData.items
    : eventsData.items.filter(
        (item) => item.communityId !== null && allowedCommunityIds.has(item.communityId),
      );

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-navy">
            {dict.common.brandName}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/events"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.dashboard.eventsLink}
            </Link>
            <Link
              href="/dashboard"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.checkIn.backToDashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-brass">
          {dict.checkIn.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {dict.checkIn.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{dict.checkIn.subtitle}</p>

        <div className="mt-8">
          <CheckInClient events={manageableEvents} dict={dict.checkIn} />
        </div>
      </main>
    </div>
  );
}
