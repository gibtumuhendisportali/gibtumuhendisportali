import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server";
import { loginSchema, registerSchema } from "@gibtu/shared";
import { handleAuthCallback } from "../src/lib/supabase/callback";
import {
  getSupabasePublicConfig,
  validateSupabasePublicConfig,
} from "../src/lib/supabase/config";
import { updateSession } from "../src/lib/supabase/middleware";
import { sanitizeRedirectPath } from "../src/lib/supabase/redirect";
import { handleSignOut } from "../src/lib/supabase/signout";

const MOCK_CONFIG = {
  url: "https://example.supabase.co",
  anonKey: "anon-placeholder",
};

describe("Auth validation and open-redirect protection", () => {
  it("allows any personal email domain for registration", () => {
    const gmail = registerSchema.safeParse({
      email: "mezun.muhendis@gmail.com",
      password: "Password123",
      passwordConfirm: "Password123",
    });
    assert.equal(gmail.success, true);

    const outlook = registerSchema.safeParse({
      email: "ogrenci@outlook.com",
      password: "Password123",
      passwordConfirm: "Password123",
    });
    assert.equal(outlook.success, true);
  });

  it("rejects weak or mismatched passwords on registration", () => {
    const tooShort = registerSchema.safeParse({
      email: "user@gmail.com",
      password: "ab1",
      passwordConfirm: "ab1",
    });
    assert.equal(tooShort.success, false);

    const noDigit = registerSchema.safeParse({
      email: "user@gmail.com",
      password: "OnlyLettersPassword",
      passwordConfirm: "OnlyLettersPassword",
    });
    assert.equal(noDigit.success, false);

    const mismatch = registerSchema.safeParse({
      email: "user@gmail.com",
      password: "Password123",
      passwordConfirm: "Password124",
    });
    assert.equal(mismatch.success, false);
  });

  it("validates login schema inputs", () => {
    const valid = loginSchema.safeParse({
      email: "user@gmail.com",
      password: "Password123",
    });
    assert.equal(valid.success, true);

    const invalidEmail = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123",
    });
    assert.equal(invalidEmail.success, false);
  });

  it("hardens sanitizeRedirectPath against open redirects and control characters", () => {
    assert.equal(sanitizeRedirectPath("/dashboard"), "/dashboard");
    assert.equal(sanitizeRedirectPath("/events/123?tab=info"), "/events/123?tab=info");
    assert.equal(sanitizeRedirectPath("//evil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath("https://evil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath("/\\evil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath("/dashboard\r\nLocation: https://evil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath("/\tevil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath("///evil.com"), "/dashboard");
    assert.equal(sanitizeRedirectPath(null), "/dashboard");
  });
});

describe("Middleware updateSession behavior (mocked Supabase)", () => {
  it("redirects unauthenticated /dashboard requests to /login?next=/dashboard", async () => {
    const req = new NextRequest("https://portal.example.com/dashboard");
    const res = await updateSession(req, {
      getConfig: () => MOCK_CONFIG,
      createClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: null } }),
        },
      }),
    });

    assert.equal(res.status, 307);
    assert.equal(
      res.headers.get("location"),
      "https://portal.example.com/login?next=%2Fdashboard",
    );
  });

  it("redirects unverified email users from /dashboard to /auth/verify", async () => {
    const req = new NextRequest("https://portal.example.com/dashboard");
    const res = await updateSession(req, {
      getConfig: () => MOCK_CONFIG,
      createClient: () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: "u1", email_confirmed_at: null } },
          }),
        },
      }),
    });

    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/auth/verify");
  });

  it("preserves refreshed session cookies and attributes on redirect", async () => {
    const req = new NextRequest("https://portal.example.com/login");
    const expiresDate = new Date("2030-01-01T00:00:00.000Z");

    const res = await updateSession(req, {
      getConfig: () => MOCK_CONFIG,
      createClient: (_config, cookies) => ({
        auth: {
          getUser: async () => {
            cookies.setAll([
              {
                name: "sb-access-token",
                value: "refreshed-token",
                options: {
                  httpOnly: true,
                  secure: true,
                  sameSite: "lax",
                  path: "/",
                  maxAge: 3600,
                  expires: expiresDate,
                },
              },
            ]);
            return {
              data: { user: { id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
            };
          },
        },
      }),
    });

    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/dashboard");
    const cookie = res.cookies.get("sb-access-token");
    assert.ok(cookie);
    assert.equal(cookie.value, "refreshed-token");
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.sameSite, "lax");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.maxAge, 3600);
  });

  it("preserves invalid-session clearing cookies on redirect", async () => {
    const req = new NextRequest("https://portal.example.com/dashboard");
    const res = await updateSession(req, {
      getConfig: () => MOCK_CONFIG,
      createClient: (_config, cookies) => ({
        auth: {
          getUser: async () => {
            cookies.setAll([
              {
                name: "sb-access-token",
                value: "",
                options: {
                  httpOnly: true,
                  secure: true,
                  sameSite: "lax",
                  path: "/",
                  maxAge: 0,
                },
              },
            ]);
            return { data: { user: null } };
          },
        },
      }),
    });

    assert.equal(res.status, 307);
    assert.equal(
      res.headers.get("location"),
      "https://portal.example.com/login?next=%2Fdashboard",
    );
    const cleared = res.cookies.get("sb-access-token");
    assert.ok(cleared);
    assert.equal(cleared.value, "");
    assert.equal(cleared.maxAge, 0);
  });
});

describe("Auth callback route handler (mocked Supabase)", () => {
  it("accepts allowed OTP types and redirects to sanitized next path", async () => {
    let verifyCalled = false;
    const req = new NextRequest(
      "https://portal.example.com/auth/callback?token_hash=abc&type=signup&next=/dashboard",
    );

    const res = await handleAuthCallback(req, async () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => {
          verifyCalled = true;
          return { error: null };
        },
      },
    }));

    assert.equal(verifyCalled, true);
    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/dashboard");
  });

  it("rejects disallowed OTP types without calling verifyOtp", async () => {
    let verifyCalled = false;
    const req = new NextRequest(
      "https://portal.example.com/auth/callback?token_hash=abc&type=admin_override",
    );

    const res = await handleAuthCallback(req, async () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => {
          verifyCalled = true;
          return { error: null };
        },
      },
    }));

    assert.equal(verifyCalled, false);
    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/login?error=callback");
  });

  it("redirects to callback error when token_hash is missing or params are invalid", async () => {
    const req = new NextRequest("https://portal.example.com/auth/callback?type=signup");
    const res = await handleAuthCallback(req, async () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => ({ error: null }),
      },
    }));

    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/login?error=callback");
  });

  it("redirects to callback error on failed PKCE code exchange", async () => {
    const req = new NextRequest("https://portal.example.com/auth/callback?code=bad-code");
    const res = await handleAuthCallback(req, async () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: new Error("invalid code") }),
        verifyOtp: async () => ({ error: null }),
      },
    }));

    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/login?error=callback");
  });

  it("sanitizes open redirect attempts in callback next parameter", async () => {
    const req = new NextRequest(
      "https://portal.example.com/auth/callback?code=ok&next=https://evil.com",
    );
    const res = await handleAuthCallback(req, async () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        verifyOtp: async () => ({ error: null }),
      },
    }));

    assert.equal(res.status, 307);
    assert.equal(res.headers.get("location"), "https://portal.example.com/dashboard");
  });
});

describe("Signout route handler (mocked Supabase)", () => {
  it("signs out locally with no-store header and redirects to /login", async () => {
    let usedScope: string | undefined;
    const req = new NextRequest("https://portal.example.com/auth/signout", {
      method: "POST",
    });

    const res = await handleSignOut(req, async () => ({
      auth: {
        signOut: async (options) => {
          usedScope = options?.scope;
          return { error: null };
        },
      },
    }));

    assert.equal(usedScope, "local");
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "https://portal.example.com/login");
    assert.equal(res.headers.get("cache-control"), "no-store");
  });

  it("clears sb-* cookies and redirects with ?error=signout on Supabase signOut failure", async () => {
    const req = new NextRequest("https://portal.example.com/auth/signout", {
      method: "POST",
      headers: {
        cookie: "sb-proj-auth-token=stale-session; theme=paper",
      },
    });

    const res = await handleSignOut(req, async () => ({
      auth: {
        signOut: async () => ({ error: new Error("upstream down") }),
      },
    }));

    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), "https://portal.example.com/login?error=signout");
    assert.equal(res.headers.get("cache-control"), "no-store");
    const cleared = res.cookies.get("sb-proj-auth-token");
    assert.ok(cleared);
    assert.equal(cleared.value, "");
    assert.equal(cleared.maxAge, 0);
    assert.equal(res.cookies.get("theme"), undefined);
  });
});

describe("Supabase public config key resolution", () => {
  it("prefers NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY over NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    const result = validateSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_primary",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_fallback",
    });

    assert.deepEqual(result.config, {
      url: "https://example.supabase.co",
      anonKey: "sb_publishable_primary",
    });
    assert.deepEqual(result.missing, []);
    assert.equal(result.errorMessage, null);
  });

  it("falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY when publishable key is unset", () => {
    const result = validateSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy_anon_only",
    });

    assert.deepEqual(result.config, {
      url: "https://example.supabase.co",
      anonKey: "legacy_anon_only",
    });
    assert.equal(result.errorMessage, null);
  });

  it("reports missing URL and key clearly in errorMessage", () => {
    const missingUrl = validateSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_only",
    });
    assert.equal(missingUrl.config, null);
    assert.ok(missingUrl.missing.includes("NEXT_PUBLIC_SUPABASE_URL"));
    assert.ok(missingUrl.errorMessage?.includes("NEXT_PUBLIC_SUPABASE_URL"));

    const missingKey = validateSupabasePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });
    assert.equal(missingKey.config, null);
    assert.ok(missingKey.errorMessage?.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"));
    assert.ok(missingKey.errorMessage?.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

    assert.equal(getSupabasePublicConfig(), null);
  });
});
