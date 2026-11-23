import { NextResponse, type NextRequest } from "next/server";

export interface SignOutSupabaseClient {
  auth: {
    signOut: (options?: { scope?: "global" | "local" | "others" }) => Promise<{
      error: unknown | null;
    }>;
  };
}

function clearSupabaseCookies(request: NextRequest, response: NextResponse): void {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
    }
  }
}

export async function handleSignOut(
  request: NextRequest,
  getClient: () => Promise<SignOutSupabaseClient | null>,
): Promise<NextResponse> {
  const supabase = await getClient();
  let hasSignOutError = false;

  if (supabase) {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        hasSignOutError = true;
      }
    } catch {
      hasSignOutError = true;
    }
  }

  const targetPath = hasSignOutError ? "/login?error=signout" : "/login";
  const response = NextResponse.redirect(new URL(targetPath, request.url), {
    status: 303,
  });
  response.headers.set("Cache-Control", "no-store");

  if (hasSignOutError || !supabase) {
    clearSupabaseCookies(request, response);
  }

  return response;
}
