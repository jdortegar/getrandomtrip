import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ImageEditorModalProps,
  ImageEditorSource,
} from "@/components/ui/ImageEditorModal";
import type {
  TripperDashboardDict,
  ImageEditorDict,
} from "@/lib/types/dictionary";
import type {
  TripperSettingsFormState,
  TripperSettingsStats,
  TripperTierCopy,
} from "@/types/tripper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// The card also renders `AvatarEditor` (tripper avatar inside the hero
// band), which reads `next-auth/react` + the Zustand user store directly —
// stub both so this file only exercises the hero re-crop entry point.
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated", update: vi.fn() }),
}));

vi.mock("@/store/slices/userStore", () => ({
  useUserStore: Object.assign(
    () => ({ user: { avatar: undefined, avatarUrlOriginal: undefined } }),
    { setState: vi.fn() },
  ),
}));

let capturedModalProps: ImageEditorModalProps | null = null;

// `TripperSettingsHeroCard` loads the modal via `next/dynamic`, which React
// Testing harnesses without an RTL `waitFor` need unwrapped explicitly: swap
// it for `React.lazy` so the real (mocked) module resolves deterministically
// under `act(async () => ...)`.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>) => {
    const React = require("react") as typeof import("react");
    const Lazy = React.lazy(() =>
      loader().then((mod) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        default: (mod as any).default ?? (mod as any),
      })),
    );
    return function DynamicWrapper(props: Record<string, unknown>) {
      return React.createElement(
        React.Suspense,
        { fallback: null },
        React.createElement(Lazy, props),
      );
    };
  },
}));

// Stub the real modal (react-easy-crop + its own file-picking UI) — this
// test only asserts the *entry point* contract: what `source` the card
// hands the modal when the tripper clicks "edit", not the crop UI itself.
vi.mock("@/components/ui/ImageEditorModal", () => ({
  ImageEditorModal: (props: ImageEditorModalProps) => {
    capturedModalProps = props;
    const React = require("react") as typeof import("react");
    return React.createElement("div", { "data-testid": "image-editor-modal" });
  },
}));

import { TripperSettingsHeroCard } from "../TripperSettingsHeroCard";

const copy: TripperDashboardDict["settingsProfile"]["hero"] = {
  editProfile: "Editar perfil",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando...",
  uploadHint: "Subir foto",
  changePhoto: "Cambiar foto",
  dragToReposition: "Arrastrá para reposicionar",
  resetPosition: "Restablecer posición",
  nameFallback: "Tripper",
  namePlaceholder: "Tu nombre",
  nicknameHint: "Así te van a ver los viajeros",
  locationPlaceholder: "Tu ubicación",
  noLocation: "Sin ubicación",
  statsExperiences: "Experiencias",
  statsBookings: "Reservas",
  statsRating: "Rating",
  reviewsSuffix: "reseñas",
  imageTooLarge: "La imagen es muy pesada",
  imageUploadError: "Error al subir la imagen",
};

const imageEditorCopy: ImageEditorDict = {
  title: "Editar imagen",
  dropHint: "Arrastrá una imagen",
  dropHintDivider: "o",
  chooseFile: "Elegir archivo",
  zoomLabel: "Zoom",
  pickAnother: "Elegir otra",
  cancel: "Cancelar",
  save: "Guardar",
  saving: "Guardando...",
  uploadError: "Error al subir",
};

const avatarToastCopy = {
  avatarFileTooLarge: "Archivo muy pesado",
  avatarUploadError: "Error al subir el avatar",
  avatarUploadSuccess: "Avatar actualizado",
};

const tierLabels: TripperTierCopy = {
  wanderer: "Wanderer",
  scout: "Scout",
  navigator: "Navigator",
  pioneer: "Pioneer",
  luminary: "Luminary",
};

const stats: TripperSettingsStats = {
  totalExperiences: 3,
  totalBookings: 5,
  averageRating: 4.5,
  totalReviews: 2,
};

const baseFormData: TripperSettingsFormState = {
  name: "Jane Doe",
  nickname: "Jane",
  email: "jane@example.com",
  bio: "",
  heroImage: "/api/upload/hero-baked.webp",
  heroImageOriginal: null,
  isActive: true,
  location: "",
  tierLevel: "wanderer",
  destinations: [],
  tripperSlug: "jane",
  commission: 0.1,
  availableTypes: [],
  socialLinks: [],
};

let container: HTMLDivElement;
let root: Root;

function render(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  capturedModalProps = null;
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function renderCard(formData: TripperSettingsFormState) {
  return render(
    <TripperSettingsHeroCard
      avatarToastCopy={avatarToastCopy}
      copy={copy}
      imageEditorCopy={imageEditorCopy}
      tierLabels={tierLabels}
      formData={formData}
      stats={stats}
      isEditing
      isSaving={false}
      isUploadingHeroImage={false}
      onChange={vi.fn()}
      onCancel={vi.fn()}
      onEdit={vi.fn()}
      onSave={vi.fn()}
      onUploadHeroImage={vi.fn()}
    />,
  );
}

function clickChangePhoto(el: HTMLElement) {
  const button = el.querySelector(
    `button[aria-label="${copy.changePhoto}"]`,
  ) as HTMLButtonElement;
  expect(button).toBeTruthy();
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("TripperSettingsHeroCard re-crop entry point", () => {
  it("opens the editor with the retained original and no file, without requiring a file pick first", async () => {
    const el = renderCard({
      ...baseFormData,
      heroImageOriginal: "/api/upload/hero-original.webp",
    });

    clickChangePhoto(el);
    await flush();

    expect(capturedModalProps).not.toBeNull();
    const source = capturedModalProps!.source as ImageEditorSource;
    expect(capturedModalProps!.open).toBe(true);
    expect(source.file).toBeUndefined();
    expect(source.originalUrl).toBe("/api/upload/hero-original.webp");
  });

  it("falls back to the current baked hero image when no retained original exists yet", async () => {
    const el = renderCard(baseFormData); // heroImageOriginal: null

    clickChangePhoto(el);
    await flush();

    const source = capturedModalProps!.source as ImageEditorSource;
    expect(source.originalUrl).toBe(baseFormData.heroImage);
  });
});
