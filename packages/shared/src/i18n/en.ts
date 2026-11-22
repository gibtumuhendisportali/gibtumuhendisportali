import type { Dictionary } from "./types";

/**
 * English dictionary scaffold for future multi-language support.
 */
export const en: Dictionary = {
  meta: {
    siteTitle: "GIBTU Engineering Portal",
    siteDescription:
      "Institutional student and alumni network for Gaziantep Islam Science and Technology University engineering community.",
  },
  common: {
    brandName: "GIBTU Engineering Portal",
    institutionNotice:
      "Exclusively for Gaziantep Islam Science and Technology University engineering students and alumni.",
    phaseZeroBadge: "Phase 0 — Architecture Foundation",
    login: "Sign In",
    register: "Register",
    loading: "Loading...",
  },
  landing: {
    eyebrow: "Institutional Student & Alumni Network",
    headline: "Bringing engineering knowledge together in a lasting network.",
    lead: "GIBTU Engineering Portal is a long-term engineering platform connecting students and alumni under a verified roof, supporting technical events and professional communication.",
    foundingHeading: "Founding Student Communities",
    foundingDescription:
      "Initiated by two founding student societies with the long-term vision of becoming the university's permanent engineering alumni network.",
    communities: {
      yazekName: "YAZEK",
      yazekDescription: "Artificial Intelligence Society",
      repName: "REP",
      repDescription: "Robotics and Electronic Programming Society",
    },
    pillarsHeading: "Platform Principles",
    pillars: {
      directoryTitle: "Verified Membership & Directory",
      directoryBody:
        "Only administrator-verified GIBTU engineering students and alumni can access member directory and event features.",
      eventsTitle: "Events & QR Ticket Verification",
      eventsBody:
        "Capacity-safe event registration, digital ticket collection, and fast QR-based attendance verification.",
      privacyTitle: "KVKK-First Privacy Controls",
      privacyBody:
        "Member profiles are hidden from the directory by default, with separate visibility controls for contact details and professional links.",
    },
    footerNote:
      "GIBTU Engineering Portal — Founding Communities: YAZEK & REP. Phase 0 development skeleton.",
  },
};
