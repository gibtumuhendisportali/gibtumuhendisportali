import { NextResponse, type NextRequest } from "next/server";
import { ApiClientError, apiRequest } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { code: "AUTH_NOT_CONFIGURED", message: "Kimlik doğrulama yapılandırılmamış." } },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Oturum gerekli." } },
      { status: 401 },
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Geçerli oturum belirteci bulunamadı." } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Geçersiz JSON gövdesi." } },
      { status: 400 },
    );
  }

  try {
    const result = await apiRequest<{ status: string }>(
      `/v1/events/${encodeURIComponent(eventId)}/status`,
      {
        method: "PATCH",
        accessToken: session.access_token,
        body: JSON.stringify(body),
      },
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ApiClientError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Etkinlik durumu güncellenemedi." } },
      { status: 500 },
    );
  }
}
