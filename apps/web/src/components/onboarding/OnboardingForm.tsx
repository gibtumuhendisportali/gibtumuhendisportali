"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ENGINEERING_DEPARTMENTS,
  getDictionary,
  onboardingInputSchema,
  type UserType,
} from "@gibtu/shared";

const dict = getDictionary("tr");

export function OnboardingForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<UserType>("student");
  const [department, setDepartment] = useState<string>(ENGINEERING_DEPARTMENTS[0]);
  const [entryYear, setEntryYear] = useState("2023");
  const [graduationYear, setGraduationYear] = useState("");
  const [verificationNote, setVerificationNote] = useState("");
  const [kvkkDisclosureAccepted, setKvkkDisclosureAccepted] = useState(false);
  const [kvkkExplicitConsent, setKvkkExplicitConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = onboardingInputSchema.safeParse({
      fullName,
      userType,
      department,
      entryYear: Number(entryYear),
      graduationYear:
        userType === "alumni" && graduationYear.trim().length > 0
          ? Number(graduationYear)
          : null,
      verificationNote: verificationNote.trim() || undefined,
      kvkkDisclosureAccepted,
      kvkkExplicitConsent,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(firstIssue?.message ?? dict.auth.genericError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/portal/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setErrorMessage(body?.error?.message ?? dict.auth.genericError);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
      {errorMessage && (
        <div role="alert" className="border border-brass bg-paper px-4 py-3 text-sm text-ink">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-xs font-medium text-navy">
          {dict.onboarding.fullNameLabel}
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
        />
      </div>

      <div>
        <span className="block text-xs font-medium text-navy">
          {dict.onboarding.userTypeLabel}
        </span>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2.5 border border-border bg-paper px-3.5 py-2.5 text-sm">
            <input
              type="radio"
              name="userType"
              value="student"
              checked={userType === "student"}
              onChange={() => setUserType("student")}
            />
            <span>{dict.onboarding.studentOption}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 border border-border bg-paper px-3.5 py-2.5 text-sm">
            <input
              type="radio"
              name="userType"
              value="alumni"
              checked={userType === "alumni"}
              onChange={() => setUserType("alumni")}
            />
            <span>{dict.onboarding.alumniOption}</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="department" className="block text-xs font-medium text-navy">
          {dict.onboarding.departmentLabel}
        </label>
        <select
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
        >
          {ENGINEERING_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="entryYear" className="block text-xs font-medium text-navy">
            {dict.onboarding.entryYearLabel}
          </label>
          <input
            id="entryYear"
            type="number"
            min={2018}
            max={2035}
            required
            value={entryYear}
            onChange={(e) => setEntryYear(e.target.value)}
            className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
          />
        </div>

        {userType === "alumni" && (
          <div>
            <label htmlFor="graduationYear" className="block text-xs font-medium text-navy">
              {dict.onboarding.graduationYearLabel}
            </label>
            <input
              id="graduationYear"
              type="number"
              min={2018}
              max={2035}
              required
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="verificationNote" className="block text-xs font-medium text-navy">
          {dict.onboarding.verificationNoteLabel}
        </label>
        <textarea
          id="verificationNote"
          rows={3}
          maxLength={400}
          value={verificationNote}
          onChange={(e) => setVerificationNote(e.target.value)}
          className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
        />
        <p className="mt-1 text-xs text-ink-muted">{dict.onboarding.verificationNoteHint}</p>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink">
          <input
            type="checkbox"
            checked={kvkkDisclosureAccepted}
            onChange={(e) => setKvkkDisclosureAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            {dict.onboarding.kvkkDisclosureLabel}{" "}
            <Link
              href="/kvkk"
              target="_blank"
              className="font-medium text-navy underline underline-offset-4"
            >
              {dict.onboarding.kvkkLinkText}
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-muted">
          <input
            type="checkbox"
            checked={kvkkExplicitConsent}
            onChange={(e) => setKvkkExplicitConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>{dict.onboarding.kvkkExplicitLabel}</span>
        </label>
      </div>

      <p className="border-l-2 border-brass pl-3 text-xs leading-relaxed text-ink-muted">
        {dict.onboarding.privacyDefaultNote}
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full border border-navy bg-navy px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? dict.onboarding.submittingButton : dict.onboarding.submitButton}
      </button>
    </form>
  );
}
