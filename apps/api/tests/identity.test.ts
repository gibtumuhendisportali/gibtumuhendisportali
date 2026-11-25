import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createApp } from "../src/index";
import type { Env } from "../src/env";

const TEST_ISSUER = "https://example-project.supabase.co/auth/v1";
const TEST_AUDIENCE = "authenticated";

interface StoredUser {
  id: string;
  supabase_user_id: string;
  email: string;
  role: "member" | "platform_admin";
  verification_status: "pending" | "verified" | "rejected" | "suspended";
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface StoredProfile {
  user_id: string;
  full_name: string;
  user_type: "student" | "alumni";
  department: string;
  entry_year: number;
  graduation_year: number | null;
  verification_note: string | null;
  directory_visible: number;
  show_contact_info: number;
  show_professional_links: number;
  updated_at: string;
}

class InMemoryD1 {
  public users = new Map<string, StoredUser>();
  public profiles = new Map<string, StoredProfile>();
  public consents: Array<{ id: string; user_id: string; consent_type: string; accepted: number }> = [];
  public auditLogs: Array<{ id: string; actor_user_id: string; action: string; target_id: string }> =
    [];

  prepare(sql: string) {
    const db = this;
    let params: unknown[] = [];

    const stmt = {
      bind(...args: unknown[]) {
        params = args;
        return stmt;
      },
      async first<T>() {
        if (sql.includes("FROM users") && sql.includes("WHERE supabase_user_id = ?1")) {
          const sub = params[0] as string;
          const found = [...db.users.values()].find((u) => u.supabase_user_id === sub) ?? null;
          return found as T | null;
        }
        if (sql.includes("FROM users WHERE id = ?1")) {
          const id = params[0] as string;
          const found = db.users.get(id) ?? null;
          return found as T | null;
        }
        if (sql.includes("FROM profiles") && sql.includes("WHERE user_id = ?1")) {
          const userId = params[0] as string;
          const found = db.profiles.get(userId) ?? null;
          return found as T | null;
        }
        return null;
      },
      async all<T>() {
        if (sql.includes("FROM community_permissions")) {
          return { results: [] as T[], success: true, meta: {} };
        }
        if (sql.includes("FROM users u") && sql.includes("INNER JOIN profiles p")) {
          const status = params[0] as string;
          const rows = [...db.users.values()]
            .filter((u) => u.verification_status === status)
            .map((u) => {
              const p = db.profiles.get(u.id)!;
              return {
                user_id: u.id,
                email: u.email,
                role: u.role,
                verification_status: u.verification_status,
                created_at: u.created_at,
                verified_at: u.verified_at,
                rejection_reason: u.rejection_reason,
                full_name: p.full_name,
                user_type: p.user_type,
                department: p.department,
                entry_year: p.entry_year,
                graduation_year: p.graduation_year,
                verification_note: p.verification_note,
              };
            });
          return { results: rows as T[], success: true, meta: {} };
        }
        return { results: [] as T[], success: true, meta: {} };
      },
      async run() {
        if (sql.startsWith("INSERT INTO users")) {
          const [id, sub, email, now] = params as [string, string, string, string];
          db.users.set(id, {
            id,
            supabase_user_id: sub,
            email,
            role: "member",
            verification_status: "pending",
            verified_at: null,
            verified_by: null,
            rejection_reason: null,
            created_at: now,
            updated_at: now,
          });
        } else if (sql.startsWith("INSERT INTO profiles")) {
          const [userId, fullName, userType, dept, entryYear, gradYear, note, now] = params as [
            string,
            string,
            "student" | "alumni",
            string,
            number,
            number | null,
            string | null,
            string,
          ];
          db.profiles.set(userId, {
            user_id: userId,
            full_name: fullName,
            user_type: userType,
            department: dept,
            entry_year: entryYear,
            graduation_year: gradYear,
            verification_note: note,
            directory_visible: 0,
            show_contact_info: 0,
            show_professional_links: 0,
            updated_at: now,
          });
        } else if (sql.startsWith("INSERT INTO kvkk_consents")) {
          const isExplicit = sql.includes("'kvkk_explicit_consent'");
          db.consents.push({
            id: params[0] as string,
            user_id: params[1] as string,
            consent_type: isExplicit ? "kvkk_explicit_consent" : "kvkk_disclosure_ack",
            accepted: isExplicit ? (params[3] as number) : 1,
          });
        } else if (sql.startsWith("UPDATE users")) {
          const [status, verifiedAt, verifiedBy, reason, updatedAt, targetId] = params as [
            "verified" | "rejected",
            string | null,
            string,
            string | null,
            string,
            string,
          ];
          const existing = db.users.get(targetId);
          if (existing) {
            existing.verification_status = status;
            existing.verified_at = verifiedAt;
            existing.verified_by = verifiedBy;
            existing.rejection_reason = reason;
            existing.updated_at = updatedAt;
          }
        } else if (sql.startsWith("INSERT INTO audit_logs")) {
          db.auditLogs.push({
            id: params[0] as string,
            actor_user_id: params[1] as string,
            action: params[2] as string,
            target_id: params[3] as string,
          });
        }
        return { success: true, meta: {} };
      },
    };

    return stmt;
  }

  async batch(statements: Array<{ run: () => Promise<unknown> }>) {
    const results = [];
    for (const st of statements) {
      results.push(await st.run());
    }
    return results;
  }
}

describe("Phase 1B Identity, Onboarding, KVKK, and Admin Verification", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = "test-key-1";
  publicJwk.alg = "ES256";
  const jwks = createLocalJWKSet({ keys: [publicJwk] });

  const app = createApp({
    auth: {
      getKey: jwks,
      issuer: TEST_ISSUER,
      audience: TEST_AUDIENCE,
    },
  });

  async function issueToken(sub: string, email: string) {
    return new SignJWT({ email })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject(sub)
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  }

  it("returns onboarded=false on GET /v1/me before onboarding", async () => {
    const db = new InMemoryD1();
    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: {} as R2Bucket,
    };

    const token = await issueToken("sub-new-1", "yeni@gmail.com");
    const res = await app.request(
      "/v1/me",
      { headers: { Authorization: `Bearer ${token}` } },
      env,
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as { onboarded: boolean; user: unknown };
    assert.equal(body.onboarded, false);
    assert.equal(body.user, null);
  });

  it("enforces KVKK disclosure and alumni graduationYear on POST /v1/onboarding", async () => {
    const db = new InMemoryD1();
    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: {} as R2Bucket,
    };

    const token = await issueToken("sub-student-1", "ogrenci@gmail.com");

    const missingKvkk = await app.request(
      "/v1/onboarding",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Ayşe Yılmaz",
          userType: "student",
          department: "Bilgisayar Mühendisliği",
          entryYear: 2023,
          kvkkDisclosureAccepted: false,
          kvkkExplicitConsent: false,
        }),
      },
      env,
    );
    assert.equal(missingKvkk.status, 400);

    const validStudent = await app.request(
      "/v1/onboarding",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Ayşe Yılmaz",
          userType: "student",
          department: "Bilgisayar Mühendisliği",
          entryYear: 2023,
          role: "platform_admin", // must be ignored
          verificationStatus: "verified", // must be ignored
          kvkkDisclosureAccepted: true,
          kvkkExplicitConsent: false,
        }),
      },
      env,
    );
    assert.equal(validStudent.status, 201);
    const created = (await validStudent.json()) as {
      onboarded: boolean;
      user: { role: string; verificationStatus: string };
      profile: { directoryVisible: boolean; showContactInfo: boolean };
    };
    assert.equal(created.onboarded, true);
    assert.equal(created.user.role, "member");
    assert.equal(created.user.verificationStatus, "pending");
    assert.equal(created.profile.directoryVisible, false);
    assert.equal(created.profile.showContactInfo, false);
    assert.equal(db.consents.length, 2);

    const duplicate = await app.request(
      "/v1/onboarding",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Ayşe Yılmaz",
          userType: "student",
          department: "Bilgisayar Mühendisliği",
          entryYear: 2023,
          kvkkDisclosureAccepted: true,
          kvkkExplicitConsent: false,
        }),
      },
      env,
    );
    assert.equal(duplicate.status, 409);
  });

  it("blocks non-admins and lets verified platform_admin approve/reject with audit logs", async () => {
    const db = new InMemoryD1();
    db.users.set("admin-1", {
      id: "admin-1",
      supabase_user_id: "sub-admin",
      email: "admin@gmail.com",
      role: "platform_admin",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00.000Z",
      verified_by: null,
      rejection_reason: null,
      created_at: "2026-11-23T00:00:00.000Z",
      updated_at: "2026-11-23T00:00:00.000Z",
    });
    db.profiles.set("admin-1", {
      user_id: "admin-1",
      full_name: "Portal Yöneticisi",
      user_type: "alumni",
      department: "Bilgisayar Mühendisliği",
      entry_year: 2019,
      graduation_year: 2023,
      verification_note: null,
      directory_visible: 0,
      show_contact_info: 0,
      show_professional_links: 0,
      updated_at: "2026-11-23T00:00:00.000Z",
    });

    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: {} as R2Bucket,
    };

    const memberToken = await issueToken("sub-member", "mezun@gmail.com");
    await app.request(
      "/v1/onboarding",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${memberToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Mehmet Kaya",
          userType: "alumni",
          department: "Elektrik-Elektronik Mühendisliği",
          entryYear: 2020,
          graduationYear: 2024,
          kvkkDisclosureAccepted: true,
          kvkkExplicitConsent: true,
        }),
      },
      env,
    );

    const memberAdminAttempt = await app.request(
      "/v1/admin/verifications",
      { headers: { Authorization: `Bearer ${memberToken}` } },
      env,
    );
    assert.equal(memberAdminAttempt.status, 403);

    const adminToken = await issueToken("sub-admin", "admin@gmail.com");
    const listRes = await app.request(
      "/v1/admin/verifications?status=pending",
      { headers: { Authorization: `Bearer ${adminToken}` } },
      env,
    );
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { items: Array<{ userId: string }> };
    assert.equal(listBody.items.length, 1);

    const targetId = listBody.items[0]!.userId;
    const approveRes = await app.request(
      `/v1/admin/verifications/${targetId}/decision`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ decision: "verified" }),
      },
      env,
    );
    assert.equal(approveRes.status, 200);
    assert.equal(db.users.get(targetId)?.verification_status, "verified");
    assert.equal(db.auditLogs.length, 1);
    assert.equal(db.auditLogs[0]?.action, "user.verify.approve");
  });
});
