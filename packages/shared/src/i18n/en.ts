import type { Dictionary } from "./types";

/**
 * English dictionary scaffold for future multi-language support.
 */
export const en: Dictionary = {
  meta: {
    siteTitle: "GIBTU Engineering Portal",
    siteDescription:
      "Institutional student and alumni network, events, and digital ticketing portal for Gaziantep Islam Science and Technology University engineering community.",
  },
  common: {
    brandName: "GIBTU Engineering Portal",
    institutionNotice:
      "Exclusively for Gaziantep Islam Science and Technology University engineering students and alumni.",
    phaseZeroBadge: "Institutional Network",
    login: "Sign In",
    register: "Register",
    dashboard: "Dashboard",
    logout: "Sign Out",
    loading: "Loading...",
    backToHome: "Back to Home",
  },
  nav: {
    home: "Home",
    network: "Alumni Network",
    events: "Events",
    about: "About",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  landing: {
    eyebrow: "Gaziantep Islam Science and Technology University • Engineering",
    headline: "Connect in engineering, advance together.",
    lead: "GIBTU Engineering Portal is a long-term institutional network uniting engineering students and alumni under one verified roof, sustaining technical events and professional collaboration.",
    primaryCta: "Register",
    secondaryCta: "Sign In",
    exploreLink: "Explore portal structure",
    bridge: {
      studentTitle: "For Students",
      studentBody:
        "Technical events, alumni perspective, and organized society announcements.",
      alumniTitle: "For Alumni",
      alumniBody:
        "Verified institutional network, cohort connections, and privacy-controlled directory.",
    },
    heroVisual: {
      tag: "INSTITUTIONAL ARCHITECTURE",
      title: "GIBTU Engineering Network",
      subtitle: "A lasting digital structure for campus life and alumni experience.",
      photoSlotCaption: "Campus & engineering life photography frame",
      items: [
        {
          index: "01",
          title: "Membership Verification",
          detail: "Personal email registration paired with administrator approval.",
        },
        {
          index: "02",
          title: "Alumni & Student Directory",
          detail: "Hidden by default, with member-controlled visibility settings.",
        },
        {
          index: "03",
          title: "Events & QR Ticketing",
          detail: "Capacity-safe registration, digital passes, and fast check-in.",
        },
      ],
      footnote: "Founding Contribution: YAZEK & REP",
    },
    modulesHeading: "Portal Modules",
    modulesSubheading:
      "Core modules designed cleanly and sustainably for GIBTU engineering students and alumni.",
    modules: [
      {
        index: "01",
        title: "Alumni & Student Network",
        description:
          "Structured connections across departments and cohorts among verified members, with granular privacy controls for contact details and links.",
      },
      {
        index: "02",
        title: "Events",
        description:
          "Centralized announcements, capacity-enforced registrations, and organized schedules for technical seminars, workshops, and alumni gatherings.",
      },
      {
        index: "03",
        title: "QR Tickets & Attendance History",
        description:
          "Cryptographically verified digital tickets for confirmed registrations, rapid QR check-in at venues, and personal attendance history.",
      },
    ],
    processHeading: "Membership Process",
    processSubheading:
      "Access is restricted exclusively to verified GIBTU engineering students and alumni.",
    processSteps: [
      {
        step: "Step 01",
        title: "Create an account",
        description:
          "Register with any personal email address and confirm your inbox via the verification link.",
      },
      {
        step: "Step 02",
        title: "Complete student or alumni verification",
        description:
          "Portal administrators review your request to confirm GIBTU engineering student or alumni eligibility.",
      },
      {
        step: "Step 03",
        title: "Access member features",
        description:
          "Once approved, explore the directory, register for engineering events, and manage your QR tickets.",
      },
    ],
    foundingHeading: "Founding Contributing Communities",
    foundingDescription:
      "Initiated through the founding contributions of two student societies toward a permanent university engineering alumni network.",
    foundingGovernanceNote:
      "YAZEK and REP are founding contributing societies; the portal is structured as a shared institutional network belonging to all GIBTU engineering students and alumni.",
    communities: {
      yazekName: "YAZEK",
      yazekRole: "Founding Contributing Society",
      yazekDescription: "Artificial Intelligence Society",
      yazekFocus:
        "Contributes to the network through technical sessions and knowledge sharing in artificial intelligence, data science, and software engineering.",
      repName: "REP",
      repRole: "Founding Contributing Society",
      repDescription: "Robotics and Electronic Programming Society",
      repFocus:
        "Supports the engineering ecosystem through hands-on workshops and projects in robotics, embedded systems, and electronics.",
    },
    featuredEvent: {
      eyebrow: "Upcoming Gathering",
      statusBadge: "In Preparation • Details Pending Confirmation",
      title: "December 3 — World Engineers Day",
      description:
        "Planning is underway for a gathering bringing together GIBTU engineering students and alumni on December 3, World Engineers Day.",
      note: "Unconfirmed details such as schedule, venue, speakers, and capacity are not published yet. Verified details will be announced on the portal once finalized.",
      cta: "Create Account for Announcements",
    },
    footer: {
      aboutText:
        "Institutional student and alumni network for Gaziantep Islam Science and Technology University engineering students and graduates.",
      navigationHeading: "Portal",
      accountHeading: "Membership",
      privacyHeading: "Privacy & KVKK",
      kvkkLink: "KVKK Disclosure & Privacy Principles",
      privacySummary:
        "Member profiles are hidden from the directory by default, with separate visibility controls for contact details and professional links.",
      copyright: "GIBTU Engineering Portal • Founding Contribution: YAZEK & REP",
    },
    footerNote:
      "GIBTU Engineering Portal — Founding Contribution: YAZEK & REP. Institutional Student & Alumni Network.",
  },
  kvkk: {
    eyebrow: "Privacy & Data Protection",
    title: "KVKK Disclosure & Privacy Principles",
    intro:
      "GIBTU Engineering Portal is designed around data minimization and explicit user control in alignment with Turkish Personal Data Protection Law No. 6698 (KVKK).",
    sections: [
      {
        title: "1. Data Minimization",
        body: "Only data necessary for authentication, institutional eligibility review, alumni directory networking, and event ticketing is processed.",
      },
      {
        title: "2. Directory Privacy & Visibility Controls",
        body: "Verified member profiles are hidden in the directory by default. Members independently control directory visibility, contact details, and professional links.",
      },
      {
        title: "3. Separation of Disclosure and Explicit Consent",
        body: "KVKK disclosure notices and optional explicit consent records are separated technically and legally.",
      },
    ],
  },
  auth: {
    emailLabel: "Email Address",
    emailPlaceholder: "example@email.com",
    passwordLabel: "Password",
    passwordConfirmLabel: "Confirm Password",
    passwordHint: "Must be at least 8 characters and include a letter and a number.",
    submitLoading: "Processing...",
    genericError: "An error occurred. Please try again.",
    configMissingError:
      "Authentication configuration is missing. Check environment variables.",
    register: {
      eyebrow: "Membership Registration",
      title: "Create Portal Account",
      subtitle:
        "You may register with any personal email address. A university email is not required.",
      submitLabel: "Register",
      hasAccountPrompt: "Already have an account?",
      loginLinkLabel: "Sign In",
      personalEmailNote:
        "Email verification only confirms ownership of your email address. GIBTU student or alumni verification will be handled separately by administrator review.",
      successTitle: "Verification Email Sent",
      successBody:
        "Your registration has been received. Click the verification link sent to your inbox to activate your account.",
      goToVerify: "Go to Verification Guide",
    },
    login: {
      eyebrow: "Sign In",
      title: "Sign In to Portal",
      subtitle: "Sign in with your registered email address and password.",
      submitLabel: "Sign In",
      noAccountPrompt: "Don't have an account yet?",
      registerLinkLabel: "Register",
      invalidCredentials: "Invalid email address or password.",
      emailNotConfirmed:
        "Your email address is not verified yet. Please click the verification link in your inbox.",
      callbackError:
        "The verification link is invalid or has expired. Please try again.",
      signoutError:
        "Could not reach the authentication server during sign-out; local session cookies on this device were cleared.",
    },
    verify: {
      eyebrow: "Email Verification",
      title: "Verify Your Email Address",
      body: "To sign in securely, please confirm the verification link sent to your email address.",
      institutionalSeparationNote:
        "Note: Email verification does not prove GIBTU student or alumni status. Institutional verification is managed separately.",
      resendButton: "Resend Verification Email",
      resendLoading: "Sending...",
      resendSuccess:
        "If this email is registered and unverified, a new verification link has been sent.",
      resendMissingEmail: "Enter your email address to resend the link.",
      backToLogin: "Back to Sign In",
      alreadyVerifiedTitle: "Email Verified",
      alreadyVerifiedBody: "Your session is active. You can continue to the dashboard.",
      goToDashboard: "Go to Dashboard",
    },
  },
  dashboard: {
    eyebrow: "Member Dashboard",
    title: "Welcome",
    subtitle: "Your authentication session is active.",
    accountSectionTitle: "Identity & Session Details",
    emailLabel: "Email",
    emailVerifiedLabel: "Email Verification Status",
    emailVerifiedYes: "Verified",
    emailVerifiedNo: "Unverified",
    supabaseIdLabel: "Identity Provider Reference",
    apiStatusTitle: "API Session Verification",
    apiVerifiedText: "JWT signature verified via Cloudflare Workers API.",
    apiUnavailableText: "API session verification could not be completed.",
    apiErrorBanner:
      "API session verification is currently unavailable. Please try again later or sign in again.",
    institutionalStatusTitle: "Institutional Membership Status",
    institutionalStatusBody:
      "GIBTU student/alumni verification and profile management are active.",
    statusPendingTitle: "Application Under Review",
    statusPendingBody:
      "Your application has been received. Member-only directory and event features remain restricted until an administrator verifies your GIBTU engineering status.",
    statusRejectedTitle: "Application Not Approved",
    statusRejectedBody:
      "Your membership application was not approved during administrator review.",
    statusVerifiedTitle: "Verified GIBTU Engineering Member",
    statusVerifiedBody:
      "Your institutional membership is verified. Your profile remains hidden in the directory by default.",
    profileSummaryTitle: "Application & Profile Summary",
    fullNameLabel: "Full Name",
    userTypeLabel: "Member Type",
    userTypeStudent: "Student",
    userTypeAlumni: "Alumni",
    departmentLabel: "Engineering Department",
    entryYearLabel: "Entry Year",
    graduationYearLabel: "Graduation Year",
    directoryPrivacyLabel: "Directory Visibility",
    directoryHiddenText: "Hidden (Default — opt-in only)",
    directoryVisibleText: "Visible in Directory",
    adminQueueLink: "Admin Verification Queue",
    editProfileLink: "Edit Profile",
    directoryLink: "Alumni & Student Directory",
    eventsLink: "Events",
    ticketsLink: "My Tickets",
    checkInLink: "QR Check-In",
  },
  events: {
    eyebrow: "Engineering Events",
    title: "Events & Registration",
    subtitle:
      "Technical seminars, workshops, and gatherings for GIBTU engineering students and alumni.",
    backToDashboard: "Back to Dashboard",
    emptyState: "There are no published events right now.",
    platformWideLabel: "Platform-Wide",
    capacityLabel: "Capacity",
    registerButton: "Register & Get Ticket",
    registeringButton: "Registering...",
    cancelButton: "Cancel Registration",
    cancellingButton: "Cancelling...",
    fullBadge: "Full",
    registeredBadge: "Registered",
    checkedInBadge: "Checked In",
    viewTicketLink: "View My QR Ticket",
    createSectionTitle: "Create New Event",
    titleLabel: "Event Title",
    descriptionLabel: "Description",
    communityLabel: "Organizer Scope",
    locationLabel: "Location / Hall",
    startsAtLabel: "Start Date & Time",
    endsAtLabel: "End Date & Time",
    capacityInputLabel: "Capacity",
    createButton: "Publish Event",
    creatingButton: "Publishing...",
    createSuccess: "Event created.",
    registerSuccess: "Your registration is confirmed and your QR ticket has been issued.",
    cancelSuccess: "Your registration was cancelled.",
  },
  tickets: {
    eyebrow: "Digital Ticket Wallet",
    title: "My Tickets & Event History",
    subtitle:
      "Your cryptographically secured QR tickets and personal event attendance history.",
    backToDashboard: "Back to Dashboard",
    emptyState: "You do not have any event tickets yet.",
    statusActive: "Active Ticket",
    statusCheckedIn: "Checked In",
    statusCancelled: "Cancelled",
    qrHint: "Present this QR code to the event organizer at entry.",
    checkedInAtLabel: "Checked In At",
    tokenCopyLabel: "Ticket Token",
  },
  checkIn: {
    eyebrow: "Event Entry Verification",
    title: "QR Ticket Check-In",
    subtitle:
      "Verify attendee QR tickets for events you are authorized to manage.",
    backToDashboard: "Back to Dashboard",
    selectEventLabel: "Select Event",
    noManageableEvents: "There are no published events you are authorized to check in.",
    tokenInputLabel: "QR Ticket Token",
    tokenInputPlaceholder: "Scan or paste QR ticket token",
    verifyButton: "Verify Check-In",
    verifyingButton: "Verifying...",
    cameraScanButton: "Scan QR with Camera",
    cameraStopButton: "Stop Camera",
    cameraUnsupported:
      "Built-in camera QR scanning is not supported in this browser; use a USB scanner or manual token input.",
    checkedInSuccess: "Attendance verified successfully.",
    alreadyCheckedInNotice: "This ticket was already checked in.",
  },
  profile: {
    eyebrow: "Member Profile & Privacy",
    title: "Your Professional Profile",
    subtitle:
      "Update your professional information and independently control what appears in the member directory.",
    backToDashboard: "Back to Dashboard",
    avatarSectionTitle: "Profile Photo",
    avatarHint: "Upload a JPEG, PNG, or WebP image up to 2 MB.",
    avatarUploadButton: "Upload Photo",
    avatarRemoveButton: "Remove Photo",
    avatarUploading: "Uploading...",
    avatarSuccess: "Profile photo updated.",
    avatarRemoved: "Profile photo removed.",
    basicSectionTitle: "Professional Details",
    fullNameLabel: "Full Name",
    headlineLabel: "Headline",
    headlinePlaceholder: "e.g. Embedded Systems Engineer or 3rd Year Student",
    companyLabel: "Company / Organization",
    cityLabel: "City",
    bioLabel: "Short Bio",
    skillsLabel: "Skills (comma-separated)",
    skillsHint: "Up to 12 skills (e.g. Python, ROS2, Embedded C).",
    contactLinksSectionTitle: "Contact & Professional Links",
    contactEmailLabel: "Contact Email (Optional)",
    linkedinLabel: "LinkedIn URL (https://...)",
    githubLabel: "GitHub URL (https://...)",
    websiteLabel: "Website URL (https://...)",
    privacySectionTitle: "KVKK Directory Privacy Controls",
    directoryVisibleLabel: "Make my profile visible in the member directory",
    directoryVisibleHint:
      "When off, only you and platform administrators can see your profile.",
    showContactLabel: "Show my contact email in the directory",
    showContactHint:
      "Only verified members can view your contact email when enabled.",
    showLinksLabel: "Show LinkedIn, GitHub, and website in the directory",
    showLinksHint:
      "When off, your links remain saved but are not shared in the directory.",
    saveButton: "Save Changes",
    savingButton: "Saving...",
    saveSuccess: "Your profile and privacy settings were saved.",
  },
  directory: {
    eyebrow: "Verified Member Network",
    title: "Alumni & Student Directory",
    subtitle:
      "Lists only administrator-verified GIBTU engineering students and alumni who opted in to directory visibility.",
    backToDashboard: "Back to Dashboard",
    searchPlaceholder: "Search by name, headline, company, or skill...",
    allTypesOption: "All Members",
    allDepartmentsOption: "All Departments",
    filterButton: "Filter",
    emptyState: "No visible members matched your filters.",
    totalResultsPrefix: "Total",
    totalResultsSuffix: "visible members",
    prevPage: "Previous",
    nextPage: "Next",
    contactLabel: "Contact",
    linksLabel: "Links",
  },
  onboarding: {
    eyebrow: "Institutional Membership Application",
    title: "Complete Your Student or Alumni Details",
    subtitle:
      "Your email is verified. Provide your academic details below to submit your GIBTU Engineering Portal membership for administrator review.",
    fullNameLabel: "Full Name",
    userTypeLabel: "Status",
    studentOption: "GIBTU Engineering Student",
    alumniOption: "GIBTU Engineering Alumni",
    departmentLabel: "Department",
    entryYearLabel: "Entry Year",
    graduationYearLabel: "Graduation Year",
    verificationNoteLabel: "Verification Note (Optional)",
    verificationNoteHint:
      "Optionally add brief context to assist administrator review.",
    kvkkDisclosureLabel:
      "I have read the KVKK Disclosure Notice and acknowledge the processing of my data for membership verification.",
    kvkkExplicitLabel:
      "Optional: I acknowledge the explicit consent terms for sharing selected profile fields with verified members when enabled by me.",
    kvkkLinkText: "KVKK Disclosure & Privacy Principles",
    submitButton: "Submit Application",
    submittingButton: "Submitting...",
    privacyDefaultNote:
      "Note: Your profile is hidden in the directory by default.",
  },
  adminVerifications: {
    eyebrow: "Platform Administration",
    title: "Member Verification Queue",
    subtitle:
      "Review pending GIBTU engineering student and alumni applications.",
    backToDashboard: "Back to Dashboard",
    emptyQueue: "There are no pending applications.",
    approveButton: "Approve",
    rejectButton: "Reject",
    rejectionReasonPlaceholder: "Rejection reason (at least 5 characters)",
    confirmRejectButton: "Save Rejection",
    cancelButton: "Cancel",
    decisionSuccess: "Decision recorded.",
    decisionError: "Failed to save decision.",
  },
};
