export type SupportedLocale = "tr" | "en";

export interface Dictionary {
  meta: {
    siteTitle: string;
    siteDescription: string;
  };
  common: {
    brandName: string;
    institutionNotice: string;
    phaseZeroBadge: string;
    login: string;
    register: string;
    loading: string;
  };
  landing: {
    eyebrow: string;
    headline: string;
    lead: string;
    foundingHeading: string;
    foundingDescription: string;
    communities: {
      yazekName: string;
      yazekDescription: string;
      repName: string;
      repDescription: string;
    };
    pillarsHeading: string;
    pillars: {
      directoryTitle: string;
      directoryBody: string;
      eventsTitle: string;
      eventsBody: string;
      privacyTitle: string;
      privacyBody: string;
    };
    footerNote: string;
  };
}
