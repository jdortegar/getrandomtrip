import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { TripperSettingsPublicUrlCard } from "@/components/app/dashboard/tripper/settings/TripperSettingsPublicUrlCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy = {
  copied: "Copiado",
  copyLink: "Copiar link",
  domainPrefix: "randomtrip.com/trippers/",
  eyebrow: "Perfil público",
  heading: "Tu URL pública",
  openLink: "Abrir",
  slugPlaceholder: "tu-slug",
  visibilityLabel: "Perfil público visible",
  visibilityDisabledHint: "Configura tu URL de perfil primero para activar la visibilidad",
  visibilityError: "No pudimos actualizar la visibilidad de tu perfil. Intenta de nuevo.",
};

function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return container;
}

describe("TripperSettingsPublicUrlCard — visibility toggle gating", () => {
  it("disables the toggle and shows the hint when canToggleVisibility is false", () => {
    const container = render(
      <TripperSettingsPublicUrlCard
        canToggleVisibility={false}
        copy={copy}
        isActive={true}
        isEditing={false}
        locale="es"
        onIsActiveChange={vi.fn()}
        onSlugChange={vi.fn()}
        slug=""
      />,
    );

    const toggle = container.querySelector('[role="switch"]');
    expect(toggle?.getAttribute("disabled")).not.toBeNull();
    expect(container.textContent).toContain(copy.visibilityDisabledHint);
  });

  it("stays disabled when the caller has an unsaved slug typed in the form but it is not yet persisted", () => {
    // This is the exact bug scenario: formData.tripperSlug (the `slug` prop,
    // used for the display/copy-link block) can hold a draft value while
    // editing, but canToggleVisibility must derive from the PERSISTED slug,
    // not from this display prop.
    const container = render(
      <TripperSettingsPublicUrlCard
        canToggleVisibility={false}
        copy={copy}
        isActive={false}
        isEditing={true}
        locale="es"
        onIsActiveChange={vi.fn()}
        onSlugChange={vi.fn()}
        slug="a-draft-slug-not-saved-yet"
      />,
    );

    const toggle = container.querySelector('[role="switch"]');
    expect(toggle?.getAttribute("disabled")).not.toBeNull();
  });

  it("enables the toggle and reflects isActive once canToggleVisibility is true", () => {
    const container = render(
      <TripperSettingsPublicUrlCard
        canToggleVisibility={true}
        copy={copy}
        isActive={true}
        isEditing={false}
        locale="es"
        onIsActiveChange={vi.fn()}
        onSlugChange={vi.fn()}
        slug="florencia-denis"
      />,
    );

    const toggle = container.querySelector('[role="switch"]');
    expect(toggle?.getAttribute("disabled")).toBeNull();
    expect(toggle?.getAttribute("aria-checked")).toBe("true");
    expect(container.textContent).not.toContain(copy.visibilityDisabledHint);
  });
});
