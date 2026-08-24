import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ImageEditorModalProps,
  ImageEditorSource,
} from "@/components/ui/ImageEditorModal";
import type { ImageEditorDict } from "@/lib/types/dictionary";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let capturedModalProps: ImageEditorModalProps | null = null;
let storeUser: { avatar?: string; avatarUrlOriginal?: string } = {};

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { name: "Jane" } },
    status: "authenticated",
    update: vi.fn(),
  }),
}));

vi.mock("@/store/slices/userStore", () => ({
  useUserStore: Object.assign(() => ({ user: storeUser }), { setState: vi.fn() }),
}));

// Same rationale as TripperSettingsHeroCard.test.tsx: swap `next/dynamic`
// for `React.lazy` so the (mocked) modal module resolves deterministically.
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

vi.mock("@/components/ui/ImageEditorModal", () => ({
  ImageEditorModal: (props: ImageEditorModalProps) => {
    capturedModalProps = props;
    const React = require("react") as typeof import("react");
    return React.createElement("div", { "data-testid": "image-editor-modal" });
  },
}));

import { AvatarEditor } from "../AvatarEditor";

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

const toastCopy = {
  avatarFileTooLarge: "Archivo muy pesado",
  avatarUploadError: "Error al subir el avatar",
  avatarUploadSuccess: "Avatar actualizado",
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
  storeUser = {};
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

function clickAvatar(el: HTMLElement) {
  const button = el.querySelector("button") as HTMLButtonElement;
  expect(button).toBeTruthy();
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("AvatarEditor re-crop entry point", () => {
  it("opens the editor with the retained original and no file, without requiring a file pick first", async () => {
    storeUser = {
      avatar: "/api/upload/avatar-baked.webp",
      avatarUrlOriginal: "/api/upload/avatar-original.webp",
    };
    const el = render(
      <AvatarEditor imageEditorCopy={imageEditorCopy} size={96} toastCopy={toastCopy} />,
    );

    clickAvatar(el);
    await flush();

    expect(capturedModalProps).not.toBeNull();
    const source = capturedModalProps!.source as ImageEditorSource;
    expect(capturedModalProps!.open).toBe(true);
    expect(source.file).toBeUndefined();
    expect(source.originalUrl).toBe("/api/upload/avatar-original.webp");
  });

  it("falls back to the current avatar image when no retained original exists yet", async () => {
    storeUser = { avatar: "/api/upload/avatar-baked.webp", avatarUrlOriginal: undefined };
    const el = render(
      <AvatarEditor imageEditorCopy={imageEditorCopy} size={96} toastCopy={toastCopy} />,
    );

    clickAvatar(el);
    await flush();

    const source = capturedModalProps!.source as ImageEditorSource;
    expect(source.originalUrl).toBe("/api/upload/avatar-baked.webp");
  });
});
