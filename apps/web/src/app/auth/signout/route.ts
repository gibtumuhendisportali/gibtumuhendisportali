import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { handleSignOut } from "@/lib/supabase/signout";

export async function POST(request: NextRequest) {
  return handleSignOut(request, createServerSupabaseClient);
}
