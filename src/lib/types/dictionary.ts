// ============================================================================
// Dictionary type – keep in sync with dictionaries/en.json and es.json
// ============================================================================

export interface MarketingDictionary {
  nav: {
    ariaLabelBitacoras: string;
    ariaLabelInspiration: string;
    ariaLabelLogo: string;
    ariaLabelNosotros: string;
    ariaLabelTripbuddy: string;
    ariaLabelTrippers: string;
    labelBitacoras: string;
    labelInspiration: string;
    labelNosotros: string;
    labelTrippers: string;
    labelTripbuddy: string;
    openMenu: string;
    search: string;
    selectLanguage: string;
    signIn: string;
    whatsApp: string;
  };
  common: {
    siteName: string;
  };
  auth: {
    close: string;
    continueWithGoogle: string;
    createAccount: string;
    createAccountSubtitle: string;
    email: string;
    emailPlaceholder: string;
    fillAllFields: string;
    invalidEmail: string;
    loginFailed: string;
    loginSubtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    nameRequired: string;
    orContinueWith: string;
    password: string;
    passwordMinLength: string;
    signIn: string;
    signUp: string;
    noAccount: string;
    haveAccount: string;
    loading: string;
  };
  home: {
    benefitsSteps: Array<{ description: string; imageAlt: string; title: string }>;
    blogCarouselSlideAriaLabel: string;
    blogEyebrow: string;
    explorationButtonTrippers: string;
    explorationComingSoon: string;
    explorationEyebrow: string;
    explorationSubtitle: string;
    explorationTabs: Array<{ href?: string; id: string; label: string }>;
    explorationTitle: string;
    explorationTravelerTypes: Array<{
      description: string;
      key: string;
      title: string;
    }>;
    blogSubtitle: string;
    blogTitle: string;
    blogViewAllSubtitle: string;
    blogViewAllTitle: string;
    heroBrandingRepeatText: string;
    heroBrandingText: string;
    heroPrimaryCtaAriaLabel: string;
    heroPrimaryCtaText: string;
    heroScrollText: string;
    heroSubtitle: string;
    heroTitle: string;
    homeInfoCtaText: string;
    homeInfoEyebrow: string;
    homeInfoSectionAriaLabel: string;
    homeInfoTabBenefits: string;
    homeInfoTabHow: string;
    homeInfoTitle: string;
    howItWorksNote: string;
    howItWorksSteps: Array<{ description: string; imageAlt: string; title: string }>;
    howItWorksSubtitle: string;
    howItWorksTitle: string;
    testimonialsEyebrow: string;
    testimonialsSubtitle: string;
    testimonialsTitle: string;
    testimonialsViewFullReview: string;
  };
  footer: {
    ariaFacebook: string;
    ariaInstagram: string;
    ariaTwitter: string;
    contact: string;
    contactTitle: string;
    cookiePolicy: string;
    copyright: string;
    faq: string;
    group: string;
    family: string;
    honeymoon: string;
    howItWorks: string;
    inspiration: string;
    legalTitle: string;
    about: string;
    paws: string;
    privacyPolicy: string;
    quickLinksTitle: string;
    refundPolicy: string;
    solo: string;
    couple: string;
    support: string;
    tagline: string;
    termsOfService: string;
    travelersTitle: string;
  };
}
