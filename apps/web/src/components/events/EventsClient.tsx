"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Dictionary, EventItem } from "@gibtu/shared";

interface ManageableCommunity {
  communityId: string;
  communityName: string;
}

interface EventsClientProps {
  initialEvents: EventItem[];
  dict: Dictionary["events"];
  canCreatePlatformWide: boolean;
  manageableCommunities: ManageableCommunity[];
  isVerifiedMember: boolean;
}

function formatDateTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const datePart = start.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const startTime = start.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${startTime} – ${endTime}`;
}

export function EventsClient({
  initialEvents,
  dict,
  canCreatePlatformWide,
  manageableCommunities,
  isVerifiedMember,
}: EventsClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canCreate = canCreatePlatformWide || manageableCommunities.length > 0;
  const defaultCommunityId = canCreatePlatformWide
    ? ""
    : (manageableCommunities[0]?.communityId ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState(defaultCommunityId);
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [creating, setCreating] = useState(false);

  async function handleRegister(eventId: string) {
    setBusyEventId(eventId);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/portal/events/${eventId}/register`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setActionError(payload.error?.message ?? "Kayıt işlemi başarısız oldu.");
        return;
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId
            ? {
                ...item,
                registeredCount: item.registeredCount + 1,
                myRegistrationStatus: "confirmed",
                myTicketStatus: "active",
              }
            : item,
        ),
      );
      setActionMessage(dict.registerSuccess);
      router.refresh();
    } catch {
      setActionError("Bağlantı hatası oluştu.");
    } finally {
      setBusyEventId(null);
    }
  }

  async function handleCancel(eventId: string) {
    setBusyEventId(eventId);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/portal/events/${eventId}/cancel`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setActionError(payload.error?.message ?? "İptal işlemi başarısız oldu.");
        return;
      }

      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId
            ? {
                ...item,
                registeredCount: Math.max(0, item.registeredCount - 1),
                myRegistrationStatus: "cancelled",
                myTicketStatus: "cancelled",
              }
            : item,
        ),
      );
      setActionMessage(dict.cancelSuccess);
      router.refresh();
    } catch {
      setActionError("Bağlantı hatası oluştu.");
    } finally {
      setBusyEventId(null);
    }
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const startsAtIso = startsAt ? new Date(startsAt).toISOString() : "";
      const endsAtIso = endsAt ? new Date(endsAt).toISOString() : "";

      const response = await fetch("/api/portal/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          communityId: communityId.trim() === "" ? null : communityId,
          location,
          startsAt: startsAtIso,
          endsAt: endsAtIso,
          capacity: Number(capacity),
          status: "published",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        setActionError(payload.error?.message ?? "Etkinlik oluşturulamadı.");
        return;
      }

      setTitle("");
      setDescription("");
      setLocation("");
      setStartsAt("");
      setEndsAt("");
      setCapacity("60");
      setActionMessage(dict.createSuccess);
      router.refresh();
      window.location.reload();
    } catch {
      setActionError("Bağlantı hatası oluştu.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      {actionMessage && (
        <div className="border border-sage bg-surface px-4 py-3 text-sm text-navy">
          {actionMessage}
        </div>
      )}
      {actionError && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {actionError}
        </div>
      )}

      {events.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
          {dict.emptyState}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {events.map((item) => {
            const isConfirmed = item.myRegistrationStatus === "confirmed";
            const isCheckedIn = item.myTicketStatus === "checked_in";
            const isFull = item.registeredCount >= item.capacity;
            const isBusy = busyEventId === item.id;

            return (
              <article
                key={item.id}
                className="flex flex-col justify-between border border-border bg-surface p-6"
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="border border-border bg-paper px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-navy">
                      {item.communityName ?? dict.platformWideLabel}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {isCheckedIn && (
                        <span className="border border-sage bg-paper px-2.5 py-0.5 text-xs font-medium text-navy">
                          {dict.checkedInBadge}
                        </span>
                      )}
                      {isConfirmed && !isCheckedIn && (
                        <span className="border border-brass bg-paper px-2.5 py-0.5 text-xs font-medium text-navy">
                          {dict.registeredBadge}
                        </span>
                      )}
                      {!isConfirmed && isFull && (
                        <span className="border border-border bg-paper px-2.5 py-0.5 text-xs font-medium text-muted">
                          {dict.fullBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="font-heading text-xl font-semibold text-navy">{item.title}</h2>
                  <p className="mt-1 text-xs font-medium text-brass">
                    {formatDateTimeRange(item.startsAt, item.endsAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{item.location}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink">{item.description}</p>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <div className="mb-4 flex items-center justify-between text-xs text-muted">
                    <span>{dict.capacityLabel}</span>
                    <span className="font-medium text-navy">
                      {item.registeredCount} / {item.capacity}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {isConfirmed ? (
                      <>
                        <Link
                          href="/tickets"
                          className="border border-navy bg-navy px-4 py-2 text-xs font-medium text-surface transition-colors hover:bg-navy/90"
                        >
                          {dict.viewTicketLink}
                        </Link>
                        {!isCheckedIn && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleCancel(item.id)}
                            className="border border-border bg-paper px-4 py-2 text-xs font-medium text-navy hover:border-navy disabled:opacity-60"
                          >
                            {isBusy ? dict.cancellingButton : dict.cancelButton}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={!isVerifiedMember || isFull || isBusy}
                        onClick={() => void handleRegister(item.id)}
                        className="border border-navy bg-navy px-4 py-2 text-xs font-medium text-surface transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? dict.registeringButton : dict.registerButton}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {canCreate && (
        <section className="border border-border bg-surface p-6">
          <h2 className="font-heading text-xl font-semibold text-navy">
            {dict.createSectionTitle}
          </h2>
          <form onSubmit={(e) => void handleCreateEvent(e)} className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.titleLabel}
              </label>
              <input
                type="text"
                required
                minLength={4}
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.descriptionLabel}
              </label>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.communityLabel}
              </label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              >
                {canCreatePlatformWide && (
                  <option value="">{dict.platformWideLabel}</option>
                )}
                {manageableCommunities.map((comm) => (
                  <option key={comm.communityId} value={comm.communityId}>
                    {comm.communityName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.locationLabel}
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.startsAtLabel}
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.endsAtLabel}
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {dict.capacityInputLabel}
              </label>
              <input
                type="number"
                required
                min={1}
                max={5000}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="border border-navy bg-navy px-5 py-2 text-sm font-medium text-surface transition-colors hover:bg-navy/90 disabled:opacity-60"
              >
                {creating ? dict.creatingButton : dict.createButton}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
