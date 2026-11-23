import type { NextRequest } from "next/server";
import { handleAuthCallback } from "@/lib/supabase/callback";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request, createServerSupabaseClient);
}
