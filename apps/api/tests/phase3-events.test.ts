import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createApp } from "../src/index";
import type { Env } from "../src/env";

const TEST_ISSUER = "https://example-project.supabase.co/auth/v1";
const TEST_AUDIENCE = "authenticated";
const TEST_PEPPER = "test-qr-pepper-secret";

interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  community_id: string | null;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  registered_count: number;
  status: "draft" | "published" | "cancelled";
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface RegistrationRecord {
  id: string;
  event_id: string;
  user_id: string;
  status: "confirmed" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface TicketRecord {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  qr_token_hash: string;
  qr_salt: string;
  status: "active" | "checked_in" | "cancelled";
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

class Phase3MockD1 {
  public users = [
    {
      id: "u-admin",
      supabase_user_id: "sub-admin",
      email: "admin@example.com",
      role: "platform_admin",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-yazek",
      supabase_user_id: "sub-yazek",
      email: "yazek@example.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-rep",
      supabase_user_id: "sub-rep",
      email: "rep@example.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-member1",
      supabase_user_id: "sub-m1",
      email: "m1@example.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-member2",
      supabase_user_id: "sub-m2",
      email: "m2@example.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
  ];

  public profiles = new Map<string, { full_name: string; department: string }>([
    ["u-admin", { full_name: "Portal Admin", department: "Bilgisayar Mühendisliği" }],
    ["u-yazek", { full_name: "YAZEK Yetkili", department: "Yapay Zeka ve Veri Mühendisliği" }],
    ["u-rep", { full_name: "REP Yetkili", department: "Elektrik-Elektronik Mühendisliği" }],
    ["u-member1", { full_name: "Mehmet Demir", department: "Bilgisayar Mühendisliği" }],
    ["u-member2", { full_name: "Zeynep Kaya", department: "Endüstri Mühendisliği" }],
  ]);

  public communities = [
    { id: "comm-yazek", slug: "yazek", name: "YAZEK" },
    { id: "comm-rep", slug: "rep", name: "REP" },
  ];

  public communityPermissions = [
    { user_id: "u-yazek", community_id: "comm-yazek", role: "organizer" },
    { user_id: "u-rep", community_id: "comm-rep", role: "organizer" },
  ];

  public events: EventRecord[] = [];
  public registrations: RegistrationRecord[] = [];
  public tickets: TicketRecord[] = [];

  private execStatement(rawSql: string, bindings: unknown[]) {
    const sql = rawSql.replace(/\s+/g, " ").trim();
    // Identity lookup
    if (sql.includes("FROM users WHERE supabase_user_id = ?1")) {
      const sub = bindings[0] as string;
      const user = this.users.find((u) => u.supabase_user_id === sub) ?? null;
      return { firstResult: user, allResults: user ? [user] : [], changes: 0 };
    }

    if (sql.includes("FROM profiles WHERE user_id = ?1")) {
      const userId = bindings[0] as string;
      const profile = this.profiles.get(userId);
      const row = profile
        ? {
            user_id: userId,
            full_name: profile.full_name,
            user_type: "student",
            department: profile.department,
            entry_year: 2022,
            graduation_year: null,
            headline: null,
            company: null,
            city: null,
            bio: null,
            skills_json: "[]",
            contact_email: null,
            linkedin_url: null,
            github_url: null,
            website_url: null,
            avatar_url: null,
            directory_visible: 1,
            show_contact_info: 0,
            show_professional_links: 1,
          }
        : null;
      return { firstResult: row, allResults: row ? [row] : [], changes: 0 };
    }

    if (sql.includes("FROM community_permissions cp")) {
      const userId = bindings[0] as string;
      const rows = this.communityPermissions
        .filter((p) => p.user_id === userId)
        .map((p) => {
          const comm = this.communities.find((c) => c.id === p.community_id)!;
          return {
            community_id: comm.id,
            community_slug: comm.slug,
            community_name: comm.name,
            role: p.role,
          };
        });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    // Events listing
    if (sql.includes("FROM events e") && sql.includes("WHERE e.status = 'published'")) {
      const userId = bindings[0] as string;
      const rows = this.events
        .filter((e) => e.status === "published")
        .map((e) => {
          const comm = this.communities.find((c) => c.id === e.community_id) ?? null;
          const reg =
            this.registrations.find((r) => r.event_id === e.id && r.user_id === userId) ?? null;
          const ticket = reg
            ? (this.tickets.find((t) => t.registration_id === reg.id) ?? null)
            : null;
          return {
            ...e,
            community_name: comm?.name ?? null,
            my_reg_status: reg?.status ?? null,
            my_ticket_status: ticket?.status ?? null,
          };
        });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    // Find event by id
    if (sql.includes("FROM events WHERE id = ?1")) {
      const eventId = bindings[0] as string;
      const event = this.events.find((e) => e.id === eventId) ?? null;
      return { firstResult: event, allResults: event ? [event] : [], changes: 0 };
    }

    // Create event
    if (sql.includes("INSERT INTO events")) {
      const [
        id,
        slug,
        title,
        description,
        communityId,
        location,
        startsAt,
        endsAt,
        capacity,
        status,
        createdBy,
        now,
      ] = bindings as [
        string,
        string,
        string,
        string,
        string | null,
        string,
        string,
        string,
        number,
        "draft" | "published",
        string,
        string,
      ];
      this.events.push({
        id,
        slug,
        title,
        description,
        community_id: communityId,
        location,
        starts_at: startsAt,
        ends_at: endsAt,
        capacity,
        registered_count: 0,
        status,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      });
      return { firstResult: null, allResults: [], changes: 1 };
    }

    // Registration lookup
    if (sql.includes("FROM registrations WHERE event_id = ?1 AND user_id = ?2")) {
      const [eventId, userId] = bindings as [string, string];
      const reg =
        this.registrations.find((r) => r.event_id === eventId && r.user_id === userId) ?? null;
      return { firstResult: reg, allResults: reg ? [reg] : [], changes: 0 };
    }

    // Atomic capacity increment
    if (sql.includes("SET registered_count = registered_count + 1")) {
      const [now, eventId] = bindings as [string, string];
      const event = this.events.find(
        (e) =>
          e.id === eventId &&
          e.status === "published" &&
          e.registered_count < e.capacity,
      );
      if (!event) {
        return { firstResult: null, allResults: [], changes: 0 };
      }
      event.registered_count += 1;
      event.updated_at = now;
      return { firstResult: null, allResults: [], changes: 1 };
    }

    // Insert registration
    if (sql.includes("INSERT INTO registrations")) {
      const [id, eventId, userId, now] = bindings as [string, string, string, string];
      this.registrations.push({
        id,
        event_id: eventId,
        user_id: userId,
        status: "confirmed",
        created_at: now,
        updated_at: now,
      });
      return { firstResult: null, allResults: [], changes: 1 };
    }

    // Insert ticket
    if (sql.includes("INSERT INTO tickets")) {
      const [id, registrationId, eventId, userId, qrSalt, qrTokenHash, now] = bindings as [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
      ];
      this.tickets.push({
        id,
        registration_id: registrationId,
        event_id: eventId,
        user_id: userId,
        qr_token_hash: qrTokenHash,
        qr_salt: qrSalt,
        status: "active",
        checked_in_at: null,
        checked_in_by: null,
        created_at: now,
      });
      return { firstResult: null, allResults: [], changes: 1 };
    }

    // List tickets for member
    if (sql.includes("FROM tickets t") && sql.includes("WHERE t.user_id = ?1")) {
      const userId = bindings[0] as string;
      const rows = this.tickets
        .filter((t) => t.user_id === userId)
        .map((t) => {
          const ev = this.events.find((e) => e.id === t.event_id)!;
          const comm = this.communities.find((c) => c.id === ev.community_id) ?? null;
          return {
            ticket_id: t.id,
            event_id: t.event_id,
            user_id: t.user_id,
            event_title: ev.title,
            event_location: ev.location,
            event_starts_at: ev.starts_at,
            event_ends_at: ev.ends_at,
            community_name: comm?.name ?? null,
            status: t.status,
            qr_salt: t.qr_salt,
            checked_in_at: t.checked_in_at,
            created_at: t.created_at,
          };
        });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    // Check-in lookup by hash
    if (sql.includes("WHERE t.qr_token_hash = ?1")) {
      const hash = bindings[0] as string;
      const ticket =
        this.tickets.find((t) => t.qr_token_hash === hash) ?? null;
      if (!ticket) {
        return { firstResult: null, allResults: [], changes: 0 };
      }
      const profile = this.profiles.get(ticket.user_id)!;
      const row = {
        id: ticket.id,
        event_id: ticket.event_id,
        status: ticket.status,
        checked_in_at: ticket.checked_in_at,
        full_name: profile.full_name,
        department: profile.department,
      };
      return { firstResult: row, allResults: [row], changes: 0 };
    }

    // Atomic check-in update
    if (sql.includes("SET status = 'checked_in'")) {
      const [now, actorUserId, ticketId] = bindings as [string, string, string];
      const ticket = this.tickets.find(
        (t) => t.id === ticketId && t.status === "active",
      );
      if (!ticket) {
        return { firstResult: null, allResults: [], changes: 0 };
      }
      ticket.status = "checked_in";
      ticket.checked_in_at = now;
      ticket.checked_in_by = actorUserId;
      return { firstResult: null, allResults: [], changes: 1 };
    }

    return { firstResult: null, allResults: [], changes: 0 };
  }

  prepare(sql: string) {
    const self = this;
    const makeHandle = (bindings: unknown[]) => ({
      bind(...nextBindings: unknown[]) {
        return makeHandle(nextBindings);
      },
      async first<T>() {
        return self.execStatement(sql, bindings).firstResult as T | null;
      },
      async all<T>() {
        return { results: self.execStatement(sql, bindings).allResults as T[] };
      },
      async run() {
        const res = self.execStatement(sql, bindings);
        return { success: true, meta: { changes: res.changes } };
      },
      _exec() {
        const res = self.execStatement(sql, bindings);
        return { success: true, meta: { changes: res.changes } };
      },
    });
    return makeHandle([]);
  }

  async batch(statements: Array<{ _exec: () => { success: boolean; meta: { changes: number } } }>) {
    return statements.map((stmt) => stmt._exec());
  }
}

async function makeSignedToken(
  privateKey: CryptoKey,
  sub: string,
  email: string,
): Promise<string> {
  return new SignJWT({ email, email_verified: true })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setIssuer(TEST_ISSUER)
    .setAudience(TEST_AUDIENCE)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(privateKey);
}

describe("Phase 3 Events, Capacity-Safe Registration, QR Tickets, and Scoped Check-In", () => {
  it("enforces community scopes, capacity limits, hash-only ticket storage, and idempotent check-in", async () => {
    const { publicKey, privateKey } = await generateKeyPair("ES256");
    const jwk = await exportJWK(publicKey);
    const jwks = createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "ES256" }] });

    const db = new Phase3MockD1();
    const app = createApp({
      auth: {
        getKey: jwks,
        issuer: TEST_ISSUER,
        audience: TEST_AUDIENCE,
      },
    });

    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      QR_TOKEN_PEPPER: TEST_PEPPER,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: {} as R2Bucket,
    };

    const adminToken = await makeSignedToken(privateKey, "sub-admin", "admin@example.com");
    const yazekToken = await makeSignedToken(privateKey, "sub-yazek", "yazek@example.com");
    const repToken = await makeSignedToken(privateKey, "sub-rep", "rep@example.com");
    const m1Token = await makeSignedToken(privateKey, "sub-m1", "m1@example.com");
    const m2Token = await makeSignedToken(privateKey, "sub-m2", "m2@example.com");

    const baseEventPayload = {
      title: "YAZEK Yapay Zeka Atölyesi",
      description: "Uygulamalı mühendislik atölye çalışması.",
      location: "GİBTÜ Lab 1",
      startsAt: "2026-12-15T10:00:00.000Z",
      endsAt: "2026-12-15T12:00:00.000Z",
      capacity: 1,
      status: "published",
    };

    // 1. Regular member cannot create events
    const memberCreateRes = await app.request(
      "/v1/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${m1Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...baseEventPayload, communityId: "comm-yazek" }),
      },
      env,
    );
    assert.equal(memberCreateRes.status, 403);

    // 2. YAZEK organizer cannot create REP event or platform-wide event
    const crossScopeRes = await app.request(
      "/v1/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...baseEventPayload, communityId: "comm-rep" }),
      },
      env,
    );
    assert.equal(crossScopeRes.status, 403);

    const platformWideByYazek = await app.request(
      "/v1/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...baseEventPayload, communityId: null }),
      },
      env,
    );
    assert.equal(platformWideByYazek.status, 403);

    // 3. YAZEK organizer creates YAZEK event (capacity 1)
    const yazekCreateRes = await app.request(
      "/v1/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...baseEventPayload, communityId: "comm-yazek" }),
      },
      env,
    );
    assert.equal(yazekCreateRes.status, 201);
    const created = (await yazekCreateRes.json()) as { id: string };

    // 4. Platform admin can create platform-wide event
    const adminCreateRes = await app.request(
      "/v1/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...baseEventPayload,
          title: "GİBTÜ Mühendislik Kariyer Günü",
          communityId: null,
          capacity: 100,
        }),
      },
      env,
    );
    assert.equal(adminCreateRes.status, 201);

    // 5. Member 1 registers -> 201, Member 2 registers -> 409 EVENT_FULL
    const reg1Res = await app.request(
      `/v1/events/${created.id}/register`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${m1Token}` },
      },
      env,
    );
    assert.equal(reg1Res.status, 201);

    const reg2Res = await app.request(
      `/v1/events/${created.id}/register`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${m2Token}` },
      },
      env,
    );
    assert.equal(reg2Res.status, 409);

    // 6. Member 1 fetches digital ticket; D1 only holds hash, not raw token
    const ticketsRes = await app.request(
      "/v1/tickets",
      {
        headers: { Authorization: `Bearer ${m1Token}` },
      },
      env,
    );
    assert.equal(ticketsRes.status, 200);
    const ticketsBody = (await ticketsRes.json()) as {
      items: Array<{ ticketId: string; qrToken: string | null; status: string }>;
    };
    assert.equal(ticketsBody.items.length, 1);
    const qrToken = ticketsBody.items[0]!.qrToken!;
    assert.ok(qrToken.length >= 16);
    assert.notEqual(db.tickets[0]!.qr_token_hash, qrToken);

    // 7. REP organizer cannot check in YAZEK event -> 403
    const repCheckInRes = await app.request(
      "/v1/tickets/check-in",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${repToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: created.id, qrToken }),
      },
      env,
    );
    assert.equal(repCheckInRes.status, 403);

    // 8. YAZEK organizer checks in Member 1 -> checked_in, second scan -> already_checked_in
    const firstScanRes = await app.request(
      "/v1/tickets/check-in",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: created.id, qrToken }),
      },
      env,
    );
    assert.equal(firstScanRes.status, 200);
    const firstScanBody = (await firstScanRes.json()) as {
      result: string;
      attendeeName: string;
    };
    assert.equal(firstScanBody.result, "checked_in");
    assert.equal(firstScanBody.attendeeName, "Mehmet Demir");

    const secondScanRes = await app.request(
      "/v1/tickets/check-in",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId: created.id, qrToken }),
      },
      env,
    );
    assert.equal(secondScanRes.status, 200);
    const secondScanBody = (await secondScanRes.json()) as { result: string };
    assert.equal(secondScanBody.result, "already_checked_in");

    // 9. Invalid QR token -> 400
    const invalidScanRes = await app.request(
      "/v1/tickets/check-in",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: created.id,
          qrToken: "invalid-forged-token-000000000000",
        }),
      },
      env,
    );
    assert.equal(invalidScanRes.status, 400);
  });
});
