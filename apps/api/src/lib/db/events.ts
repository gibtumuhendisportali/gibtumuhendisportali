import type {
  CheckInResponse,
  EventCreateInput,
  EventItem,
  EventStatus,
  MeResponse,
  TicketItem,
  TicketStatus,
} from "@gibtu/shared";
import { deriveQrToken, generateQrSalt, hashQrToken } from "../crypto/qr";

interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  community_id: string | null;
  community_name: string | null;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  registered_count: number;
  status: EventStatus;
  my_reg_status: "confirmed" | "cancelled" | null;
  my_ticket_status: TicketStatus | null;
}

interface TicketRow {
  ticket_id: string;
  event_id: string;
  user_id: string;
  event_title: string;
  event_location: string;
  event_starts_at: string;
  event_ends_at: string;
  community_name: string | null;
  status: TicketStatus;
  qr_salt: string;
  checked_in_at: string | null;
  created_at: string;
}

interface CheckInLookupRow {
  id: string;
  event_id: string;
  status: TicketStatus;
  checked_in_at: string | null;
  full_name: string;
  department: string;
}

export function canManageEventScope(
  member: NonNullable<MeResponse["user"]>,
  communityId: string | null,
): boolean {
  if (member.role === "platform_admin") {
    return true;
  }
  if (!communityId) {
    return false;
  }
  return member.communityPermissions.some((perm) => perm.communityId === communityId);
}

function buildEventSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = crypto.randomUUID().slice(0, 6);
  return `${base || "etkinlik"}-${suffix}`;
}

export async function listEventsForMember(
  db: D1Database,
  userId: string,
): Promise<EventItem[]> {
  const result = await db
    .prepare(
      `SELECT e.id, e.slug, e.title, e.description, e.community_id, c.name AS community_name,
              e.location, e.starts_at, e.ends_at, e.capacity, e.registered_count, e.status,
              r.status AS my_reg_status, t.status AS my_ticket_status
       FROM events e
       LEFT JOIN communities c ON c.id = e.community_id
       LEFT JOIN registrations r ON r.event_id = e.id AND r.user_id = ?1
       LEFT JOIN tickets t ON t.registration_id = r.id
       WHERE e.status = 'published'
       ORDER BY e.starts_at ASC
       LIMIT 50`,
    )
    .bind(userId)
    .all<EventRow>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    communityId: row.community_id,
    communityName: row.community_name,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    registeredCount: row.registered_count,
    status: row.status,
    myRegistrationStatus: row.my_reg_status,
    myTicketStatus: row.my_ticket_status,
  }));
}

export async function findEventById(
  db: D1Database,
  eventId: string,
): Promise<{
  id: string;
  community_id: string | null;
  status: EventStatus;
  capacity: number;
  registered_count: number;
} | null> {
  return db
    .prepare(
      `SELECT id, community_id, status, capacity, registered_count
       FROM events WHERE id = ?1 LIMIT 1`,
    )
    .bind(eventId)
    .first();
}

export async function createEventRecord(
  db: D1Database,
  actorUserId: string,
  input: EventCreateInput,
): Promise<string> {
  const eventId = crypto.randomUUID();
  const slug = buildEventSlug(input.title);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO events (
        id, slug, title, description, community_id, location,
        starts_at, ends_at, capacity, registered_count, status, created_by, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, ?11, ?12, ?12)`,
    )
    .bind(
      eventId,
      slug,
      input.title,
      input.description,
      input.communityId ?? null,
      input.location,
      input.startsAt,
      input.endsAt,
      input.capacity,
      input.status,
      actorUserId,
      now,
    )
    .run();

  return eventId;
}

export type RegisterEventResult =
  | { ok: true; ticketId: string }
  | { ok: false; code: "NOT_FOUND" | "EVENT_NOT_OPEN" | "EVENT_FULL" | "ALREADY_REGISTERED" };

export async function registerForEvent(
  db: D1Database,
  pepper: string,
  params: { eventId: string; userId: string },
): Promise<RegisterEventResult> {
  const existing = await db
    .prepare(
      `SELECT id, status FROM registrations WHERE event_id = ?1 AND user_id = ?2 LIMIT 1`,
    )
    .bind(params.eventId, params.userId)
    .first<{ id: string; status: "confirmed" | "cancelled" }>();

  if (existing?.status === "confirmed") {
    return { ok: false, code: "ALREADY_REGISTERED" };
  }

  const now = new Date().toISOString();
  // Atomic SQL-level capacity enforcement
  const capacityUpdate = await db
    .prepare(
      `UPDATE events
       SET registered_count = registered_count + 1, updated_at = ?1
       WHERE id = ?2 AND status = 'published' AND registered_count < capacity`,
    )
    .bind(now, params.eventId)
    .run();

  if ((capacityUpdate.meta?.changes ?? 0) === 0) {
    const event = await findEventById(db, params.eventId);
    if (!event) return { ok: false, code: "NOT_FOUND" };
    if (event.status !== "published") return { ok: false, code: "EVENT_NOT_OPEN" };
    return { ok: false, code: "EVENT_FULL" };
  }

  const registrationId = existing?.id ?? crypto.randomUUID();
  const ticketId = crypto.randomUUID();
  const qrSalt = generateQrSalt();
  const qrToken = await deriveQrToken(pepper, {
    ticketId,
    eventId: params.eventId,
    userId: params.userId,
    qrSalt,
  });
  const qrTokenHash = await hashQrToken(qrToken);

  try {
    if (existing) {
      // Re-activating a previously cancelled registration with a brand-new ticket
      await db.batch([
        db
          .prepare(
            `UPDATE registrations SET status = 'confirmed', cancelled_at = NULL WHERE id = ?1`,
          )
          .bind(registrationId),
        db.prepare(`DELETE FROM tickets WHERE registration_id = ?1`).bind(registrationId),
        db
          .prepare(
            `INSERT INTO tickets (
              id, registration_id, event_id, user_id, qr_salt, qr_token_hash, status, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7)`,
          )
          .bind(ticketId, registrationId, params.eventId, params.userId, qrSalt, qrTokenHash, now),
      ]);
    } else {
      await db.batch([
        db
          .prepare(
            `INSERT INTO registrations (id, event_id, user_id, status, created_at)
             VALUES (?1, ?2, ?3, 'confirmed', ?4)`,
          )
          .bind(registrationId, params.eventId, params.userId, now),
        db
          .prepare(
            `INSERT INTO tickets (
              id, registration_id, event_id, user_id, qr_salt, qr_token_hash, status, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7)`,
          )
          .bind(ticketId, registrationId, params.eventId, params.userId, qrSalt, qrTokenHash, now),
      ]);
    }
  } catch (err) {
    // Compensate capacity increment on unexpected batch error
    await db
      .prepare(
        `UPDATE events SET registered_count = registered_count - 1 WHERE id = ?1 AND registered_count > 0`,
      )
      .bind(params.eventId)
      .run();
    throw err;
  }

  return { ok: true, ticketId };
}

export type CancelRegistrationResult =
  | { ok: true }
  | { ok: false; code: "NOT_REGISTERED" | "ALREADY_CHECKED_IN" };

export async function cancelEventRegistration(
  db: D1Database,
  params: { eventId: string; userId: string },
): Promise<CancelRegistrationResult> {
  const row = await db
    .prepare(
      `SELECT r.id AS reg_id, r.status AS reg_status, t.id AS ticket_id, t.status AS ticket_status
       FROM registrations r
       INNER JOIN tickets t ON t.registration_id = r.id
       WHERE r.event_id = ?1 AND r.user_id = ?2
       LIMIT 1`,
    )
    .bind(params.eventId, params.userId)
    .first<{
      reg_id: string;
      reg_status: "confirmed" | "cancelled";
      ticket_id: string;
      ticket_status: TicketStatus;
    }>();

  if (!row || row.reg_status !== "confirmed") {
    return { ok: false, code: "NOT_REGISTERED" };
  }

  if (row.ticket_status === "checked_in") {
    return { ok: false, code: "ALREADY_CHECKED_IN" };
  }

  const now = new Date().toISOString();
  await db.batch([
    db
      .prepare(
        `UPDATE registrations SET status = 'cancelled', cancelled_at = ?1 WHERE id = ?2 AND status = 'confirmed'`,
      )
      .bind(now, row.reg_id),
    db
      .prepare(`UPDATE tickets SET status = 'cancelled' WHERE id = ?1 AND status = 'active'`)
      .bind(row.ticket_id),
    db
      .prepare(
        `UPDATE events SET registered_count = registered_count - 1, updated_at = ?1
         WHERE id = ?2 AND registered_count > 0`,
      )
      .bind(now, params.eventId),
  ]);

  return { ok: true };
}

export async function listTicketsForMember(
  db: D1Database,
  pepper: string,
  userId: string,
): Promise<TicketItem[]> {
  const result = await db
    .prepare(
      `SELECT t.id AS ticket_id, t.event_id, t.user_id, e.title AS event_title,
              e.location AS event_location, e.starts_at AS event_starts_at, e.ends_at AS event_ends_at,
              c.name AS community_name, t.status, t.qr_salt, t.checked_in_at, t.created_at
       FROM tickets t
       INNER JOIN events e ON e.id = t.event_id
       LEFT JOIN communities c ON c.id = e.community_id
       WHERE t.user_id = ?1
       ORDER BY e.starts_at DESC
       LIMIT 50`,
    )
    .bind(userId)
    .all<TicketRow>();

  const rows = result.results ?? [];
  const items: TicketItem[] = [];

  for (const row of rows) {
    const qrToken =
      row.status === "cancelled"
        ? null
        : await deriveQrToken(pepper, {
            ticketId: row.ticket_id,
            eventId: row.event_id,
            userId: row.user_id,
            qrSalt: row.qr_salt,
          });

    items.push({
      ticketId: row.ticket_id,
      eventId: row.event_id,
      eventTitle: row.event_title,
      eventLocation: row.event_location,
      eventStartsAt: row.event_starts_at,
      eventEndsAt: row.event_ends_at,
      communityName: row.community_name,
      status: row.status,
      qrToken,
      checkedInAt: row.checked_in_at,
      createdAt: row.created_at,
    });
  }

  return items;
}

export type CheckInAttemptResult =
  | { ok: true; data: CheckInResponse }
  | { ok: false; code: "INVALID_TICKET" | "WRONG_EVENT" | "TICKET_CANCELLED" };

export async function checkInTicketByQrToken(
  db: D1Database,
  params: { eventId: string; qrToken: string; actorUserId: string },
): Promise<CheckInAttemptResult> {
  const qrTokenHash = await hashQrToken(params.qrToken);

  const ticket = await db
    .prepare(
      `SELECT t.id, t.event_id, t.status, t.checked_in_at, p.full_name, p.department
       FROM tickets t
       INNER JOIN profiles p ON p.user_id = t.user_id
       WHERE t.qr_token_hash = ?1
       LIMIT 1`,
    )
    .bind(qrTokenHash)
    .first<CheckInLookupRow>();

  if (!ticket) {
    return { ok: false, code: "INVALID_TICKET" };
  }

  if (ticket.event_id !== params.eventId) {
    return { ok: false, code: "WRONG_EVENT" };
  }

  if (ticket.status === "cancelled") {
    return { ok: false, code: "TICKET_CANCELLED" };
  }

  if (ticket.status === "checked_in") {
    return {
      ok: true,
      data: {
        result: "already_checked_in",
        ticketId: ticket.id,
        attendeeName: ticket.full_name,
        attendeeDepartment: ticket.department,
        checkedInAt: ticket.checked_in_at ?? new Date().toISOString(),
      },
    };
  }

  const now = new Date().toISOString();
  const update = await db
    .prepare(
      `UPDATE tickets
       SET status = 'checked_in', checked_in_at = ?1, checked_in_by = ?2
       WHERE id = ?3 AND status = 'active'`,
    )
    .bind(now, params.actorUserId, ticket.id)
    .run();

  if ((update.meta?.changes ?? 0) === 0) {
    // Concurrent check-in won the race: return idempotent already_checked_in
    const refreshed = await db
      .prepare(`SELECT checked_in_at FROM tickets WHERE id = ?1 LIMIT 1`)
      .bind(ticket.id)
      .first<{ checked_in_at: string | null }>();

    return {
      ok: true,
      data: {
        result: "already_checked_in",
        ticketId: ticket.id,
        attendeeName: ticket.full_name,
        attendeeDepartment: ticket.department,
        checkedInAt: refreshed?.checked_in_at ?? now,
      },
    };
  }

  return {
    ok: true,
    data: {
      result: "checked_in",
      ticketId: ticket.id,
      attendeeName: ticket.full_name,
      attendeeDepartment: ticket.department,
      checkedInAt: now,
    },
  };
}
