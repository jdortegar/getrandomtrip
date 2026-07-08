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

export interface TripperBlogComposerDict {
  addTagAria: string;
  audienceUnsetLabel: string;
  bodyLabel: string;
  bodyPlaceholder: string;
  breadcrumbCreate: string;
  breadcrumbEdit: string;
  createHero: {
    description: string;
    title: string;
  };
  cover: {
    hint: string;
    previewAlt: string;
    remove: string;
    title: string;
    upload: string;
    uploading: string;
  };
  gallery: {
    captionPlaceholder: string;
    hint: string;
    removeAria: string;
    title: string;
    upload: string;
    uploading: string;
  };
  editHero: {
    descriptionFallback: string;
    titleFallback: string;
  };
  editLoading: {
    description: string;
    title: string;
  };
  editNotFound: {
    backToList: string;
    descriptionFallback: string;
    title: string;
  };
  excuseKeyLabel: string;
  formatArticle: string;
  formatLabel: string;
  formatMixed: string;
  formatPhoto: string;
  formatVideo: string;
  preview: string;
  publish: string;
  publishing: string;
  save: string;
  saving: string;
  settingsTitle: string;
  statusDraft: string;
  statusLabel: string;
  statusPublished: string;
  subtitlePlaceholder: string;
  tagPlaceholder: string;
  tagsLabel: string;
  titlePlaceholder: string;
  toasts: {
    genericPublishError: string;
    genericSaveError: string;
    publishError: string;
    publishSuccess: string;
    saveError: string;
    saveSuccessCreate: string;
    saveSuccessEdit: string;
    titleRequired: string;
    uploadError: string;
    fileTooLarge: string;
  };
  travelTypeLabel: string;
  unsaved: string;
}

export interface TripperBlogsDict {
  composer: TripperBlogComposerDict;
  description: string;
  emptyState: {
    createFirst: string;
    noMatch: string;
    noPosts: string;
  };
  eyebrow: string;
  filters: {
    allFormats: string;
    allStatuses: string;
    allTravelTypes: string;
    clearFilters: string;
    count: string;
    of: string;
  };
  format: {
    article: string;
    mixed: string;
    photo: string;
    video: string;
  };
  newPost: string;
  previewPage: {
    backToEdit: string;
    banner: string;
    emptyBody: string;
    loadError: string;
  };
  status: {
    DRAFT: string;
    PUBLISHED: string;
  };
  table: {
    actions: string;
    delete: string;
    deleteConfirm: string;
    edit: string;
    format: string;
    post: string;
    publish: string;
    status: string;
    unpublish: string;
    updated: string;
    view: string;
  };
  title: string;
}

export interface TripperDashboardDict {
  header: {
    title: string;
    description: string;
  };
  pageHeadings: {
    dashboard: { title: string; description: string };
    experiences: { title: string; description: string };
    experiencesNew: { title: string; description: string };
    experiencesEdit: { title: string; description: string };
    earnings: { title: string; description: string };
    reviews: { title: string; description: string };
    blogs: { title: string; description: string };
    notifications: { title: string; description: string };
    newDrop: { title: string; description: string };
  };
  stats: {
    totalBookings: string;
    monthlyRevenue: string;
    averageRating: string;
    activeExperiences: string;
  };
  recentBookings: {
    title: string;
    viewAll: string;
    empty: string;
  };
  quickActions: {
    title: string;
    dashboard: string;
    experiences: string;
    experiencesSub: string;
    createExperience: string;
    createExperienceSub: string;
    earnings: string;
    earningsSub: string;
    reviews: string;
    reviewsSub: string;
    blogs: string;
    blogsSub: string;
    settings: string;
    settingsSub: string;
    notifications: string;
  };
  keyMetrics: {
    title: string;
    totalClients: string;
    conversionRate: string;
    growth: string;
    sectionEyebrow?: string;
    sectionTitle?: string;
  };
  experiences: {
    title: string;
    newExperience: string;
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
  settingsProfile: {
    eyebrow: string;
    heading: string;
    viewToggle: {
      prefix: string;
      traveler: string;
      tripper: string;
    };
    hero: {
      editProfile: string;
      cancel: string;
      save: string;
      saving: string;
      uploadHint: string;
      nameFallback: string;
      namePlaceholder: string;
      nicknameHint: string;
      locationPlaceholder: string;
      noLocation: string;
      statsExperiences: string;
      statsBookings: string;
      statsRating: string;
      reviewsSuffix: string;
      imageTooLarge: string;
      imageUploadError: string;
    };
    publicPresence: {
      eyebrow: string;
      heading: string;
      bioLabel: string;
      bioPlaceholder: string;
      bioEmpty: string;
      destinationsLabel: string;
      destinationsAddPlaceholder: string;
      travelerTypesLabel: string;
      travelerTypesHelper: string;
    };
    publicUrl: {
      eyebrow: string;
      heading: string;
      domainPrefix: string;
      slugPlaceholder: string;
      copyLink: string;
      copied: string;
      openLink: string;
    };
    account: {
      eyebrow: string;
      heading: string;
      emailLabel: string;
      tierLabel: string;
      commissionLabel: string;
      adminSet: string;
      commissionHelper: string;
    };
  };
}

export interface ClientDashboardDict {
  home: {
    eyebrow: string;
    heading: string;
  };
  nav: {
    dashboard: string;
    notifications: string;
    reviews: string;
    settings: string;
    trips: string;
  };
  pageHeadings: {
    dashboard: { description: string; title: string };
    notifications: { description: string; title: string };
    reviews: { description: string; title: string };
    settings: { description: string; title: string };
    trips: { description: string; title: string };
  };
  settingsProfile: {
    eyebrow: string;
    heading: string;
  };
  reviews: {
    description: string;
    emptyDescription: string;
    emptyTitle: string;
    eyebrow: string;
    kpis: {
      averageRating: string;
      totalReviewed: string;
    };
    listTitle: string;
    title: string;
  };
  trips: {
    description: string;
    eyebrow: string;
    filterAll: string;
    filterCompleted: string;
    filterUpcoming: string;
    of: string;
    title: string;
    tripsCount: string;
  };
}

export interface DashboardDict {
  allTrips: {
    emptyDestination: string;
    from: string;
    paidOn: string;
    title: string;
    totalLabel: string;
    viewMore: string;
  };
  common: {
    id: string;
    transactions: string;
  };
  financialSummary: {
    completedPayments: string;
    pendingPayments: string;
    title: string;
    totalSpent: string;
  };
  header: {
    description: string;
    helloFallbackName: string;
    helloPrefix: string;
  };
  paymentStatus: Record<string, string>;
  quickActions: {
    history: string;
    newTrip: string;
    profile: string;
    title: string;
  };
  recentPayments: {
    amount: string;
    date: string;
    empty: string;
    status: string;
    title: string;
    trip: string;
  };
  stats: {
    averageRating: string;
    totalSpent: string;
    totalTrips: string;
    upcomingTrips: string;
  };
  tripStatus: Record<string, string>;
  unpaidTrips: {
    action: string;
    bookingRefLabel: string;
    deleteAction: string;
    deleteConfirm: string;
    deleteFailed: string;
    editAction: string;
    estimatedTripTotal: string;
    experienceSection: string;
    message: string;
    paymentPrefix: string;
    priceEstimateNote: string;
    summaryHeroPriceCaption: string;
    title: string;
    travelTypeSection: string;
    travelTypeTitleSeparator: string;
  };
  upcomingTrips: {
    emptyCta: string;
    emptyMessage: string;
    emptyTitle: string;
    newTrip: string;
    title: string;
    viewDetails: string;
    revealCountdown: string;
    revealDestination: string;
  };
}

export interface TripperReviewsDict {
  title: string;
  eyebrow: string;
  description: string;
  kpis: {
    averageRating: string;
    detractorsCaption: string;
    nps: string;
    promoters: string;
    totalReviews: string;
  };
  list: {
    title: string;
  };
  emptyState: {
    description: string;
    title: string;
  };
}

export interface TripperEarningsDict {
  title: string;
  eyebrow: string;
  description: string;
  exportCsv: string;
  kpis: {
    bookings: string;
    currentCycle: string;
    pendingPayout: string;
    totalEarned: string;
  };
  status: {
    paid: string;
    pending: string;
    processing: string;
  };
  table: {
    base: string;
    bonus: string;
    bookings: string;
    month: string;
    payout: string;
    status: string;
    title: string;
    total: string;
  };
  emptyState: {
    description: string;
    title: string;
  };
}

export interface TripperExperiencesDict {
  title: string;
  eyebrow: string;
  description: string;
  newExperience: string;
  back: string;
  filters: {
    allTypes: string;
    allStatuses: string;
    allLevels: string;
    clearFilters: string;
    of: string;
    count: string;
  };
  table: {
    actions: string;
    package: string;
    typeLevel: string;
    status: string;
    price: string;
    updated: string;
    duration: string;
    capacity: string;
    edit: string;
    publish: string;
    unpublish: string;
    delete: string;
    deleteConfirm: string;
  };
  emptyState: {
    noExperiences: string;
    noMatch: string;
    createFirst: string;
  };
  status: {
    ACTIVE: string;
    DRAFT: string;
    PENDING_REVIEW: string;
    PENDING_TRIPPER_REVIEW: string;
    INACTIVE: string;
    ARCHIVED: string;
  };
  form: {
    createTitle: string;
    editTitle: string;
    createSubmit: string;
    editSubmit: string;
    cancel: string;
    saving: string;
    saved: string;
    errorSave: string;
    requiredFieldsLabel: string;
    actionBar: {
      back: string;
      clearAll: string;
      next: string;
      saveDraft: string;
      submit: string;
      submitForReview: string;
    };
    review: {
      pendingTitle: string;
      pendingBody: string;
      rejectedTitle: string;
      rejectedDismiss: string;
      submitError: string;
    };
    statusBadge: {
      pendingReview: string;
    };
    changedFieldsBanner: {
      prefix: string;
      peekShowOriginal: string;
      peekShowSuggestion: string;
      noContent: string;
    };
    nav: {
      sections: string;
      progress: string;
    };
    contentTabs: Array<{
      id: string;
      label: string;
      substeps: Array<{
        description: string;
        id: string;
        title: string;
      }>;
    }>;
    sections: {
      basic: string;
      destination: string;
      capacityPricing: string;
      compatibility: string;
      accommodation: string;
      activities: string;
      itinerary: string;
      inclusions: string;
      policies: string;
    };
    fields: {
      title: string;
      titlePlaceholder: string;
      type: string;
      typePlaceholder: string;
      typeHint: string;
      level: string;
      status: string;
      teaser: string;
      teaserHint: string;
      description: string;
      descriptionPlaceholder: string;
      country: string;
      countryPlaceholder: string;
      city: string;
      cityPlaceholder: string;
      excuseKey: string;
      excuseKeyPlaceholder: string;
      excuseKeyHint: string;
      minNights: string;
      minNightsHint: string;
      maxNights: string;
      maxNightsHint: string;
      minPax: string;
      maxPax: string;
      basePrice: string;
      basePriceHint: string;
      displayPrice: string;
      displayPriceHint: string;
      estimatedCost: string;
      season: string;
      seasonPlaceholder: string;
      seasonHint: string;
      pricingDescription: string;
      accommodationType: string;
      transport: string;
      suggestedTransport: string;
      estimatedTravelTime: string;
      climate: string;
      maxTravelTime: string;
      departPref: string;
      arrivePref: string;
      compatibilityHint: string;
      hotelName: string;
      hotelNamePlaceholder: string;
      hotelLink: string;
      hotelLinkPlaceholder: string;
      referredLink: string;
      referredLinkPlaceholder: string;
      hotelStars: string;
      hotelLocation: string;
      hotelDays: string;
      hotelDaysPlaceholder: string;
      starsHint: string;
      addAccommodation: string;
      removeAccommodation: string;
      starsPlaceholder: string;
      starSingular: string;
      starPlural: string;
      hotelCheckIn: string;
      hotelCheckOut: string;
      addHotel: string;
      noHotels: string;
      activityName: string;
      activityNamePlaceholder: string;
      activityDuration: string;
      activityDurationRhythm: string;
      activityDurationPlaceholder: string;
      durationUnitMin: string;
      durationUnitHr: string;
      durationUnitDay: string;
      durationHintMin: string;
      durationHintHr: string;
      durationHintDay: string;
      activityDesc: string;
      activityDescPlaceholder: string;
      activityRisks: string;
      activityRisksPlaceholder: string;
      activityLabel: string;
      addActivity: string;
      addAnotherActivity: string;
      removeActivity: string;
      noActivities: string;
      itineraryTitle: string;
      itineraryTitlePlaceholder: string;
      itineraryDesc: string;
      itineraryDescPlaceholder: string;
      dayLabel: string;
      addDay: string;
      addAnotherDay: string;
      removeDay: string;
      noItinerary: string;
      inclusions: string;
      addInclusion: string;
      exclusions: string;
      addExclusion: string;
      tags: string;
      tagInput: string;
      heroImage: string;
      heroImageHint: string;
      heroImageSizeHint: string;
      activityImageLabel: string;
      dayImageLabel: string;
      entryImageSizeHint: string;
      imageTooSmall: string;
      uploadImage: string;
      uploading: string;
      removeImage: string;
      copyrightHint: string;
      isActive: string;
      isActiveHint: string;
      isFeatured: string;
      isFeaturedHint: string;
      statusLabel: string;
      statusDraft: string;
      statusActive: string;
      createBlogPost: string;
      createBlogPostHint: string;
      // XSED fields
      titleInternal: string;
      slug: string;
      slugHint: string;
      tripDate: string;
      revealAt: string;
      currency: string;
      currencyHint: string;
      minSpots: string;
      maxSpots: string;
      cancellationPolicy: string;
      weatherPolicy: string;
      accessibilityNotes: string;
      safetyNotes: string;
      revealCopy: string;
      preRevealCopy: string;
      packingHints: string;
      whatsappMessageTemplate: string;
      adminNotes: string;
      supplierNotes: string;
    };
  };
}

export interface TripperProfilePageDict {
  accessDenied: {
    ctaHome: string;
    description: string;
    title: string;
  };
  card: {
    editProfile: string;
    nameFallback: string;
    noLocation: string;
    tripperBadgePrefix: string;
  };
  details: {
    heroPreviewAlt: string;
    openImage: string;
  };
  experiences: {
    active: string;
    countBlurb: string;
    emptyCta: string;
    emptyTitle: string;
    inactive: string;
    manageCta: string;
    peopleLabel: string;
    viewAll: string;
    nightsLabel: string;
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
  modal: {
    availableTypes: string;
    availableTypesPlaceholder: string;
    bio: string;
    bioPlaceholder: string;
    cancel: string;
    closeAria: string;
    commission: string;
    commissionPlaceholder: string;
    destinations: string;
    destinationsPlaceholder: string;
    heroImage: string;
    heroImagePlaceholder: string;
    imageUploadError: string;
    imageTooLarge: string;
    location: string;
    locationPlaceholder: string;
    save: string;
    slug: string;
    slugPlaceholder: string;
    tier: string;
    tierElite: string;
    tierPro: string;
    tierRookie: string;
    tierSelectPlaceholder: string;
    title: string;
    uploadImage: string;
    uploadingImage: string;
  };
  performance: {
    activeExperiences: string;
    averageRating: string;
    hintAfter: string;
    hintBefore: string;
    hintLink: string;
    title: string;
    totalBookings: string;
    totalEarnings: string;
    viewFullDashboard: string;
  };
  quickStats: {
    bookings: string;
    experiences: string;
    rating: string;
    title: string;
  };
  sections: {
    about: string;
    destinations: string;
    experiences: string;
    navigation: string;
    performance: string;
    profileDetails: string;
    quickStats: string;
    travelTypes: string;
  };
  tabs: {
    experiences: string;
    goToDashboard: string;
    overview: string;
    performance: string;
  };
  toasts: {
    error: string;
    success: string;
  };
}

export interface UnauthorizedPageDict {
  cta: {
    dashboard: string;
    home: string;
  };
  description: string;
  meta: {
    description: string;
    openGraphDescription: string;
    openGraphTitle: string;
    title: string;
  };
  title: string;
}

export interface XsedBookDict {
  actionBar: {
    clearAll: string;
    next: string;
    viewCheckout: string;
  };
  hero: {
    brand: string;
    description: string;
    fallbackImage: string;
    label: string;
    progressLabel: string;
    subtitle: string;
    videoSrc: string;
  };
  contentTabs: Array<{
    id: string;
    label: string;
    substeps: Array<{
      description: string;
      id: string;
      title: string;
    }>;
  }>;
  pax: {
    countOne: string;
    countOther: string;
    label: string;
  };
}

export interface XsedPageDict {
  countdown: {
    ctaHref: string;
    ctaLabel: string;
    daysLabel: string;
    hoursLabel: string;
    minLabel: string;
    nextDropLabel: string;
    windowOpenLabel: string;
    windowClosingLabel: string;
    secLabel: string;
    soldLabel: string;
    subtitle: string;
    openSubtitle: string;
    title: string;
    titleHighlight: string;
  };
  hero: {
    dropNumberLabel: string;
    errorMessage: string;
    primaryCta?: { ariaLabel: string; href: string; text: string };
    invalidEmailMessage: string;
    secondaryCta?: { ariaLabel: string; href: string; text: string };
    submittingLabel: string;
    successMessage: string;
    title: string;
    subtitle: string;
    tagline: string;
    availabilityNote: string;
    inputLabel: string;
    inputPlaceholder: string;
    submitLabel: string;
    submitAriaLabel: string;
    helper: string;
    fallbackImage: string;
    videoSrc: string;
  };
  iconText: {
    items: Array<{
      description: string;
      icon: "alert" | "escape" | "rhythm";
      title: string;
    }>;
  };
  meta: {
    description: string;
    openGraphDescription: string;
    openGraphTitle: string;
    title: string;
  };
  faq: {
    description: string;
    eyebrow: string;
    items: Array<{ answer: string; question: string }>;
    title: string;
  };
  xsedHero: {
    backgroundImage: string;
    eyebrow?: string;
    errorMessage: string;
    helper: string;
    inputLabel: string;
    inputPlaceholder: string;
    invalidEmailMessage: string;
    submitAriaLabel: string;
    submitLabel: string;
    submittingLabel: string;
    successMessage: string;
    title: string;
    videoSrc: string;
  };
  dropGrid: {
    ctaHref: string;
    ctaLabel: string;
    description: string;
    eyebrow: string;
    title: string;
    titleHighlight: string;
  };
  testimonials: {
    eyebrow: string;
    subtitle: string;
    title: string;
    viewFullReviewLabel: string;
  };
}

export interface AdminDashboardDict {
  nav: {
    dashboard: string;
    experiences: string;
    notifications: string;
    payments: string;
    reviews: string;
    settings: string;
    tripRequests: string;
    xsed: string;
  };
  pageHeadings: {
    experiences: { description: string; title: string };
    experiencesDetail: { description: string; title: string };
    home: { description: string; title: string };
    notifications: { description: string; title: string };
    payments: { description: string; title: string };
    reviews: { description: string; title: string };
    settings: { description: string; title: string };
    tripRequests: { description: string; title: string };
    xsedNew: { description: string; title: string };
  };
}

export interface AdminXsedDict {
  list: {
    dropsCount: string;
    newDrop: string;
    filterAllStatuses: string;
    empty: string;
    errorLoad: string;
    confirmDelete: string;
    columns: {
      title: string;
      slug: string;
      status: string;
      destination: string;
      tripDate: string;
      revealAt: string;
      basePrice: string;
      spots: string;
      sold: string;
      cancellation: string;
      weather: string;
      accessibility: string;
      safety: string;
      revealCopy: string;
      preRevealCopy: string;
      packingHints: string;
      whatsappMsg: string;
      adminNotes: string;
      supplierNotes: string;
      created: string;
      updated: string;
      actions: string;
    };
    actions: {
      edit: string;
      activate: string;
      deactivate: string;
      archive: string;
      delete: string;
      deleting: string;
    };
  };
  form: {
    eyebrow: string;
    title: string;
    titleEdit: string;
    back: string;
    submit: string;
    submitEdit: string;
    saving: string;
    cancel: string;
    toastCreated: string;
    toastUpdated: string;
    toastError: string;
    sections: {
      basic: string;
      location: string;
      dates: string;
      pricing: string;
      guest: string;
      reveal: string;
      internal: string;
      benefits: string;
    };
    fields: {
      titleInternal: string;
      teaser: string;
      slug: string;
      slugHint: string;
      status: string;
      heroImage: string;
      destinationCity: string;
      destinationCountry: string;
      tripDate: string;
      revealAt: string;
      basePrice: string;
      currency: string;
      currencyHint: string;
      minSpots: string;
      maxSpots: string;
      inclusions: string;
      exclusions: string;
      cancellationPolicy: string;
      weatherPolicy: string;
      accessibilityNotes: string;
      safetyNotes: string;
      revealCopy: string;
      preRevealCopy: string;
      packingHints: string;
      whatsappMessageTemplate: string;
      adminNotes: string;
      supplierNotes: string;
    };
  };
  benefits: {
    saveFirst: string;
    add: string;
    empty: string;
    save: string;
    cancel: string;
    delete: string;
    unnamed: string;
    types: { ACCOMMODATION: string; DINNER: string; ACTIVITY: string };
    confirmationStatus: {
      PENDING: string;
      CONFIRMED: string;
      CANCELLED: string;
    };
    fields: {
      type: string;
      name: string;
      sortOrder: string;
      providerName: string;
      address: string;
      city: string;
      state: string;
      googleMapsUrl: string;
      customerVisibleNotes: string;
      internalNotes: string;
      confirmationStatus: string;
      reservationCode: string;
      photos: string;
    };
  };
}

export interface AdminPagesDict {
  home: {
    eyebrow: string;
    heading: string;
    stats: {
      tripsSold: string;
      earnings: string;
      waitlist: string;
      xsedSignups: string;
    };
    pending: {
      eyebrow: string;
      heading: string;
      experiencesReview: string;
      tripsDestination: string;
      reviewsApproval: string;
    };
  };
  payments: {
    eyebrow: string;
    title: string;
    count: string;
    errorLoad: string;
    empty: string;
    columns: {
      paymentId: string;
      traveler: string;
      amount: string;
      status: string;
      provider: string;
      created: string;
    };
  };
  experiences: {
    eyebrow: string;
    title: string;
    count: string;
    errorLoad: string;
    empty: string;
    emptyPending: string;
    columns: {
      experience: string;
      tripper: string;
      typeLevel: string;
      status: string;
      updated: string;
      actions: string;
    };
    status: {
      ACTIVE: string;
      DRAFT: string;
      INACTIVE: string;
      ARCHIVED: string;
      PENDING_REVIEW: string;
      PENDING_TRIPPER_REVIEW: string;
      featured: string;
      normal: string;
    };
    actions: {
      disable: string;
      enable: string;
      unfeature: string;
      feature: string;
      review: string;
    };
    tabs: {
      all: string;
      pending: string;
    };
    review: {
      title: string;
      infoHeading: string;
      pricingHeading: string;
      pricePlaceholder: string;
      approve: string;
      reject: string;
      noteLabel: string;
      notePlaceholder: string;
      close: string;
      errorApprove: string;
      errorReject: string;
      errorPricing: string;
    };
  };
  reviews: {
    eyebrow: string;
    title: string;
    count: string;
    errorLoad: string;
    empty: string;
    columns: {
      traveler: string;
      review: string;
      rating: string;
      status: string;
      tripper: string;
      tripId: string;
      created: string;
      actions: string;
    };
    status: {
      approved: string;
      pending: string;
      public: string;
      private: string;
    };
    actions: {
      unapprove: string;
      approve: string;
      hide: string;
      publish: string;
      showMore: string;
      showLess: string;
    };
  };
  waitlist: {
    count: string;
    errorLoad: string;
    empty: string;
    columns: { name: string; email: string; joined: string; actions: string };
    actions: { delete: string; deleting: string };
  };
  xsedNotifications: {
    count: string;
    errorLoad: string;
    empty: string;
    columns: { email: string; locale: string; joined: string; actions: string };
    actions: { delete: string; deleting: string };
  };
  settings: {
    eyebrow: string;
    heading: string;
    tabs: {
      users: string;
      waitlist: string;
      xsedNotifications: string;
    };
  };
  tripRequests: {
    eyebrow: string;
    title: string;
    edit: string;
    empty: string;
    filters: { all: string };
    columns: {
      traveler: string;
      origin: string;
      typeLevel: string;
      status: string;
      payment: string;
      actions: string;
    };
  };
}

export interface NotificationsDict {
  pageTitle: string;
  eyebrow: string;
  description: string;
  emptyState: string;
  emptyStateTitle: string;
  markRead: string;
  markAllRead: string;
  unreadBadge: string;
  unreadCount: string;
  actionView: string;
  actionReview: string;
  types: Record<string, string>;
}

export interface TripReviewDict {
  buttonLabel: string;
  title: string;
  ratingLabel: string;
  feedbackPlaceholder: string;
  submit: string;
  cancel: string;
  success: string;
  emailHintTitle: string;
  emailHint: string;
}

export interface TripItineraryDict {
  title: string;
  backToTrip: string;
  day: string;
  emptyTitle: string;
  emptyDescription: string;
  noExperience: string;
  inclusions: string;
  exclusions: string;
}

export interface TripRevealDict {
  // Page header
  pageTitle: string;
  pageDescription: string;
  // Pre-reveal (CONFIRMED)
  countdownTitle: string;
  countdownSubtitle: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  pendingAssignment: string;
  // Post-reveal (REVEALED | COMPLETED)
  revealedEyebrow: string;
  revealedTitle: string;
  revealedSubtitle: string;
  viewItinerary: string;
  // Not found / error
  notFoundTitle: string;
  notFoundDescription: string;
  backToDashboard: string;
  // Dashboard card links
  revealCountdown: string;
  revealDestination: string;
}

export interface ReviewFormDict {
  pageTitle: string;
  pageSubtitle: string;
  ratingLabel: string;
  titleLabel: string;
  titlePlaceholder: string;
  contentLabel: string;
  contentPlaceholder: string;
  submitButton: string;
  successTitle: string;
  successMessage: string;
  errorInvalidToken: string;
  errorAlreadySubmitted: string;
  errorGeneric: string;
}

export interface MarketingDictionary {
  nav: {
    ariaLabelBitacoras: string;
    ariaLabelContact: string;
    ariaLabelExperiences: string;
    ariaLabelInspiration: string;
    ariaLabelLogo: string;
    ariaLabelNosotros: string;
    ariaLabelTripbuddy: string;
    ariaLabelTrippers: string;
    ariaLabelXsed: string;
    labelBitacoras: string;
    labelContact: string;
    labelExperiences: string;
    labelInspiration: string;
    labelNosotros: string;
    labelTrippers: string;
    labelTripbuddy: string;
    labelXsed: string;
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
    newDrop: string;
    signOut: string;
    tripperOs: string;
  };
  common: {
    siteName: string;
  };
  adminXsed: AdminXsedDict;
  adminPages: AdminPagesDict;
  adminExperienceReview: {
    back: string;
    approve: string;
    reject: string;
    confirmReject: string;
    cancel: string;
    noteLabel: string;
    notePlaceholder: string;
    notifTitle: string;
    notifBody: string;
    priceSection: string;
    editExperience: string;
    sendToTripper: string;
    discardChanges: string;
    lockedBannerTitle: string;
    lockedBannerBody: string;
    errorApprove: string;
    errorReject: string;
    errorStartEdit: string;
    errorLocked: string;
    errorSendToTripper: string;
    errorDiscard: string;
  };
  tripperExperienceReviewCopy: {
    approve: string;
    reject: string;
    errorApprove: string;
    errorReject: string;
  };
  xsedPage: XsedPageDict;
  xsedUnavailable: {
    heading: string;
    subheading: string;
    notifyLabel: string;
    backLabel: string;
  };
  xsedBook: XsedBookDict;
  xsedDropsPage: {
    description: string;
    filterDate: string;
    filterOrderBy: string;
    loadMore: string;
    title: string;
    titleHighlight: string;
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
      benefitsSteps: Array<{
        description: string;
        imageAlt: string;
        imageSrc: string;
        title: string;
      }>;
      ctaScrollTarget: string;
      ctaText: string;
      eyebrow: string;
      howItWorksSteps: Array<{
        description: string;
        imageAlt: string;
        imageSrc: string;
        title: string;
      }>;
      sectionAriaLabel: string;
      tabBenefitsLabel: string;
      tabHowLabel: string;
      title: string;
    };
    exploration: {
      buttonTrippers: string;
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
      xsedIntro: {
        backgroundImage: string;
        ctaHref: string;
        ctaLabel: string;
        description: string;
        eyebrow: string;
        title: string;
      };
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
    xsedHero: {
      backgroundImage: string;
      eyebrow: string;
      errorMessage: string;
      helper: string;
      inputLabel: string;
      inputPlaceholder: string;
      invalidEmailMessage: string;
      submitAriaLabel: string;
      submitLabel: string;
      submittingLabel: string;
      successMessage: string;
      title: string;
      videoSrc: string;
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
    grid: {
      searchCardCta: string;
      searchCardDescription: string;
      searchCardTitle: string;
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
      selectTravelTypeFirst: string;
      noTripperExperiences: string;
      noLevelsAvailable: string;
      browseGeneralExperiences: string;
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
        arrivePref: {
          label: string;
          options: Array<{ key: string; label: string }>;
        };
        climate: {
          label: string;
          options: Array<{ key: string; label: string }>;
        };
        departPref: {
          label: string;
          options: Array<{ key: string; label: string }>;
        };
        maxTravelTime: {
          label: string;
          options: Array<{ key: string; label: string }>;
        };
        transport: {
          label: string;
          options: Array<{ key: string; label: string }>;
        };
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
          arrivePref: {
            label: string;
            options: Array<{ key: string; label: string }>;
          };
          climate: {
            label: string;
            options: Array<{ key: string; label: string }>;
          };
          departPref: {
            label: string;
            options: Array<{ key: string; label: string }>;
          };
          maxTravelTime: {
            label: string;
            options: Array<{ key: string; label: string }>;
          };
          transport: {
            label: string;
            options: Array<{ key: string; label: string }>;
          };
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
      xsedImportantNote1: string;
      xsedImportantNote2: string;
      xsedImportantNote3: string;
      xsedImportantNote4: string;
      xsedImportantTitle: string;
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
      paymentTitle: string;
      paymentBack: string;
      paymentSubmit: string;
      paymentProcessing: string;
      contactCityLabel: string;
      contactCountryLabel: string;
      contactCountryPlaceholder: string;
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
    tripperBadge: {
      curatedBy: string;
      byTripper: string;
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
      calendarEventDescription: string;
      receiptLink: string;
      xsedBody: string;
      xsedDownloadCta: string;
      xsedExperienceLabel: string;
      xsedPerPerson: string;
      xsedReferenceLabel: string;
      xsedTitle: string;
      xsedTripTypeLabel: string;
    };
  };
  paymentFailure: {
    body: string;
    ctaBackToJourney: string;
    ctaHome: string;
    ctaMyTrips: string;
    ctaTryAgain: string;
    metaDescription: string;
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
    entityAddress: string;
    entityNotice: string;
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
  faqPage: {
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
    block: {
      description: string;
      eyebrow: string;
      items: Array<{ answer: string; question: string }>;
      title: string;
    };
  };
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
      eyebrow: string;
      items: Array<{
        bio: string;
        img: string;
        linkedin: string;
        name: string;
        role: string;
        tagline?: string;
      }>;
      sectionTitle: string;
      subtitle: string;
    };
    faq: {
      description: string;
      eyebrow: string;
      items: Array<{ answer: string; question: string }>;
      title: string;
    };
    founder: {
      imageAlt: string;
      p1: string;
      p2: string;
      sectionTitle: string;
    };
    hero: {
      eyebrow: string;
      fallbackImage: string;
      primaryCta: { ariaLabel: string; href: string; text: string };
      subtitle: string;
      title: string;
      videoSrc?: string;
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
      items: Array<{ title: string; description: string }>;
      sectionTitle: string;
    };
    presentTrippers: {
      ctaHref: string;
      ctaLabel: string;
      eyebrow: string;
      subtitle: string;
      title: string;
    };
    valueProps: {
      items: Array<{ copy: string; title: string }>;
      sectionTitle: string;
    };
  };
  contactPage: {
    contact: {
      email: string;
      heading: string;
      socialsHeading: string;
      socials: {
        facebook: string;
        instagram: string;
        x: string;
      };
    };
    form: {
      email: string;
      interest: string;
      interestOptions: {
        collaboration: string;
        other: string;
        partnerships: string;
        trips: string;
      };
      message: string;
      name: string;
      success: {
        description: string;
        title: string;
      };
      submit: string;
    };
    hero: {
      description: string;
      title: string;
    };
    intro: {
      p1: string;
      p2: string;
      p3: string;
      p4: string;
      title: string;
    };
    meta: {
      description: string;
      openGraphDescription: string;
      openGraphTitle: string;
      title: string;
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
    comingSoon: string;
    comingSoonDescription: string;
    header: {
      badgeActiveTraveler: string;
      badgeTripper: string;
      emailFallback: string;
      userFallback: string;
    };
    hero: {
      subtitle: string;
      title: string;
    };
    labels: {
      addressSection: string;
      avgRating: string;
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
      totalTrips: string;
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
    nav: {
      summary: string;
      personal: string;
      travelDocs: string;
      preferences: string;
      payments: string;
      security: string;
      tripperProfile: string;
      tripperOs: string;
    };
    personalSectionTitle: string;
    preferencesSectionTitle: string;
    tagList: {
      addAriaLabel: string;
      removeAriaLabel: string;
    };
    sections: {
      summary: string;
      travelDocs: string;
      payments: string;
      security: string;
      tripperProfile: string;
      tripperOs: string;
    };
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
      avatarUploadError: string;
      avatarUploadSuccess: string;
      avatarFileTooLarge: string;
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
    tripperSections: {
      publicProfileCta: string;
      publicProfileDescription: string;
      tripperOsCta: string;
      tripperOsDescription: string;
    };
  };
  adminUsers: {
    actions: string;
    edit: string;
    editing: string;
    empty: string;
    errorFallback: string;
    headers: {
      actions: string;
      joined: string;
      roles: string;
      tripperSlug: string;
      user: string;
    };
    modal: {
      admin: string;
      cancel: string;
      clientBase: string;
      confirmDelete: string;
      delete: string;
      deleteError: string;
      deleting: string;
      errorFallback: string;
      roleSection: string;
      saveChanges: string;
      saving: string;
      tripper: string;
    };
    roles: {
      ADMIN: string;
      CLIENT: string;
      TRIPPER: string;
    };
    usersCount: string;
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
    destinationDerivedNote: string;
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
    experienceLabel: string;
    experiencePlaceholder: string;
    experienceSectionTitle: string;
    noTripperNotice: string;
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
  dashboard: DashboardDict;
  adminDashboard: AdminDashboardDict;
  clientDashboard: ClientDashboardDict;
  tripperDashboard: TripperDashboardDict;
  tripperProfilePage: TripperProfilePageDict;
  tripperExperiences: TripperExperiencesDict;
  tripperEarnings: TripperEarningsDict;
  tripperReviews: TripperReviewsDict;
  unauthorized: UnauthorizedPageDict;
  notifications: NotificationsDict;
  tripReview: TripReviewDict;
  tripItinerary: TripItineraryDict;
  tripReveal: TripRevealDict;
  reviewForm: ReviewFormDict;
}
