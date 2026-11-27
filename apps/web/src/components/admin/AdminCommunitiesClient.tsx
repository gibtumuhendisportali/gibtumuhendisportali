"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  AdminMemberPermissionItem,
  CommunitySummary,
  Dictionary,
} from "@gibtu/shared";

interface AdminCommunitiesClientProps {
  communities: CommunitySummary[];
  initialMembers: AdminMemberPermissionItem[];
  dict: Dictionary["adminCommunities"];
}

export function AdminCommunitiesClient({
  communities,
  initialMembers,
  dict,
}: AdminCommunitiesClientProps) {
  const router = useRouter();
  const [members, setMembers] = useState<AdminMemberPermissionItem[]>(initialMembers);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant(userId: string, community: CommunitySummary) {
    const key = `${userId}:${community.id}`;
    setBusyKey(key);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/admin/communities/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          communityId: community.id,
          role: "organizer",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setError(payload.error?.message ?? "Yetki atanamadı.");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? {
                ...m,
                communityPermissions: [
                  ...m.communityPermissions.filter((p) => p.communityId !== community.id),
                  {
                    communityId: community.id,
                    communitySlug: community.slug,
                    communityName: community.name,
                    role: "organizer",
                  },
                ],
              }
            : m,
        ),
      );
      setMessage(dict.grantSuccess);
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRevoke(userId: string, communityId: string) {
    const key = `${userId}:${communityId}`;
    setBusyKey(key);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/portal/admin/communities/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, communityId }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      if (!response.ok) {
        setError(payload.error?.message ?? "Yetki kaldırılamadı.");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId
            ? {
                ...m,
                communityPermissions: m.communityPermissions.filter(
                  (p) => p.communityId !== communityId,
                ),
              }
            : m,
        ),
      );
      setMessage(dict.revokeSuccess);
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setBusyKey(null);
    }
  }

  if (members.length === 0) {
    return (
      <div className="border border-border bg-surface p-8 text-center text-sm text-muted">
        {dict.emptyMembers}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="border border-sage bg-surface px-4 py-3 text-sm text-navy">
          {message}
        </div>
      )}
      {error && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="divide-y divide-border border border-border bg-surface">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"
          >
            <div>
              <p className="font-heading text-lg font-semibold text-navy">
                {member.fullName}
              </p>
              <p className="text-xs text-muted">
                {member.department} · {member.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {communities.map((comm) => {
                const hasPerm = member.communityPermissions.some(
                  (p) => p.communityId === comm.id,
                );
                const key = `${member.userId}:${comm.id}`;
                const isBusy = busyKey === key;

                return hasPerm ? (
                  <button
                    key={comm.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleRevoke(member.userId, comm.id)}
                    className="border border-brass bg-paper px-3 py-1.5 text-xs font-medium text-navy hover:bg-brass/10 disabled:opacity-60"
                  >
                    {comm.name} ({dict.organizerRoleLabel}) · {dict.revokeButton}
                  </button>
                ) : (
                  <button
                    key={comm.id}
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleGrant(member.userId, comm)}
                    className="border border-border bg-paper px-3 py-1.5 text-xs font-medium text-navy hover:border-navy disabled:opacity-60"
                  >
                    {comm.name} · {dict.grantButton}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
