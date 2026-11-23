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
    dashboard: string;
    logout: string;
    loading: string;
    backToHome: string;
  };
  nav: {
    home: string;
    network: string;
    events: string;
    about: string;
    openMenu: string;
    closeMenu: string;
  };
  landing: {
    eyebrow: string;
    headline: string;
    lead: string;
    primaryCta: string;
    secondaryCta: string;
    exploreLink: string;
    bridge: {
      studentTitle: string;
      studentBody: string;
      alumniTitle: string;
      alumniBody: string;
    };
    heroVisual: {
      tag: string;
      title: string;
      subtitle: string;
      photoSlotCaption: string;
      items: Array<{
        index: string;
        title: string;
        detail: string;
      }>;
      footnote: string;
    };
    modulesHeading: string;
    modulesSubheading: string;
    modules: Array<{
      index: string;
      title: string;
      description: string;
    }>;
    processHeading: string;
    processSubheading: string;
    processSteps: Array<{
      step: string;
      title: string;
      description: string;
    }>;
    foundingHeading: string;
    foundingDescription: string;
    foundingGovernanceNote: string;
    communities: {
      yazekName: string;
      yazekRole: string;
      yazekDescription: string;
      yazekFocus: string;
      repName: string;
      repRole: string;
      repDescription: string;
      repFocus: string;
    };
    featuredEvent: {
      eyebrow: string;
      statusBadge: string;
      title: string;
      description: string;
      note: string;
      cta: string;
    };
    footer: {
      aboutText: string;
      navigationHeading: string;
      accountHeading: string;
      privacyHeading: string;
      kvkkLink: string;
      privacySummary: string;
      copyright: string;
    };
    footerNote: string;
  };
  kvkk: {
    eyebrow: string;
    title: string;
    intro: string;
    sections: Array<{
      title: string;
      body: string;
    }>;
  };
  auth: {
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordConfirmLabel: string;
    passwordHint: string;
    submitLoading: string;
    genericError: string;
    configMissingError: string;
    register: {
      eyebrow: string;
      title: string;
      subtitle: string;
      submitLabel: string;
      hasAccountPrompt: string;
      loginLinkLabel: string;
      personalEmailNote: string;
      successTitle: string;
      successBody: string;
      goToVerify: string;
    };
    login: {
      eyebrow: string;
      title: string;
      subtitle: string;
      submitLabel: string;
      noAccountPrompt: string;
      registerLinkLabel: string;
      invalidCredentials: string;
      emailNotConfirmed: string;
      callbackError: string;
      signoutError: string;
    };
    verify: {
      eyebrow: string;
      title: string;
      body: string;
      institutionalSeparationNote: string;
      resendButton: string;
      resendLoading: string;
      resendSuccess: string;
      resendMissingEmail: string;
      backToLogin: string;
      alreadyVerifiedTitle: string;
      alreadyVerifiedBody: string;
      goToDashboard: string;
    };
  };
  dashboard: {
    eyebrow: string;
    title: string;
    subtitle: string;
    accountSectionTitle: string;
    emailLabel: string;
    emailVerifiedLabel: string;
    emailVerifiedYes: string;
    emailVerifiedNo: string;
    supabaseIdLabel: string;
    apiStatusTitle: string;
    apiVerifiedText: string;
    apiUnavailableText: string;
    apiErrorBanner: string;
    institutionalStatusTitle: string;
    institutionalStatusBody: string;
  };
}
