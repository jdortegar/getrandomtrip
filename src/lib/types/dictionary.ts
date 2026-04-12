// ============================================================================
// Dictionary type – keep in sync with dictionaries/en.json and es.json
// ============================================================================

export interface LegalDocumentSection {
  listIntro?: string;
  listItems?: string[];
  paragraphs?: string[];
  title: string;
}

export interface LegalDocumentDict {
  contactBlock?: {
    after: string;
    before: string;
    linkLabel: string;
    title: string;
  };
  hero: {
    description: string;
    eyebrow: string;
    title: string;
  };
  meta: {
    description: string;
    openGraphDescription: string;
    openGraphTitle: string;
    title: string;
  };
  sections: LegalDocumentSection[];
}

export interface TripperBlogsDict {
  header: {
    title: string;
    description: string;
  };
  newPost: string;
  empty: {
    message: string;
    cta: string;
  };
  row: {
    edit: string;
    view: string;
    published: string;
    draft: string;
    updatedAt: string;
  };
}

export interface TripperDashboardDict {
  header: {
    title: string;
    description: string;
  };
  stats: {
    totalBookings: string;
    monthlyRevenue: string;
    averageRating: string;
    activePackages: string;
  };
  recentBookings: {
    title: string;
    viewAll: string;
    empty: string;
  };
  quickActions: {
    title: string;
    createPackage: string;
    createPackageSub: string;
    earnings: string;
    earningsSub: string;
    reviews: string;
    reviewsSub: string;
    blogs: string;
    blogsSub: string;
    settings: string;
    settingsSub: string;
  };
  keyMetrics: {
    title: string;
    totalClients: string;
    conversionRate: string;
    growth: string;
  };
  packages: {
    title: string;
    newPackage: string;
    empty: string;
    emptyCta: string;
    viewAll: string;
  };
  status: {
    confirmed: string;
    revealed: string;
    completed: string;
    pending: string;
  };
}

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
  navbarProfile: {
    adminDashboard: string;
    ariaOpenProfileMenu: string;
    dashboard: string;
    editProfile: string;
    signOut: string;
    tripperOs: string;
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
    forgotPasswordSubject: string;
    forgotPasswordBody: string;
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
      addonsComingSoon: string;
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
      viewCheckout: string;
      viewSummary?: string;
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
    preferencesStep: {
      addonsClearButton: string;
      addonsEmptyMessage: string;
      addonsHint: string;
      addonsLabel: string;
      addonsPlaceholder: string;
      addonsSaveButton: string;
      filterOptions: {
        accommodationType: {
          label: string;
          options: Array<{ key: string; label: string; tooltip?: string }>;
        };
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
        avoidSearchModal: {
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
        filterOptions: {
          accommodationType: {
            label: string;
            options: Array<{ key: string; label: string; tooltip?: string }>;
          };
          arrivePref: { label: string; options: Array<{ key: string; label: string }> };
          climate: { label: string; options: Array<{ key: string; label: string }> };
          departPref: { label: string; options: Array<{ key: string; label: string }> };
          maxTravelTime: { label: string; options: Array<{ key: string; label: string }> };
          transport: { label: string; options: Array<{ key: string; label: string }> };
        };
        importantNote1: string;
        importantNote2: string;
        importantNote3: string;
        importantNote4: string;
        importantTitle: string;
        maxTravelTimeLabel: string;
        saveFiltersButton: string;
      };
      filtersSummaryAccommodation: string;
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
      emptyValue: string;
      experiencePerPerson: string;
      experienceSection: string;
      excuseSection: string;
      favoriteAmongTravelers: string;
      filterLabelAccommodation: string;
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
    checkout: {
      backToEdit: string;
      continueToPayment: string;
      contactCityLabel: string;
      contactCountryLabel: string;
      contactEmailHelper: string;
      contactEmailLabel: string;
      contactIdDocumentLabel: string;
      contactNameLabel: string;
      contactPhoneLabel: string;
      contactStateLabel: string;
      contactStreetLabel: string;
      contactTitle: string;
      contactZipCodeLabel: string;
      errors: {
        connectionTryAgain: string;
        idDocumentRequired: string;
        loadTripFailed: string;
        loadTripsFailed: string;
        noTripFound: string;
        noTripToContinue: string;
        noValidSession: string;
        saveUserFailed: string;
        updateTripFailed: string;
      };
      addonsPerPersonLabel: string;
      filterFeeLabel: string;
      filterFeeLine: string;
      filterFeeLineFirstFree: string;
      filterFeeLineNone: string;
      filterFeePaxLine: string;
      formDescription: string;
      formTitle: string;
      itemsDescription: string;
      itemsTitle: string;
      loginToContinue: string;
      payButton: string;
      payProcessingButton: string;
      paxLabel: string;
      paxSelectAria: string;
      perPersonSectionTitle: string;
      processingPayment: string;
      summaryHeroPriceCaption: string;
      subtotalLabel: string;
      subtotalPerPersonLabel: string;
      totalLabel: string;
      travelDetailsTitle: string;
      travelersAdultsMany: string;
      travelersAdultsOne: string;
      travelersBreakdownSeparator: string;
      travelersMany: string;
      travelersMinorsMany: string;
      travelersMinorsOne: string;
      travelersModalAriaDecreaseAdults: string;
      travelersModalAriaDecreaseMinors: string;
      travelersModalAriaDecreaseRooms: string;
      travelersModalAdults: string;
      travelersModalDone: string;
      travelersModalMinors: string;
      travelersModalRooms: string;
      travelersModalAriaIncreaseAdults: string;
      travelersModalAriaIncreaseMinors: string;
      travelersModalAriaIncreaseRooms: string;
      travelersOne: string;
      travelersRoomsMany: string;
      travelersRoomsOne: string;
      travelersTileTitle: string;
      travelTypeTitleSeparator: string;
      volverButton: string;
    };
    userBadge: {
      guest: string;
      levelLabel: string;
      levels: {
        adventurer: string;
        beginner: string;
        explorer: string;
        nomad: string;
        randomtripper: string;
      };
    };
    userNamePlaceholder: string;
  };
  confirmation: {
    hero: {
      description: string;
      subtitle: string;
      title: string;
    };
    page: {
      body: string;
      ctaBackToJourney: string;
      ctaHome: string;
      ctaMyTrips: string;
      ctaReveal: string;
      errorTitle: string;
      messageApproved: string;
      messageGeneric: string;
      messagePending: string;
      metaDescription: string;
      retry: string;
      title: string;
    };
  };
  paymentFailure: {
    body: string;
    ctaBackToJourney: string;
    ctaHome: string;
    ctaMyTrips: string;
    ctaTryAgain: string;
    metaDescription: string;
    mpCollectionId: string;
    mpCollectionStatus: string;
    mpDetailsTitle: string;
    mpExternalReference: string;
    mpMerchantAccountId: string;
    mpMerchantOrderId: string;
    mpPaymentId: string;
    mpPaymentType: string;
    mpPreferenceId: string;
    mpProcessingMode: string;
    mpSiteId: string;
    mpStatus: string;
    subtitle: string;
    title: string;
  };
  paymentPending: {
    body: string;
    ctaBackToJourney: string;
    ctaHome: string;
    ctaMyTrips: string;
    metaDescription: string;
    subtitle: string;
    title: string;
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
  emailSignatures: {
    copiedToast: string;
    copyButton: string;
    copyErrorToast: string;
    copyOption1AriaLabel: string;
    copyOption2AriaLabel: string;
    hero: {
      description: string;
      eyebrow: string;
      title: string;
    };
    introParagraphs: string[];
    meta: {
      description: string;
      openGraphDescription: string;
      openGraphTitle: string;
      title: string;
    };
    option1Description: string;
    option1Title: string;
    option2Description: string;
    option2Title: string;
    previewHeading: string;
  };
  legalCookies: LegalDocumentDict;
  legalPrivacy: LegalDocumentDict;
  legalRefund: LegalDocumentDict;
  legalTerms: LegalDocumentDict;
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
  profile: {
    actionsAria: string;
    buttons: {
      cancel: string;
      editDetails: string;
      editProfile: string;
      modalCancel: string;
      modalSave: string;
      saveChanges: string;
      tripperProfile: string;
    };
    header: {
      badgeActiveTraveler: string;
      emailFallback: string;
      userFallback: string;
    };
    hero: {
      subtitle: string;
      title: string;
    };
    labels: {
      city: string;
      country: string;
      dislikes: string;
      email: string;
      interests: string;
      memberSince: string;
      name: string;
      phone: string;
      state: string;
      street: string;
      travelerType: string;
      zipCode: string;
    };
    modal: {
      confirmPassword: string;
      currentPassword: string;
      dislikes: string;
      dislikesPlaceholder: string;
      emailPlaceholder: string;
      interests: string;
      interestsPlaceholder: string;
      namePlaceholder: string;
      newPassword: string;
      passwordPlaceholder: string;
      tabPersonal: string;
      tabPreferences: string;
      tabSecurity: string;
      title: string;
      travelerType: string;
    };
    personalSectionTitle: string;
    preferencesSectionTitle: string;
    toasts: {
      nameRequired: string;
      passwordError: string;
      passwordMinLength: string;
      passwordUpdated: string;
      passwordsMismatch: string;
      personalError: string;
      personalUpdated: string;
      preferencesError: string;
      preferencesUpdated: string;
      profileUpdated: string;
      saveError: string;
    };
    travelerTypes: {
      couple: string;
      family: string;
      group: string;
      honeymoon: string;
      paws: string;
      selectPlaceholder: string;
      solo: string;
    };
  };
  adminTripEditModal: {
    cancel: string;
    deleteCancel: string;
    deleteConfirm: string;
    deleteDeleting: string;
    deleteError: string;
    deleteHint: string;
    deleteTrip: string;
    description: string;
    destinationHelp: string;
    destinationLabel: string;
    destinationPlaceholder: string;
    details: {
      dates: string;
      nightsPax: string;
      origin: string;
      payment: string;
      transport: string;
    };
    saveChanges: string;
    saving: string;
    sectionDanger: string;
    sectionManageTrip: string;
    sectionSummary: string;
    sectionTimeline: string;
    statusLabel: string;
    title: string;
    tripStatus: {
      CANCELLED: string;
      COMPLETED: string;
      CONFIRMED: string;
      DRAFT: string;
      PENDING_PAYMENT: string;
      REVEALED: string;
      SAVED: string;
    };
  };
  tripperBlogs: TripperBlogsDict;
  tripperDashboard: TripperDashboardDict;
}
