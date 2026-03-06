// ============================================================================
// Dictionary type – keep in sync with dictionaries/en.json and es.json
// ============================================================================

export interface MarketingDictionary {
  nav: {
    ariaLabelBitacoras: string;
    ariaLabelExperiences: string;
    ariaLabelInspiration: string;
    ariaLabelLogo: string;
    ariaLabelNosotros: string;
    ariaLabelTripbuddy: string;
    ariaLabelTrippers: string;
    labelBitacoras: string;
    labelExperiences: string;
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
    explorationCarouselNextLabel: string;
    explorationCarouselPrevLabel: string;
    explorationCarouselSlideLabel: string;
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
  experiencias: {
    heroCtaAriaLabel: string;
    heroCtaText: string;
    heroSubtitle: string;
    heroTitle: string;
    travelTypeEyebrow: string;
    travelTypeSubtitle: string;
    travelTypeTitle: string;
  };
  packagesByType: {
    blogEyebrow: string;
    inspirationBanner: {
      buttonText: string;
      eyebrow: string;
      labelText: string;
      title: string;
    };
  };
  journey: {
    contentTabs: Array<{
      id: string;
      label: string;
      substeps: Array<{
        description: string;
        id: string;
        title: string;
      }>;
    }>;
    hero: {
      description: string;
      subtitle: string;
      title: string;
    };
    mainContent: {
      clearAll: string;
      completeBudgetAndExcuse: string;
      completeBudgetFirst: string;
      completeOriginFirst: string;
      excuseLabel: string;
      excusePlaceholder: string;
      excuseStepDescription: string;
      experienceLabel: string;
      experiencePlaceholder: string;
      experienceStepDescription: string;
      next: string;
      refineDetailsLabel: string;
      refineDetailsPlaceholder: string;
      refineDetailsOneSelected: string;
      refineDetailsCountSelected: string;
      refineDetailsStepDescription: string;
      travelTypeLabel: string;
      travelTypePlaceholder: string;
      viewSummary: string;
    };
    excuses: Array<{
      key: string;
      title: string;
      description: string;
    }>;
    summary: {
      add: string;
      addonRemoveAria: string;
      addonsSection: string;
      addonsSectionCount: string;
      change: string;
      dateRangeTemplate: string;
      datesSection: string;
      detailRemoveAria: string;
      detailsSection: string;
      edit: string;
      experiencePerPerson: string;
      experienceSection: string;
      excuseSection: string;
      favoriteAmongTravelers: string;
      filterLabelArrive: string;
      filterLabelClimate: string;
      filterLabelDepart: string;
      filterLabelTime: string;
      filterRemoveAria: string;
      filtersSection: string;
      filtersSectionCount: string;
      importantNote1: string;
      importantNote2: string;
      importantNote3: string;
      importantNote4: string;
      importantTitle: string;
      monthsShort: string[];
      noAddons: string;
      noDetails: string;
      noFilters: string;
      originSection: string;
      perPerson: string;
      totalUsd: string;
      travelTypeSection: string;
      transportSection: string;
      transportOptionalNote: string;
      title: string;
    };
    userNamePlaceholder: string;
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
  waitlist: {
    adminLoginLabel: string;
    emailPlaceholder: string;
    headline: string;
    lastNamePlaceholder: string;
    loginModal: {
      description: string;
      passwordPlaceholder: string;
      submitButton: string;
      title: string;
      usernamePlaceholder: string;
    };
    namePlaceholder: string;
    subheadline: string;
    submitButton: string;
    successMessage: string;
  };
}
