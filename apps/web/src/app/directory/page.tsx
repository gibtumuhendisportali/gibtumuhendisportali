import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getDictionary,
  type DirectoryListResponse,
  type MeResponse,
} from "@gibtu/shared";
import { DirectoryClient } from "@/components/directory/DirectoryClient";
import { apiRequest } from "@/lib/api/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DirectoryPageProps {
  searchParams: Promise<{
    q?: string;
    userType?: string;
    department?: string;
    page?: string;
  }>;
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const dict = getDictionary("tr");
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/directory");
  }

  if (!user.email_confirmed_at) {
    redirect(`/auth/verify?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login");
  }

  let me: MeResponse | null = null;
  try {
    me = await apiRequest<MeResponse>("/v1/me", {
      method: "GET",
      accessToken: session.access_token,
      cache: "no-store",
    });
  } catch {
    redirect("/dashboard");
  }

  if (!me.onboarded || !me.user) {
    redirect("/onboarding");
  }

  if (me.user.verificationStatus !== "verified") {
    redirect("/dashboard");
  }

  const resolvedParams = await searchParams;
  const q = (resolvedParams.q ?? "").trim();
  const userType = resolvedParams.userType ?? "all";
  const department = resolvedParams.department ?? "all";
  const page = resolvedParams.page ?? "1";

  const apiParams = new URLSearchParams();
  if (q) apiParams.set("q", q);
  if (userType !== "all") apiParams.set("userType", userType);
  if (department !== "all") apiParams.set("department", department);
  apiParams.set("page", page);

  let data: DirectoryListResponse = {
    items: [],
    total: 0,
    page: 1,
    pageSize: 12,
  };
  let apiError = false;

  try {
    data = await apiRequest<DirectoryListResponse>(`/v1/directory?${apiParams.toString()}`, {
      method: "GET",
      accessToken: session.access_token,
      cache: "no-store",
    });
  } catch {
    apiError = true;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="font-heading text-lg font-semibold text-navy">
            {dict.common.brandName}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="border border-border px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.dashboard.editProfileLink}
            </Link>
            <Link
              href="/dashboard"
              className="border border-border px-3.5 py-1.5 text-sm font-medium text-navy hover:border-navy"
            >
              {dict.directory.backToDashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brass">
          {dict.directory.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy">
          {dict.directory.title}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">{dict.directory.subtitle}</p>

        {apiError ? (
          <div
            role="alert"
            className="mt-8 border border-brass bg-surface px-4 py-3 text-sm text-ink"
          >
            {dict.dashboard.apiErrorBanner}
          </div>
        ) : (
          <DirectoryClient data={data} filters={{ q, userType, department }} />
        )}
      </main>
    </div>
  );
}
