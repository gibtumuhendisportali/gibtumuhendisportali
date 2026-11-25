import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8787").replace(/\/+$/, "");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string; filename: string }> },
) {
  const { userId, filename } = await context.params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return new NextResponse(null, { status: 503 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) {
    return new NextResponse(null, { status: 401 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const upstream = await fetch(
      `${getApiBaseUrl()}/v1/media/avatars/${encodeURIComponent(userId)}/${encodeURIComponent(filename)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${session.access_token}` },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") ?? "image/jpeg");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
