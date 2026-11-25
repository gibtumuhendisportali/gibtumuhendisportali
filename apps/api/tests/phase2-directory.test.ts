import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createApp } from "../src/index";
import type { Env } from "../src/env";
import { isSafeAvatarKey } from "../src/lib/storage/avatar";

const TEST_ISSUER = "https://example-project.supabase.co/auth/v1";
const TEST_AUDIENCE = "authenticated";

class MockR2Bucket {
  public objects = new Map<string, { body: Uint8Array; contentType: string }>();

  async put(key: string, value: ArrayBuffer | ArrayBufferView, opts?: { httpMetadata?: { contentType?: string } }) {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer);
    this.objects.set(key, {
      body: bytes,
      contentType: opts?.httpMetadata?.contentType ?? "application/octet-stream",
    });
  }

  async get(key: string) {
    const found = this.objects.get(key);
    if (!found) return null;
    return {
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(found.body);
          controller.close();
        },
      }),
      httpMetadata: { contentType: found.contentType },
    };
  }

  async delete(key: string) {
    this.objects.delete(key);
  }
}

class Phase2MockD1 {
  public users = [
    {
      id: "u-verified-visible",
      supabase_user_id: "sub-1",
      email: "ayse@gmail.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-verified-hidden",
      supabase_user_id: "sub-2",
      email: "ali@gmail.com",
      role: "member",
      verification_status: "verified",
      verified_at: "2026-11-23T00:00:00Z",
      rejection_reason: null,
    },
    {
      id: "u-pending",
      supabase_user_id: "sub-3",
      email: "bekleyen@gmail.com",
      role: "member",
      verification_status: "pending",
      verified_at: null,
      rejection_reason: null,
    },
  ];

  public profiles = new Map<string, Record<string, unknown>>([
    [
      "u-verified-visible",
      {
        user_id: "u-verified-visible",
        full_name: "Ayşe Yılmaz",
        user_type: "alumni",
        department: "Bilgisayar Mühendisliği",
        entry_year: 2020,
        graduation_year: 2024,
        headline: "Backend Engineer",
        company: "Tech Co",
        city: "Gaziantep",
        bio: "D1 & Workers",
        skills_json: JSON.stringify(["TypeScript", "Cloudflare"]),
        contact_email: "ayse.public@example.com",
        linkedin_url: "https://linkedin.com/in/ayse",
        github_url: "https://github.com/ayse",
        website_url: null,
        avatar_key: null,
        directory_visible: 1,
        show_contact_info: 0,
        show_professional_links: 1,
        updated_at: "2026-11-23T00:00:00Z",
      },
    ],
    [
      "u-verified-hidden",
      {
        user_id: "u-verified-hidden",
        full_name: "Ali Kaya",
        user_type: "student",
        department: "Endüstri Mühendisliği",
        entry_year: 2023,
        graduation_year: null,
        headline: null,
        company: null,
        city: null,
        bio: null,
        skills_json: null,
        contact_email: "ali@example.com",
        linkedin_url: null,
        github_url: null,
        website_url: null,
        avatar_key: null,
        directory_visible: 0,
        show_contact_info: 1,
        show_professional_links: 1,
        updated_at: "2026-11-23T00:00:00Z",
      },
    ],
    [
      "u-pending",
      {
        user_id: "u-pending",
        full_name: "Bekleyen Öğrenci",
        user_type: "student",
        department: "Yapay Zeka ve Veri Mühendisliği",
        entry_year: 2024,
        graduation_year: null,
        headline: null,
        company: null,
        city: null,
        bio: null,
        skills_json: null,
        contact_email: null,
        linkedin_url: null,
        github_url: null,
        website_url: null,
        avatar_key: null,
        directory_visible: 1,
        show_contact_info: 1,
        show_professional_links: 1,
        updated_at: "2026-11-23T00:00:00Z",
      },
    ],
  ]);

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
          return (db.users.find((u) => u.supabase_user_id === sub) ?? null) as T | null;
        }
        if (sql.includes("FROM profiles") && sql.includes("WHERE user_id = ?1")) {
          const uid = params[0] as string;
          return (db.profiles.get(uid) ?? null) as T | null;
        }
        if (sql.startsWith("SELECT COUNT(*) AS total")) {
          const visible = db.users.filter((u) => {
            const p = db.profiles.get(u.id);
            return u.verification_status === "verified" && p?.directory_visible === 1;
          });
          return { total: visible.length } as T;
        }
        return null;
      },
      async all<T>() {
        if (sql.includes("FROM community_permissions")) {
          return { results: [] as T[], success: true, meta: {} };
        }
        if (sql.includes("u.verification_status = 'verified' AND p.directory_visible = 1")) {
          const rows = db.users
            .filter((u) => {
              const p = db.profiles.get(u.id);
              return u.verification_status === "verified" && p?.directory_visible === 1;
            })
            .map((u) => db.profiles.get(u.id)!);
          return { results: rows as T[], success: true, meta: {} };
        }
        return { results: [] as T[], success: true, meta: {} };
      },
      async run() {
        if (sql.startsWith("UPDATE profiles") && sql.includes("SET full_name = ?1")) {
          const uid = params[14] as string;
          const existing = db.profiles.get(uid);
          if (existing) {
            existing.full_name = params[0];
            existing.headline = params[1];
            existing.company = params[2];
            existing.city = params[3];
            existing.bio = params[4];
            existing.skills_json = params[5];
            existing.contact_email = params[6];
            existing.linkedin_url = params[7];
            existing.github_url = params[8];
            existing.website_url = params[9];
            existing.directory_visible = params[10];
            existing.show_contact_info = params[11];
            existing.show_professional_links = params[12];
            existing.updated_at = params[13];
          }
        } else if (sql.startsWith("UPDATE profiles SET avatar_key = ?1")) {
          const uid = params[2] as string;
          const existing = db.profiles.get(uid);
          if (existing) {
            existing.avatar_key = params[0];
            existing.updated_at = params[1];
          }
        }
        return { success: true, meta: {} };
      },
    };
    return stmt;
  }
}

describe("Phase 2 Profiles, R2 Avatars, and Privacy-Controlled Directory", async () => {
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

  it("blocks pending (unverified) users from profile, directory, and media endpoints", async () => {
    const db = new Phase2MockD1();
    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: new MockR2Bucket() as unknown as R2Bucket,
    };

    const pendingToken = await issueToken("sub-3", "bekleyen@gmail.com");
    const dirRes = await app.request(
      "/v1/directory",
      { headers: { Authorization: `Bearer ${pendingToken}` } },
      env,
    );
    assert.equal(dirRes.status, 403);

    const profRes = await app.request(
      "/v1/profile",
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${pendingToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: "Test",
          directoryVisible: true,
          showContactInfo: false,
          showProfessionalLinks: false,
        }),
      },
      env,
    );
    assert.equal(profRes.status, 403);
  });

  it("returns only verified + directory_visible=1 members and strips hidden contact/links", async () => {
    const db = new Phase2MockD1();
    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: new MockR2Bucket() as unknown as R2Bucket,
    };

    const verifiedToken = await issueToken("sub-2", "ali@gmail.com");
    const res = await app.request(
      "/v1/directory",
      { headers: { Authorization: `Bearer ${verifiedToken}` } },
      env,
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      total: number;
      items: Array<{
        userId: string;
        contactEmail: string | null;
        linkedinUrl: string | null;
      }>;
    };

    assert.equal(body.total, 1);
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0]?.userId, "u-verified-visible");
    // show_contact_info = 0 -> contactEmail MUST be stripped to null
    assert.equal(body.items[0]?.contactEmail, null);
    // show_professional_links = 1 -> linkedinUrl is returned
    assert.equal(body.items[0]?.linkedinUrl, "https://linkedin.com/in/ayse");
  });

  it("validates magic bytes on R2 avatar upload and serves authorized images only", async () => {
    const db = new Phase2MockD1();
    const bucket = new MockR2Bucket();
    const env: Env = {
      ENVIRONMENT: "test",
      ALLOWED_ORIGINS: "http://localhost:3000",
      SUPABASE_JWT_ISSUER: TEST_ISSUER,
      SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
      DB: db as unknown as D1Database,
      MEDIA_BUCKET: bucket as unknown as R2Bucket,
    };

    const verifiedToken = await issueToken("sub-1", "ayse@gmail.com");

    // Reject spoofed SVG disguised as PNG
    const badForm = new FormData();
    badForm.append(
      "file",
      new File([new TextEncoder().encode("<svg onload=alert(1)></svg>")], "evil.png", {
        type: "image/png",
      }),
    );
    const badRes = await app.request(
      "/v1/profile/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${verifiedToken}` },
        body: badForm,
      },
      env,
    );
    assert.equal(badRes.status, 400);

    // Accept valid PNG magic bytes
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 1]);
    const goodForm = new FormData();
    goodForm.append("file", new File([pngBytes], "avatar.png", { type: "image/png" }));
    const goodRes = await app.request(
      "/v1/profile/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${verifiedToken}` },
        body: goodForm,
      },
      env,
    );
    assert.equal(goodRes.status, 200);
    const uploadBody = (await goodRes.json()) as { avatarKey: string };
    assert.ok(isSafeAvatarKey(uploadBody.avatarKey));

    // Fetch via authorized media endpoint
    const mediaRes = await app.request(
      `/v1/media/${uploadBody.avatarKey}`,
      { headers: { Authorization: `Bearer ${verifiedToken}` } },
      env,
    );
    assert.equal(mediaRes.status, 200);
    assert.equal(mediaRes.headers.get("x-content-type-options"), "nosniff");
    assert.equal(mediaRes.headers.get("cache-control"), "private, max-age=3600");

    // Unauthenticated media access blocked
    const unauthMedia = await app.request(`/v1/media/${uploadBody.avatarKey}`, {}, env);
    assert.equal(unauthMedia.status, 401);
  });
});
