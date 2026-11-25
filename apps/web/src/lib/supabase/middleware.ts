import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig, type SupabasePublicConfig } from "./config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/admin",
  "/profile",
  "/directory",
  "/events",
  "/tickets",
  "/check-in",
];
const GUEST_ONLY_PATHS = ["/login", "/register"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => pathname === path);
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export interface MiddlewareSupabaseClient {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email_confirmed_at?: string | null } | null };
    }>;
  };
}

export interface CookieAdapter {
  getAll: () => Array<{ name: string; value: string }>;
  setAll: (
    cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
  ) => void;
}

export type MiddlewareClientFactory = (
  config: SupabasePublicConfig,
  cookies: CookieAdapter,
) => MiddlewareSupabaseClient;

const defaultClientFactory: MiddlewareClientFactory = (config, cookies) =>
  createServerClient(config.url, config.anonKey, { cookies });

export async function updateSession(
  request: NextRequest,
  deps: {
    getConfig?: () => SupabasePublicConfig | null;
    createClient?: MiddlewareClientFactory;
  } = {},
): Promise<NextResponse> {
  const getConfig = deps.getConfig ?? getSupabasePublicConfig;
  const createClient = deps.createClient ?? defaultClientFactory;
  const config = getConfig();

  let response = NextResponse.next({
    request,
  });

  if (!config) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createClient(config, {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({
        request,
      });
      cookiesToSet.forEach(({ name, value, options }) =>
        response.cookies.set(name, value, options),
      );
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && !user.email_confirmed_at && isProtectedPath(pathname)) {
    const verifyUrl = request.nextUrl.clone();
    verifyUrl.pathname = "/auth/verify";
    return copyCookies(response, NextResponse.redirect(verifyUrl));
  }

  if (user && user.email_confirmed_at && isGuestOnlyPath(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return copyCookies(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}
