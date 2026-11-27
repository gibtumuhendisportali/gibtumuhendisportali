import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type EventAttendeesResponse,
  type MeResponse,
} from "@gibtu/shared";
import { ApiClientError, apiRequest } from "../../../../lib/api/client";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EventAttendeesPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await props.params;
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect(`/login?next=/events/${eventId}/attendees`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/events/${eventId}/attendees`);
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(`/login?next=/events/${eventId}/attendees`);
  }

  let meData: MeResponse;
  try {
    meData = await apiRequest<MeResponse>("/v1/me", {
      accessToken: session.access_token,
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      redirect(`/login?next=/events/${eventId}/attendees`);
    }
    throw err;
  }

  if (!meData.onboarded || !meData.user) {
    redirect("/onboarding");
  }

  if (meData.user.verificationStatus !== "verified") {
    redirect("/dashboard");
  }

  let data: EventAttendeesResponse;
  try {
    data = await apiRequest<EventAttendeesResponse>(
      `/v1/events/${encodeURIComponent(eventId)}/attendees`,
      { accessToken: session.access_token },
    );
  } catch (err) {
    if (err instanceof ApiClientError && (err.status === 403 || err.status === 404)) {
      redirect("/events");
    }
    throw err;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-navy">
            {dict.common.brandName}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/check-in"
              className="border border-brass bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:bg-brass/10"
            >
              {dict.dashboard.checkInLink}
            </Link>
            <Link
              href="/events"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.dashboard.eventsLink}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-brass">
          {dict.events.attendeesEyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {data.eventTitle}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {dict.events.attendeesTitle} · {dict.events.registeredCountLabel}:{" "}
          <span className="font-semibold text-navy">
            {data.registeredCount} / {data.capacity}
          </span>{" "}
          · {dict.events.checkedInCountLabel}:{" "}
          <span className="font-semibold text-navy">{data.checkedInCount}</span>
        </p>

        <div className="mt-8">
          {data.items.length === 0 ? (
            <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
              {dict.events.attendeesEmpty}
            </div>
          ) : (
            <div className="divide-y divide-border border border-border bg-surface">
              {data.items.map((item) => {
                const statusLabel =
                  item.ticketStatus === "checked_in"
                    ? dict.tickets.statusCheckedIn
                    : item.registrationStatus === "cancelled"
                      ? dict.tickets.statusCancelled
                      : dict.tickets.statusActive;

                const statusClass =
                  item.ticketStatus === "checked_in"
                    ? "border-sage text-navy"
                    : item.registrationStatus === "cancelled"
                      ? "border-border text-muted"
                      : "border-brass text-navy";

                return (
                  <div
                    key={item.userId}
                    className="flex flex-col justify-between gap-2 p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-heading text-base font-semibold text-navy">
                        {item.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {item.department} ·{" "}
                        {item.userType === "alumni"
                          ? dict.dashboard.userTypeAlumni
                          : dict.dashboard.userTypeStudent}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {item.checkedInAt && (
                        <span className="text-xs text-muted">
                          {new Date(item.checkedInAt).toLocaleString("tr-TR")}
                        </span>
                      )}
                      <span
                        className={`border bg-paper px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
