import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavMobileDrawer } from "../NavMobileDrawer";
import Navbar from "../Navbar";
import type { NavLink } from "../Navbar";
import type { Dictionary } from "@/lib/i18n/dictionaries";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("next/navigation", () => ({
  usePathname: () => "/es/trippers",
  useRouter: () => ({ push: vi.fn() }),
}));

const NAV_FIXTURE: Dictionary["nav"] = {
  ariaLabelBitacoras: "Go to Off the Record",
  ariaLabelContact: "Go to contact page",
  ariaLabelExperiences: "Go to Experiences",
  ariaLabelInspiration: "Go to inspiration section",
  ariaLabelLogo: "Randomtrip",
  ariaLabelNosotros: "Go to about us page",
  ariaLabelTripbuddy: "Go to North IA",
  ariaLabelTrippers: "Go to Trippers page",
  ariaLabelXsed: "Go to TGIS",
  closeMenu: "Close menu",
  labelBitacoras: "Off the Record",
  labelContact: "Contact",
  labelExperiences: "Experiences",
  labelInspiration: "Inspiration",
  labelNosotros: "About us",
  labelTrippers: "Trippers",
  labelTripbuddy: "North IA",
  labelXsed: "TGIS",
  menuLabel: "Navigation menu",
  openMenu: "Open navigation menu",
  selectLanguage: "Select language",
  signIn: "Sign in",
  whatsApp: "WhatsApp",
};

const LINKS: NavLink[] = [
  { href: "/trippers", labelKey: "labelTrippers", ariaKey: "ariaLabelTrippers" },
  { href: "/experiences", labelKey: "labelExperiences", ariaKey: "ariaLabelExperiences" },
  { href: "/xsed", labelKey: "labelXsed", ariaKey: "ariaLabelXsed" },
  { href: "/blog", labelKey: "labelInspiration", ariaKey: "ariaLabelInspiration" },
  { href: "/about-us", labelKey: "labelNosotros", ariaKey: "ariaLabelNosotros" },
  { href: "/contact", labelKey: "labelContact", ariaKey: "ariaLabelContact" },
];

let container: HTMLDivElement;
let root: Root;

function render(ui: React.ReactElement) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(ui);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  document.body.classList.remove("overflow-hidden");
  vi.restoreAllMocks();
});

function renderDrawer(overrides: Partial<React.ComponentProps<typeof NavMobileDrawer>> = {}) {
  const onClose = vi.fn();
  const onLocaleChange = vi.fn();
  const onSignIn = vi.fn();

  render(
    <NavMobileDrawer
      currentLocale="es"
      isActive={(href) => href === "/trippers"}
      isAuthed={false}
      isOpen
      links={LINKS}
      nav={NAV_FIXTURE}
      onClose={onClose}
      onLocaleChange={onLocaleChange}
      onSignIn={onSignIn}
      whatsappHref="https://wa.me/526241928208"
      {...overrides}
    />,
  );

  return { onClose, onLocaleChange, onSignIn };
}

describe("NavMobileDrawer", () => {
  it("renders nothing in the DOM when closed", () => {
    renderDrawer({ isOpen: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders all six nav links when open, and Escape fires onClose", () => {
    const { onClose } = renderDrawer();

    for (const link of LINKS) {
      expect(container.textContent).toContain(NAV_FIXTURE[link.labelKey]);
    }

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fires onClose when a link is clicked", () => {
    const { onClose } = renderDrawer();

    const firstLink = container.querySelector("a")!;
    act(() => {
      firstLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render a sign-in CTA when isAuthed is true", () => {
    renderDrawer({ isAuthed: true });
    expect(container.querySelector(`[aria-label="${NAV_FIXTURE.signIn}"]`)).toBeNull();
    expect(container.textContent).not.toContain(NAV_FIXTURE.signIn);
  });

  it("renders a sign-in CTA when isAuthed is false", () => {
    renderDrawer({ isAuthed: false });
    expect(container.textContent).toContain(NAV_FIXTURE.signIn);
  });

  it("uses the navbar Phone icon for WhatsApp, not the raster bubble", () => {
    renderDrawer();
    const whatsapp = container.querySelector(
      `[aria-label="${NAV_FIXTURE.whatsApp}"]`,
    );
    expect(whatsapp?.querySelector("img")).toBeNull();
    expect(whatsapp?.querySelector("svg")).not.toBeNull();
  });
});

describe("Navbar — search control removed", () => {
  it("has no element with a search aria-label at any breakpoint", () => {
    render(
      <Navbar
        backgroundPrimary
        dict={{ nav: NAV_FIXTURE } as unknown as Dictionary}
        locale="es"
      />,
    );

    expect(container.querySelector('[aria-label="Search"]')).toBeNull();
    expect(container.querySelector('[aria-label="Buscar"]')).toBeNull();
  });
});

describe("Navbar — attribution banner positioning", () => {
  it.each(["overlay", "solid"] as const)(
    "keeps contained marketing chrome sticky and over the hero in %s mode",
    (variant) => {
      render(<Navbar contained variant={variant} />);

      const header = container.querySelector("[data-site-header]")!;
      expect(header.classList.contains("sticky")).toBe(true);
      expect(header.classList.contains("fixed")).toBe(false);
      expect(header.classList.contains("-mb-16")).toBe(true);
    },
  );

  it("reserves navbar space for contained forced-solid pages", () => {
    render(<Navbar backgroundPrimary contained />);

    const header = container.querySelector("[data-site-header]")!;
    expect(header.classList.contains("sticky")).toBe(true);
    expect(header.classList.contains("-mb-16")).toBe(false);
  });

  it("preserves standalone marketing navbar positioning", () => {
    render(<Navbar />);

    const header = container.querySelector("[data-site-header]")!;
    expect(header.classList.contains("fixed")).toBe(true);
    expect(header.classList.contains("-mb-16")).toBe(false);
  });
});
