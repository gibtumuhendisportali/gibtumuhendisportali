export const USER_ROLES = ["member", "platform_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_TYPES = ["student", "alumni"] as const;
export type UserType = (typeof USER_TYPES)[number];

export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "suspended",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/**
 * Founding communities that initiated the portal.
 * Modeled as community entities rather than permanent platform owners.
 */
export const FOUNDING_COMMUNITIES = ["YAZEK", "REP"] as const;
export type FoundingCommunity = (typeof FOUNDING_COMMUNITIES)[number];

export const COMMUNITY_ROLES = ["manager", "organizer"] as const;
export type CommunityRole = (typeof COMMUNITY_ROLES)[number];

export const EVENT_STATUSES = ["draft", "published", "cancelled", "completed"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const TICKET_STATUSES = ["active", "checked_in", "cancelled"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const CONSENT_TYPES = [
  "kvkk_disclosure_ack",
  "kvkk_explicit_consent",
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
