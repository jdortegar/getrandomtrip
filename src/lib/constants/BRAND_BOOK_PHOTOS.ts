/**
 * Photography extracted from Randomtrip Brand Book 3.1.
 * Shared by type-on-image examples, payoffs, and the photography section.
 */
export const BRAND_BOOK_PHOTOS = {
  alleySea: "/images/brand-book/alley-sea.jpg",
  alleyTreated: "/images/brand-book/alley-treated.jpg",
  beachHat: "/images/brand-book/beach-hat.jpg",
  blueDoor: "/images/brand-book/blue-door-portrait.jpg",
  cameraMap: "/images/brand-book/camera-map.jpg",
  caro: "/images/brand-book/caro.jpg",
  coastalTown: "/images/brand-book/coastal-town.jpg",
  dashboardView: "/images/brand-book/dashboard-view.jpg",
  lucia: "/images/brand-book/lucia.jpg",
  lunchTable: "/images/brand-book/lunch-table.jpg",
  mateo: "/images/brand-book/mateo.jpg",
  personCoast: "/images/brand-book/person-coast.jpg",
  stoneStreet: "/images/brand-book/stone-street.jpg",
  sunsetSwim: "/images/brand-book/sunset-swim.jpg",
  tomas: "/images/brand-book/tomas.jpg",
  trainWindow: "/images/brand-book/train-window.jpg",
  vanOverlook: "/images/brand-book/van-overlook.jpg",
} as const;

const example = (file: string) => `/images/brand-book/examples/${file}`;

/** Composed Brand Book 3.1 specimens (type already in the image). */
export const TYPE_ON_IMAGE_EXAMPLES = [
  {
    fails: [example("type-01-fails.jpg")],
    works: [example("type-01-works.jpg")],
  },
  {
    fails: [example("type-02-fails.jpg")],
    works: [example("type-02-works.jpg")],
  },
  {
    fails: [example("type-03-fails.jpg")],
    works: [example("type-03-works.jpg")],
  },
  {
    fails: [example("type-04-fails.jpg")],
    works: [example("type-04-works.jpg")],
  },
  {
    fails: [example("type-05-fails.jpg")],
    works: [example("type-05-works.jpg")],
  },
  {
    fails: [example("type-06-fails-a.jpg"), example("type-06-fails-b.jpg")],
    works: [example("type-06-works-a.jpg"), example("type-06-works-b.jpg")],
  },
] as const;

export const PAYOFF_EXAMPLES = {
  benefit: example("payoff-benefit.jpg"),
  differentiator: example("payoff-differentiator.jpg"),
  emotion: example("payoff-emotion.jpg"),
  philosophy: example("payoff-philosophy.jpg"),
  promise: example("payoff-promise.jpg"),
} as const;

export const VOICE_EXAMPLES = {
  documentary: example("voice-documentary.jpg"),
  paired: example("voice-paired.jpg"),
} as const;

export const PHOTOGRAPHY_PHOTOS = {
  philosophy: [
    BRAND_BOOK_PHOTOS.blueDoor,
    BRAND_BOOK_PHOTOS.trainWindow,
    BRAND_BOOK_PHOTOS.lunchTable,
    BRAND_BOOK_PHOTOS.stoneStreet,
    BRAND_BOOK_PHOTOS.coastalTown,
  ],
  treatment: [
    BRAND_BOOK_PHOTOS.vanOverlook,
    BRAND_BOOK_PHOTOS.alleyTreated,
    BRAND_BOOK_PHOTOS.sunsetSwim,
    BRAND_BOOK_PHOTOS.beachHat,
    BRAND_BOOK_PHOTOS.cameraMap,
  ],
} as const;

export const TRIPPER_PHOTOS = [
  {
    height: 1090,
    photo: example("tripper-mateo.jpg"),
    strip: "sage",
    width: 1155,
  },
  {
    height: 376,
    photo: example("tripper-lucia.jpg"),
    strip: "sage",
    width: 263,
  },
  {
    height: 376,
    photo: example("tripper-caro.jpg"),
    strip: "ochre",
    width: 286,
  },
  {
    height: 376,
    photo: example("tripper-tomas.jpg"),
    strip: "teal",
    width: 288,
  },
] as const;
