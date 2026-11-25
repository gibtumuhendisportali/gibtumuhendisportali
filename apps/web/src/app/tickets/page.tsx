import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type MeResponse,
  type TicketsListResponse,
} from "@gibtu/shared";
import { QrCodeCanvas } from "../../components/tickets/QrCodeCanvas";
import { ApiClientError, apiRequest } from "../../lib/api/client";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatEventDate(startsAt: string): string {
  return new Date(startsAt).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketsPage() {
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login?next=/tickets");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/tickets");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login?next=/tickets");
  }

  let meData: MeResponse;
  try {
    meData = await apiRequest<MeResponse>("/v1/me", {
      accessToken: session.access_token,
    });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      redirect("/login?next=/tickets");
    }
    throw err;
  }

  if (!meData.onboarded || !meData.user) {
    redirect("/onboarding");
  }

  if (meData.user.verificationStatus !== "verified") {
    redirect("/dashboard");
  }

  const ticketsData = await apiRequest<TicketsListResponse>("/v1/tickets", {
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
              href="/events"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.dashboard.eventsLink}
            </Link>
            <Link
              href="/dashboard"
              className="border border-border bg-paper px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.tickets.backToDashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-brass">
          {dict.tickets.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {dict.tickets.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{dict.tickets.subtitle}</p>

        <div className="mt-8">
          {ticketsData.items.length === 0 ? (
            <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
              {dict.tickets.emptyState}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {ticketsData.items.map((ticket) => {
                const statusLabel =
                  ticket.status === "checked_in"
                    ? dict.tickets.statusCheckedIn
                    : ticket.status === "cancelled"
                      ? dict.tickets.statusCancelled
                      : dict.tickets.statusActive;

                const statusClass =
                  ticket.status === "checked_in"
                    ? "border-sage text-navy"
                    : ticket.status === "cancelled"
                      ? "border-border text-muted"
                      : "border-brass text-navy";

                return (
                  <article
                    key={ticket.ticketId}
                    className="flex flex-col justify-between border border-border bg-surface p-6"
                  >
                    <div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="border border-border bg-paper px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-navy">
                          {ticket.communityName ?? dict.events.platformWideLabel}
                        </span>
                        <span
                          className={`border bg-paper px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <h2 className="font-heading text-xl font-semibold text-navy">
                        {ticket.eventTitle}
                      </h2>
                      <p className="mt-1 text-xs font-medium text-brass">
                        {formatEventDate(ticket.eventStartsAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted">{ticket.eventLocation}</p>

                      {ticket.checkedInAt && (
                        <p className="mt-3 text-xs text-navy">
                          <span className="font-medium">{dict.tickets.checkedInAtLabel}:</span>{" "}
                          {formatEventDate(ticket.checkedInAt)}
                        </p>
                      )}
                    </div>

                    {ticket.status !== "cancelled" && ticket.qrToken && (
                      <div className="mt-5">
                        <p className="mb-2 text-xs text-muted">{dict.tickets.qrHint}</p>
                        <QrCodeCanvas
                          token={ticket.qrToken}
                          label={ticket.eventTitle}
                          copyLabel={dict.tickets.tokenCopyLabel}
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
