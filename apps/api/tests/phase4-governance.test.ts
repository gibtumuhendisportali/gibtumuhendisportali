import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createApp } from "../src/index";
import type { Env } from "../src/env";

const TEST_ISSUER = "https://example-project.supabase.co/auth/v1";
const TEST_AUDIENCE = "authenticated";

class Phase4MockD1 {
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
      id: "u-member",
      supabase_user_id: "sub-member",
      email: "member@example.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-pending",
      supabase_user_id: "sub-pending",
      email: "pending@example.com",
      role: "member",
      verification_status: "pending",
      verified_at: null,
      rejection_reason: null,
    },
  ];

  public profiles = new Map<
    string,
    { full_name: string; department: string; user_type: "student" | "alumni" }
  >([
    ["u-admin", { full_name: "Admin User", department: "Bilgisayar Mühendisliği", user_type: "alumni" }],
    ["u-yazek", { full_name: "YAZEK Yetkili", department: "Yapay Zeka ve Veri Mühendisliği", user_type: "student" }],
    ["u-rep", { full_name: "REP Yetkili", department: "Elektrik-Elektronik Mühendisliği", user_type: "student" }],
    ["u-member", { full_name: "Normal Üye", department: "Endüstri Mühendisliği", user_type: "student" }],
    ["u-pending", { full_name: "Bekleyen Üye", department: "Bilgisayar Mühendisliği", user_type: "student" }],
  ]);

  public communities = [
    { id: "comm-yazek", slug: "yazek", name: "YAZEK" },
    { id: "comm-rep", slug: "rep", name: "REP" },
  ];

  public communityPermissions: Array<{
    id: string;
    user_id: string;
    community_id: string;
    role: string;
  }> = [
    { id: "perm-1", user_id: "u-yazek", community_id: "comm-yazek", role: "organizer" },
    { id: "perm-2", user_id: "u-rep", community_id: "comm-rep", role: "organizer" },
  ];

  public events = [
    {
      id: "evt-yazek-1",
      title: "YAZEK Semineri",
      community_id: "comm-yazek",
      capacity: 50,
      registered_count: 1,
      status: "published",
      updated_at: "2026-11-25T00:00:00Z",
    },
  ];

  public registrations = [
    {
      id: "reg-1",
      event_id: "evt-yazek-1",
      user_id: "u-member",
      status: "confirmed" as const,
      created_at: "2026-11-25T01:00:00Z",
    },
  ];

  public tickets = [
    {
      id: "tkt-1",
      registration_id: "reg-1",
      status: "checked_in" as const,
      checked_in_at: "2026-11-25T02:00:00Z",
    },
  ];

  public auditLogs: Array<{ action: string; target_id: string }> = [];

  private execStatement(rawSql: string, bindings: unknown[]) {
    const sql = rawSql.replace(/\s+/g, " ").trim();

    if (sql.includes("FROM users WHERE supabase_user_id = ?1")) {
      const sub = bindings[0] as string;
      const user = this.users.find((u) => u.supabase_user_id === sub) ?? null;
      return { firstResult: user, allResults: user ? [user] : [], changes: 0 };
    }

    if (sql.includes("SELECT id, verification_status FROM users WHERE id = ?1")) {
      const id = bindings[0] as string;
      const user = this.users.find((u) => u.id === id) ?? null;
      return { firstResult: user, allResults: user ? [user] : [], changes: 0 };
    }

    if (sql.includes("FROM profiles WHERE user_id = ?1")) {
      const userId = bindings[0] as string;
      const profile = this.profiles.get(userId);
      const row = profile
        ? {
            user_id: userId,
            full_name: profile.full_name,
            user_type: profile.user_type,
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

    if (sql.includes("FROM community_permissions cp") && sql.includes("WHERE cp.user_id = ?1")) {
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

    if (sql.includes("SELECT id, slug, name FROM communities")) {
      return { firstResult: this.communities[0] ?? null, allResults: this.communities, changes: 0 };
    }

    if (sql.includes("SELECT id FROM communities WHERE id = ?1")) {
      const id = bindings[0] as string;
      const found = this.communities.find((c) => c.id === id) ?? null;
      return { firstResult: found, allResults: found ? [found] : [], changes: 0 };
    }

    if (sql.includes("FROM users u INNER JOIN profiles p ON p.user_id = u.id WHERE u.verification_status = 'verified'")) {
      const rows = this.users
        .filter((u) => u.verification_status === "verified")
        .map((u) => {
          const profile = this.profiles.get(u.id)!;
          return {
            user_id: u.id,
            email: u.email,
            role: u.role,
            full_name: profile.full_name,
            department: profile.department,
          };
        });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    if (sql.includes("SELECT cp.user_id, cp.community_id, c.slug AS community_slug")) {
      const rows = this.communityPermissions.map((p) => {
        const comm = this.communities.find((c) => c.id === p.community_id)!;
        return {
          user_id: p.user_id,
          community_id: p.community_id,
          community_slug: comm.slug,
          community_name: comm.name,
          role: p.role,
        };
      });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    if (sql.includes("INSERT INTO community_permissions")) {
      const [id, userId, communityId, role] = bindings as [string, string, string, string];
      const existing = this.communityPermissions.find(
        (p) => p.user_id === userId && p.community_id === communityId,
      );
      if (existing) {
        existing.role = role;
      } else {
        this.communityPermissions.push({ id, user_id: userId, community_id: communityId, role });
      }
      return { firstResult: null, allResults: [], changes: 1 };
    }

    if (sql.includes("DELETE FROM community_permissions")) {
      const [userId, communityId] = bindings as [string, string];
      const before = this.communityPermissions.length;
      this.communityPermissions = this.communityPermissions.filter(
        (p) => !(p.user_id === userId && p.community_id === communityId),
      );
      return { firstResult: null, allResults: [], changes: before - this.communityPermissions.length };
    }

    if (sql.includes("INSERT INTO audit_logs")) {
      const action = sql.includes("'community_permission.grant'")
        ? "community_permission.grant"
        : "community_permission.revoke";
      const targetId = bindings[2] as string;
      this.auditLogs.push({ action, target_id: targetId });
      return { firstResult: null, allResults: [], changes: 1 };
    }

    if (sql.includes("FROM events WHERE id = ?1")) {
      const eventId = bindings[0] as string;
      const ev = this.events.find((e) => e.id === eventId) ?? null;
      return { firstResult: ev, allResults: ev ? [ev] : [], changes: 0 };
    }

    if (sql.includes("FROM registrations r INNER JOIN profiles p")) {
      const eventId = bindings[0] as string;
      const rows = this.registrations
        .filter((r) => r.event_id === eventId)
        .map((r) => {
          const p = this.profiles.get(r.user_id)!;
          const t = this.tickets.find((tk) => tk.registration_id === r.id) ?? null;
          return {
            user_id: r.user_id,
            full_name: p.full_name,
            department: p.department,
            user_type: p.user_type,
            registration_status: r.status,
            ticket_status: t?.status ?? null,
            checked_in_at: t?.checked_in_at ?? null,
            registered_at: r.created_at,
          };
        });
      return { firstResult: rows[0] ?? null, allResults: rows, changes: 0 };
    }

    if (sql.includes("UPDATE events SET status = ?1")) {
      const [status, now, eventId] = bindings as [string, string, string];
      const ev = this.events.find((e) => e.id === eventId);
      if (!ev) {
        return { firstResult: null, allResults: [], changes: 0 };
      }
      ev.status = status;
      ev.updated_at = now;
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

describe("Phase 4 Community Permissions & Event Attendee Governance", () => {
  it("restricts community permission management to platform_admin and enforces scoped event attendee access", async () => {
    const { publicKey, privateKey } = await generateKeyPair("ES256");
    const jwk = await exportJWK(publicKey);
    const jwks = createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "ES256" }] });

    const db = new Phase4MockD1();
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
      QR_TOKEN_PEPPER: "test-pepper",
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: {} as R2Bucket,
    };

    const adminToken = await makeSignedToken(privateKey, "sub-admin", "admin@example.com");
    const yazekToken = await makeSignedToken(privateKey, "sub-yazek", "yazek@example.com");
    const repToken = await makeSignedToken(privateKey, "sub-rep", "rep@example.com");

    // 1. Non-admin cannot access /v1/admin/communities
    const nonAdminRes = await app.request(
      "/v1/admin/communities",
      { headers: { Authorization: `Bearer ${yazekToken}` } },
      env,
    );
    assert.equal(nonAdminRes.status, 403);

    // 2. Platform admin lists communities & verified members
    const listRes = await app.request(
      "/v1/admin/communities",
      { headers: { Authorization: `Bearer ${adminToken}` } },
      env,
    );
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as {
      communities: Array<{ id: string }>;
      members: Array<{ userId: string }>;
    };
    assert.equal(listBody.communities.length, 2);
    assert.equal(listBody.members.length, 4);

    // 3. Granting permission to pending user fails with 400
    const pendingGrantRes = await app.request(
      "/v1/admin/communities/permissions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "u-pending",
          communityId: "comm-yazek",
          role: "organizer",
        }),
      },
      env,
    );
    assert.equal(pendingGrantRes.status, 400);

    // 4. Platform admin grants & revokes YAZEK permission for verified member with audit logs
    const grantRes = await app.request(
      "/v1/admin/communities/permissions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "u-member",
          communityId: "comm-yazek",
          role: "organizer",
        }),
      },
      env,
    );
    assert.equal(grantRes.status, 200);
    assert.ok(
      db.communityPermissions.some(
        (p) => p.user_id === "u-member" && p.community_id === "comm-yazek",
      ),
    );

    const revokeRes = await app.request(
      "/v1/admin/communities/permissions",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "u-member",
          communityId: "comm-yazek",
        }),
      },
      env,
    );
    assert.equal(revokeRes.status, 200);
    assert.equal(db.auditLogs.length, 2);

    // 5. REP organizer cannot view YAZEK event attendees or cancel YAZEK event
    const repAttendeesRes = await app.request(
      "/v1/events/evt-yazek-1/attendees",
      { headers: { Authorization: `Bearer ${repToken}` } },
      env,
    );
    assert.equal(repAttendeesRes.status, 403);

    const repCancelRes = await app.request(
      "/v1/events/evt-yazek-1/status",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${repToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      },
      env,
    );
    assert.equal(repCancelRes.status, 403);

    // 6. YAZEK organizer views attendees & cancels YAZEK event
    const yazekAttendeesRes = await app.request(
      "/v1/events/evt-yazek-1/attendees",
      { headers: { Authorization: `Bearer ${yazekToken}` } },
      env,
    );
    assert.equal(yazekAttendeesRes.status, 200);
    const attendeesBody = (await yazekAttendeesRes.json()) as {
      registeredCount: number;
      checkedInCount: number;
      items: Array<{ fullName: string }>;
    };
    assert.equal(attendeesBody.registeredCount, 1);
    assert.equal(attendeesBody.checkedInCount, 1);
    assert.equal(attendeesBody.items[0]?.fullName, "Normal Üye");

    const yazekCancelRes = await app.request(
      "/v1/events/evt-yazek-1/status",
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${yazekToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      },
      env,
    );
    assert.equal(yazekCancelRes.status, 200);
    assert.equal(db.events[0]?.status, "cancelled");
  });
});
