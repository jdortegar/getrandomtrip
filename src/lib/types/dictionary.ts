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
    hero: {
      branding: { repeatText?: string; text: string };
      fallbackImage: string;
      primaryCta: { ariaLabel: string; href: string; text: string };
      scrollText: string;
      subtitle: string;
      title: string;
      videoSrc: string;
    };
    homeInfo: {
      benefitsSteps: Array<{ description: string; imageAlt: string; imageSrc: string; title: string }>;
      ctaScrollTarget: string;
      ctaText: string;
      eyebrow: string;
      howItWorksSteps: Array<{ description: string; imageAlt: string; imageSrc: string; title: string }>;
      sectionAriaLabel: string;
      tabBenefitsLabel: string;
      tabHowLabel: string;
      title: string;
    };
    exploration: {
      buttonTrippers: string;
      carousel: {
        ariaLabelNext: string;
        ariaLabelPrev: string;
        ariaLabelSlide: string;
      };
      comingSoonText: string;
      eyebrow: string;
      subtitle: string;
      tabs: Array<{
        disabled?: boolean;
        href?: string;
        id: string;
        label: string;
      }>;
      title: string;
      travelerTypes: Array<{ description: string; key: string; title: string }>;
      trippersHref: string;
    };
    blog: {
      carouselSlideAriaLabel: string;
      eyebrow: string;
      subtitle: string;
      title: string;
      viewAll: { href: string; subtitle: string; title: string };
    };
    testimonials: {
      eyebrow: string;
      subtitle: string;
      title: string;
      viewFullReviewLabel: string;
    };
  };
  experiences: {
    hero: {
      branding: { repeatText?: string; text: string };
      fallbackImage: string;
      primaryCta: { ariaLabel: string; href: string; text: string };
      scrollText: string;
      subtitle: string;
      title: string;
      videoSrc: string;
    };
    travelTypeEyebrow: string;
    travelTypeSubtitle: string;
    travelTypeTitle: string;
  };
  trippers: {
    hero: {
      description: string;
      subtitle: string;
      title: string;
      videoSrc: string;
    };
  };
  blogPage: {
    backToProfile: string;
    emptySubtitle: string;
    emptyTitle: string;
    filters: {
      allOption: string;
      excuseLabel: string;
      excuseSubtitle: string;
      travelTypeLabel: string;
      travelTypeSubtitle: string;
      tripperLabel: string;
      tripperSubtitle: string;
    };
    heroDescription: string;
    heroTitleByTripper: string;
    heroTitleDefault: string;
    seenAll: string;
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
    /** Localized addon copy keyed by addon id. When present, overrides catalog title/descriptions. */
    addons?: Record<
      string,
      {
        category: string;
        longDescription: string;
        shortDescription: string;
        title: string;
      }
   >;
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
      customTripNoExcuseMessage: string;
      excuseLabel: string;
      excusePlaceholder: string;
      excuseCardCta: string;
      excuseStepDescription: string;
      experienceLabel: string;
      experiencePlaceholder: string;
      experienceStepDescription: string;
      extrasTabDescription: string;
      extrasTabTitle: string;
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
    detailsStep?: {
      cityLabel: string;
      cityPlaceholder: string;
      countryLabel: string;
      countryPlaceholder: string;
      datesLabel: string;
      datesPlaceholder: string;
      datesPicker?: {
        availableFromHint: string;
        clearAll: string;
        confirmDates: string;
        daysLabel: string;
        nightsLabel: string;
      };
      monthNames: string[];
      originLabel: string;
      originPlaceholder: string;
      transportLabel: string;
      transportPlaceholder: string;
      transportSelector?: {
        ariaPreferenceTemplate: string;
        hintOrder: string;
        hintTransfers: string;
        optionLabels: Record<string, string>;
      };
    };
    preferencesStep?: {
      addonsClearButton?: string;
      addonsEmptyMessage?: string;
      addonsHint?: string;
      addonsLabel: string;
      addonsPlaceholder: string;
      addonsSaveButton?: string;
      filterOptions?: {
        arrivePref: { label: string; options: Array<{ key: string; label: string }> };
        climate: { label: string; options: Array<{ key: string; label: string }> };
        departPref: { label: string; options: Array<{ key: string; label: string }> };
        maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
        transport: { label: string; options: Array<{ key: string; label: string }> };
      };
      filtersLabel: string;
      filtersForm: {
        arrivePrefLabel: string;
        avoidGridButton: string;
        avoidGridLoading: string;
        avoidHint: string;
        avoidLabel: string;
        avoidSearchModal?: {
          addButton: string;
          cancelButton: string;
          saveDestinationsButton: string;
          selectedCountTemplate: string;
          selectedDestinationsHeading: string;
          title: string;
        };
        clearButton: string;
        climateLabel: string;
        departPrefLabel: string;
        importantNote1?: string;
        importantNote2?: string;
        importantNote3?: string;
        importantNote4?: string;
        importantTitle?: string;
        maxTravelTimeLabel: string;
        saveFiltersButton: string;
      };
      filtersSummaryArrive: string;
      filtersSummaryClimate: string;
      filtersSummaryDefault: string;
      filtersSummaryDepart: string;
      filtersSummaryTime: string;
    };
    excuses: Array<{
      key: string;
      title: string;
      description: string;
    }>;
    /** Localized label/desc for each excuse's refine-detail options. Keyed by travelType then excuse key. */
    refineDetailOptions?: Record<
      string,
      Record<string, Array<{ key: string; label: string; desc: string }>>
    >;
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
      filterLabelAvoid: string;
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
  aboutUs: {
    cta: {
      buttonAriaLabel: string;
      buttonText: string;
      subtitle: string;
      title: string;
    };
    curators: {
      items: Array<{ bio: string; img: string; name: string; role: string }>;
      sectionTitle: string;
    };
    faq: {
      items: Array<{ a: string; q: string }>;
      sectionTitle: string;
    };
    founder: {
      imageAlt: string;
      p1: string;
      p2: string;
      sectionTitle: string;
    };
    hero: {
      ctaPhilosophy: string;
      ctaPrimary: string;
      ctaPrimaryAriaLabel: string;
      description: string;
      eyebrow: string;
      subtitle: string;
      title: string;
    };
    meta: {
      description: string;
      openGraphDescription: string;
      openGraphTitle: string;
      title: string;
    };
    philosophy: {
      imageAlt: string;
      p1: string;
      p2: string;
      pills: string[];
      sectionTitle: string;
    };
    steps: {
      items: Array<{ description: string; key: string; title: string }>;
      sectionTitle: string;
      stepLabel: string;
    };
    trust: {
      footnote: string;
      items: Array<{ label: string; value: string }>;
      sectionTitle: string;
    };
    valueProps: {
      items: Array<{ copy: string; title: string }>;
      sectionTitle: string;
    };
  };
  notFound: {
    contactUs: string;
    exploreSections: string;
    goHome: string;
    linkCouple: string;
    linkFamily: string;
    linkSolo: string;
    linkTrippers: string;
    metaDescription: string;
    metaTitle: string;
    needHelp: string;
    subtitle: string;
    tipLabel: string;
    tipText: string;
    title: string;
    viewPackages: string;
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
