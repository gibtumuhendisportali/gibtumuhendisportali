"use client";

import { useState } from "react";
import { getDictionary, type AdminVerificationItem } from "@gibtu/shared";

const dict = getDictionary("tr");

interface VerificationQueueClientProps {
  initialItems: AdminVerificationItem[];
}

export function VerificationQueueClient({ initialItems }: VerificationQueueClientProps) {
  const [items, setItems] = useState<AdminVerificationItem[]>(initialItems);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submitDecision(
    userId: string,
    decision: "verified" | "rejected",
    reason?: string,
  ) {
    setErrorMessage(null);
    setFeedback(null);
    setBusyUserId(userId);

    try {
      const response = await fetch(`/api/portal/admin/verifications/${userId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          ...(decision === "rejected" && reason ? { rejectionReason: reason } : {}),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setErrorMessage(body?.error?.message ?? dict.adminVerifications.decisionError);
        return;
      }

      setItems((prev) => prev.filter((item) => item.userId !== userId));
      setRejectingUserId(null);
      setRejectionReason("");
      setFeedback(dict.adminVerifications.decisionSuccess);
    } catch {
      setErrorMessage(dict.adminVerifications.decisionError);
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {errorMessage && (
        <div role="alert" className="border border-brass bg-surface px-4 py-3 text-sm text-ink">
          {errorMessage}
        </div>
      )}
      {feedback && (
        <div role="status" className="border border-sage bg-surface px-4 py-3 text-sm text-ink">
          {feedback}
        </div>
      )}

      {items.length === 0 ? (
        <div className="border border-border bg-surface p-8 text-sm text-ink-muted">
          {dict.adminVerifications.emptyQueue}
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => {
            const isBusy = busyUserId === item.userId;
            const isRejecting = rejectingUserId === item.userId;

            return (
              <li key={item.userId} className="border border-border bg-surface p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-heading text-lg font-semibold text-navy">{item.fullName}</p>
                    <p className="mt-1 text-sm text-ink-muted">{item.email}</p>
                    <p className="mt-2 text-xs text-ink-muted">
                      {item.userType === "alumni"
                        ? dict.dashboard.userTypeAlumni
                        : dict.dashboard.userTypeStudent}{" "}
                      • {item.department} • {item.entryYear}
                      {item.graduationYear ? ` – ${item.graduationYear}` : ""}
                    </p>
                    {item.verificationNote && (
                      <p className="mt-3 border-l-2 border-brass pl-3 text-xs text-ink">
                        {item.verificationNote}
                      </p>
                    )}
                  </div>

                  {!isRejecting && (
                    <div className="flex shrink-0 items-center gap-2.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => submitDecision(item.userId, "verified")}
                        className="border border-navy bg-navy px-4 py-2 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-60"
                      >
                        {dict.adminVerifications.approveButton}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectingUserId(item.userId);
                          setRejectionReason("");
                        }}
                        className="border border-border bg-paper px-4 py-2 text-xs font-medium text-ink hover:border-navy disabled:opacity-60"
                      >
                        {dict.adminVerifications.rejectButton}
                      </button>
                    </div>
                  )}
                </div>

                {isRejecting && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={dict.adminVerifications.rejectionReasonPlaceholder}
                      className="w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
                    />
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          submitDecision(item.userId, "rejected", rejectionReason.trim())
                        }
                        className="border border-navy bg-navy px-4 py-2 text-xs font-medium text-paper disabled:opacity-60"
                      >
                        {dict.adminVerifications.confirmRejectButton}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setRejectingUserId(null)}
                        className="border border-border bg-paper px-4 py-2 text-xs font-medium text-ink"
                      >
                        {dict.adminVerifications.cancelButton}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
