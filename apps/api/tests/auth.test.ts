import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createLocalJWKSet, errors as joseErrors, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createApp } from "../src/index";
import type { Env } from "../src/env";

const TEST_ISSUER = "https://example-project.supabase.co/auth/v1";
const TEST_AUDIENCE = "authenticated";

const mockEnv: Env = {
  ENVIRONMENT: "test",
  ALLOWED_ORIGINS: "http://localhost:3000",
  SUPABASE_JWT_ISSUER: TEST_ISSUER,
  SUPABASE_JWT_AUDIENCE: TEST_AUDIENCE,
  DB: {} as D1Database,
  MEDIA_BUCKET: {} as R2Bucket,
};

describe("API JWT verification and /v1/auth/me", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const { privateKey: wrongPrivateKey } = await generateKeyPair("ES256");
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

  it("returns 401 when Authorization header is missing", async () => {
    const res = await app.request("/v1/auth/me", {}, mockEnv);
    assert.equal(res.status, 401);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, "UNAUTHORIZED");
  });

  it("returns 401 when Authorization header is malformed", async () => {
    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: "Basic abc123" } },
      mockEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 200 and verified identity for a valid JWT", async () => {
    const token = await new SignJWT({
      email: "ogrenci@gmail.com",
      email_verified: true,
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      user: { supabaseUserId: string; email: string; emailVerified: boolean | null };
    };
    assert.equal(body.user.supabaseUserId, "user-uuid-123");
    assert.equal(body.user.email, "ogrenci@gmail.com");
    assert.equal(body.user.emailVerified, true);
  });

  it("ignores user_metadata.email_verified=true when top-level claim is absent", async () => {
    const token = await new SignJWT({
      email: "ogrenci@gmail.com",
      user_metadata: { email_verified: true },
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      user: { emailVerified: boolean | null };
    };
    assert.equal(body.user.emailVerified, null);
  });

  it("does not allow user_metadata.email_verified=false to override top-level claim", async () => {
    const token = await new SignJWT({
      email: "ogrenci@gmail.com",
      email_verified: true,
      user_metadata: { email_verified: false },
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      user: { emailVerified: boolean | null };
    };
    assert.equal(body.user.emailVerified, true);
  });

  it("handles token without email_verified claim safely as null", async () => {
    const token = await new SignJWT({
      email: "ogrenci@gmail.com",
      role: "authenticated",
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-456")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      user: { supabaseUserId: string; emailVerified: boolean | null };
    };
    assert.equal(body.user.supabaseUserId, "user-uuid-456");
    assert.equal(body.user.emailVerified, null);
  });

  it("returns 401 for an expired JWT", async () => {
    const expiredToken = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${expiredToken}` } },
      mockEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 for wrong issuer", async () => {
    const token = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer("https://evil.example.com/auth/v1")
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 for wrong audience", async () => {
    const token = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience("anon")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 when signature is signed by an untrusted key", async () => {
    const token = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(wrongPrivateKey);

    const res = await app.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );
    assert.equal(res.status, 401);
  });

  it("returns 503 fail-closed when JWKS endpoint has a network error", async () => {
    const networkFailApp = createApp({
      auth: {
        getKey: async () => {
          throw new TypeError("fetch failed: ECONNREFUSED internal-host:54321");
        },
        issuer: TEST_ISSUER,
        audience: TEST_AUDIENCE,
      },
    });

    const token = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await networkFailApp.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 503);
    const body = (await res.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "AUTH_SERVICE_UNAVAILABLE");
    assert.equal(body.error.message.includes("ECONNREFUSED"), false);
  });

  it("returns 503 fail-closed when JWKS lookup times out", async () => {
    const timeoutApp = createApp({
      auth: {
        getKey: async () => {
          throw new joseErrors.JWKSTimeout();
        },
        issuer: TEST_ISSUER,
        audience: TEST_AUDIENCE,
      },
    });

    const token = await new SignJWT({ email: "ogrenci@gmail.com" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key-1" })
      .setSubject("user-uuid-123")
      .setIssuer(TEST_ISSUER)
      .setAudience(TEST_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const res = await timeoutApp.request(
      "/v1/auth/me",
      { headers: { Authorization: `Bearer ${token}` } },
      mockEnv,
    );

    assert.equal(res.status, 503);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, "AUTH_SERVICE_UNAVAILABLE");
  });

  it("returns 503 when auth verifier is not configured", async () => {
    const unconfiguredApp = createApp();
    const res = await unconfiguredApp.request(
      "/v1/auth/me",
      { headers: { Authorization: "Bearer dummy.jwt.token" } },
      {
        ENVIRONMENT: "test",
        ALLOWED_ORIGINS: "http://localhost:3000",
        DB: {} as D1Database,
        MEDIA_BUCKET: {} as R2Bucket,
      },
    );
    assert.equal(res.status, 503);
  });
});
