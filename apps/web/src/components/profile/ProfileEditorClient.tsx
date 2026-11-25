"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { getDictionary, profileUpdateSchema, type MeResponse } from "@gibtu/shared";

const dict = getDictionary("tr");

function avatarKeyToUrl(avatarKey: string | null): string | null {
  if (!avatarKey) return null;
  // avatars/{userId}/{filename} -> /api/portal/media/avatar/{userId}/{filename}
  const parts = avatarKey.split("/");
  if (parts.length !== 3 || parts[0] !== "avatars") return null;
  return `/api/portal/media/avatar/${encodeURIComponent(parts[1] ?? "")}/${encodeURIComponent(parts[2] ?? "")}`;
}

interface ProfileEditorClientProps {
  initialProfile: NonNullable<MeResponse["profile"]>;
}

export function ProfileEditorClient({ initialProfile }: ProfileEditorClientProps) {
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [headline, setHeadline] = useState(initialProfile.headline ?? "");
  const [company, setCompany] = useState(initialProfile.company ?? "");
  const [city, setCity] = useState(initialProfile.city ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [skillsText, setSkillsText] = useState(initialProfile.skills.join(", "));
  const [contactEmail, setContactEmail] = useState(initialProfile.contactEmail ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initialProfile.githubUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile.websiteUrl ?? "");

  const [directoryVisible, setDirectoryVisible] = useState(initialProfile.directoryVisible);
  const [showContactInfo, setShowContactInfo] = useState(initialProfile.showContactInfo);
  const [showProfessionalLinks, setShowProfessionalLinks] = useState(
    initialProfile.showProfessionalLinks,
  );

  const [avatarKey, setAvatarKey] = useState<string | null>(initialProfile.avatarKey);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const avatarUrl = avatarKeyToUrl(avatarKey);

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setAvatarBusy(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/portal/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const body = (await response.json().catch(() => null)) as {
        avatarKey?: string | null;
        error?: { message?: string };
      } | null;

      if (!response.ok || !body?.avatarKey) {
        setErrorMessage(body?.error?.message ?? dict.auth.genericError);
        return;
      }

      setAvatarKey(body.avatarKey);
      setSuccessMessage(dict.profile.avatarSuccess);
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setAvatarBusy(false);
      event.target.value = "";
    }
  }

  async function handleAvatarRemove() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAvatarBusy(true);

    try {
      const response = await fetch("/api/portal/profile/avatar", {
        method: "DELETE",
      });
      if (!response.ok) {
        setErrorMessage(dict.auth.genericError);
        return;
      }
      setAvatarKey(null);
      setSuccessMessage(dict.profile.avatarRemoved);
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const skills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsed = profileUpdateSchema.safeParse({
      fullName,
      headline,
      company,
      city,
      bio,
      skills,
      contactEmail,
      linkedinUrl,
      githubUrl,
      websiteUrl,
      directoryVisible,
      showContactInfo,
      showProfessionalLinks,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMessage(firstIssue?.message ?? dict.auth.genericError);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;

      if (!response.ok) {
        setErrorMessage(body?.error?.message ?? dict.auth.genericError);
        return;
      }

      setSuccessMessage(dict.profile.saveSuccess);
    } catch {
      setErrorMessage(dict.auth.genericError);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {errorMessage && (
        <div role="alert" className="border border-brass bg-surface px-4 py-3 text-sm text-ink">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div role="status" className="border border-sage bg-surface px-4 py-3 text-sm text-ink">
          {successMessage}
        </div>
      )}

      {/* Avatar Section */}
      <section className="border border-border bg-surface p-6">
        <h2 className="font-heading text-lg font-semibold text-navy">
          {dict.profile.avatarSectionTitle}
        </h2>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-paper text-lg font-semibold text-navy">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{fullName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">{dict.profile.avatarHint}</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border border-navy bg-navy px-4 py-2 text-xs font-medium text-paper hover:opacity-90">
                <span>
                  {avatarBusy ? dict.profile.avatarUploading : dict.profile.avatarUploadButton}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={avatarBusy}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
              {avatarKey && (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={handleAvatarRemove}
                  className="border border-border bg-paper px-4 py-2 text-xs font-medium text-ink hover:border-navy disabled:opacity-60"
                >
                  {dict.profile.avatarRemoveButton}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Basic Professional Details */}
        <section className="border border-border bg-surface p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            {dict.profile.basicSectionTitle}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="block text-xs font-medium text-navy">
                {dict.profile.fullNameLabel}
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
              <label htmlFor="headline" className="block text-xs font-medium text-navy">
                {dict.profile.headlineLabel}
              </label>
              <input
                id="headline"
                type="text"
                value={headline}
                placeholder={dict.profile.headlinePlaceholder}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-medium text-navy">
                {dict.profile.companyLabel}
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-medium text-navy">
                {dict.profile.cityLabel}
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs font-medium text-navy">
              {dict.profile.bioLabel}
            </label>
            <textarea
              id="bio"
              rows={3}
              maxLength={600}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="skills" className="block text-xs font-medium text-navy">
              {dict.profile.skillsLabel}
            </label>
            <input
              id="skills"
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-muted">{dict.profile.skillsHint}</p>
          </div>
        </section>

        {/* Contact & Professional Links */}
        <section className="border border-border bg-surface p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            {dict.profile.contactLinksSectionTitle}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contactEmail" className="block text-xs font-medium text-navy">
                {dict.profile.contactEmailLabel}
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="linkedinUrl" className="block text-xs font-medium text-navy">
                {dict.profile.linkedinLabel}
              </label>
              <input
                id="linkedinUrl"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="githubUrl" className="block text-xs font-medium text-navy">
                {dict.profile.githubLabel}
              </label>
              <input
                id="githubUrl"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-xs font-medium text-navy">
                {dict.profile.websiteLabel}
              </label>
              <input
                id="websiteUrl"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* KVKK Privacy Controls */}
        <section className="border border-navy bg-surface p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            {dict.profile.privacySectionTitle}
          </h2>

          <label className="flex items-start gap-3 border-t border-border pt-4">
            <input
              type="checkbox"
              checked={directoryVisible}
              onChange={(e) => setDirectoryVisible(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-navy">
                {dict.profile.directoryVisibleLabel}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {dict.profile.directoryVisibleHint}
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 border-t border-border pt-4">
            <input
              type="checkbox"
              checked={showContactInfo}
              onChange={(e) => setShowContactInfo(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-navy">
                {dict.profile.showContactLabel}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {dict.profile.showContactHint}
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 border-t border-border pt-4">
            <input
              type="checkbox"
              checked={showProfessionalLinks}
              onChange={(e) => setShowProfessionalLinks(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-medium text-navy">
                {dict.profile.showLinksLabel}
              </span>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {dict.profile.showLinksHint}
              </span>
            </span>
          </label>
        </section>

        <button
          type="submit"
          disabled={isSaving}
          className="border border-navy bg-navy px-7 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? dict.profile.savingButton : dict.profile.saveButton}
        </button>
      </form>
    </div>
  );
}
