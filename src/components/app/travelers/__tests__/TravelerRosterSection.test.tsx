import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO, TravelerRoster } from "@/types/traveler";


(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: InviteTravelersDict = {
  eyebrow: "",
  heading: "",
  subtitle: "{count} viajeros",
  notifTitle: "",
  deadlineLabel: "Antes del {date}",
  progressLabel: "{submitted} de {cap} viajeros completados",
  lockedBanner: "Bloqueado hace {days} días {supportLink}",
  supportLinkLabel: "soporte",
  footnote: "{supportLink}",
  travelerLabel: "",
  adultTag: "Adulto",
  minorTag: "Menor",
  fullNameLabel: "Nombre completo",
  fullNamePlaceholder: "",
  emailLabel: "Email",
  emailPlaceholder: "",
  idDocumentLabel: "DNI",
  idDocumentPlaceholder: "",
  idDocumentPendingPlaceholder: "",
  dateOfBirthLabel: "",
  resendInviteAction: "",
  saveAction: "Guardar",
  lockedActionTitle: "",
  statusPending: "Pendiente",
  statusInvited: "Invitado",
  statusComplete: "Completo",
  invitedNote: "",
  inviteResentNote: "",
  minorFilledByBuyerNote: "",
  savedNote: "Guardado",
  incompleteError: "Incompleto",
  saveErrorGeneric: "Error al guardar",
  sendInviteErrorGeneric: "",
  inviteBadgeNoEmail: "Sin email",
  inviteBadgeSent: "Enviada {date}",
  inviteBadgeJoined: "Se unió",
  inviteBadgeNotSent: "Sin enviar",
  companionHeading: "Tu grupo",
  companionSubtitle: "Te sumaron",
  companionYouTag: "Vos",
  companionOtherNote: "Los gestiona quien reservó",
  landingEmailHint: "",
  landingVerifyInbox: "",
  landingResendCta: "",
  landingResendPending: "",
  landingResendSent: "",
  landingResendCooldown: "",
  landingResendAlreadyVerified: "",
  landingResendError: "",
  emailLockedJoinedHint: "",
  landingEyebrow: "",
  landingHeading: "",
  landingGreeting: "",
  landingSignupExplainer: "",
  landingSignupCta: "",
  landingStep2Heading: "",
  landingConsentPrefix: "",
  landingConsentLinkLabel: "",
  landingConsentSuffix: "",
  landingSubmitLabel: "",
  landingSubmitting: "",
  landingRedirecting: "",
  landingSessionExpiredError: "",
  landingSuccessTitle: "",
  landingSuccessBody: "",
  landingErrorTitle: "",
  landingReasonInvalid: "",
  landingReasonExpired: "",
  landingReasonUsed: "",
  landingReasonEnded: "",
  landingEmailMismatch: "",
  landingSwitchAccount: "",
  landingConsentRequiredError: "",
  landingGenericError: "",
  savingAction: "",
};

function traveler(overrides: Partial<TravelerDTO> = {}): TravelerDTO {
  return {
    id: "trav-1",
    kind: "ADULT",
    status: "PENDING",
    fullName: "Juli A",
    email: "juli@example.com",
    idDocument: "12345678",
    dateOfBirth: null,
    invitedAt: null,
    submittedAt: null,
    joined: false,
    ...overrides,
  };
}

function roster(
  travelers: TravelerDTO[],
  overrides: Partial<TravelerRoster> = {},
): TravelerRoster {
  return {
    deadline: null,
    startDate: null,
    locked: false,
    cap: travelers.length,
    submitted: travelers.filter((t) => t.status === "COMPLETE").length,
    travelers,
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;
let handleRef: { current: TravelerRosterSectionHandle | null };

function render(rosterData: TravelerRoster) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  handleRef = { current: null };
  act(() => {
    root.render(
      <TravelerRosterSection
        copy={copy}
        locale="es"
        ref={(el) => {
          handleRef.current = el;
        }}
        roster={rosterData}
      />,
    );
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TravelerRosterSection — saveAll() result", () => {
  it("resolves true when every row saves, even if a row is still incomplete", async () => {
    const t1 = traveler({ id: "t1" });
    const t2 = traveler({ id: "t2", fullName: "Ana B" });
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => ({
        ok: true,
        json: async () => ({
          traveler: {
            ...(url.includes("t1") ? t1 : t2),
            status: url.includes("t1") ? "COMPLETE" : "PENDING",
          },
        }),
      }),
    );
    render(roster([t1, t2]));

    let allSaved: boolean | undefined;
    await act(async () => {
      allSaved = await handleRef.current?.saveAll();
    });

    expect(allSaved).toBe(true);
  });

  it("resolves false when at least one row fails to save", async () => {
    const t1 = traveler({ id: "t1" });
    const t2 = traveler({ id: "t2", fullName: "Ana B" });
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => {
        if (url.includes("t1")) {
          return {
            ok: true,
            json: async () => ({ traveler: { ...t1, status: "COMPLETE" } }),
          };
        }
        return { ok: false, json: async () => ({ error: "generic" }) };
      },
    );
    render(roster([t1, t2]));

    let allSaved: boolean | undefined;
    await act(async () => {
      allSaved = await handleRef.current?.saveAll();
    });

    expect(allSaved).toBe(false);
  });
});

describe("TravelerRosterSection — locked banner days", () => {
  it("formats the seven-calendar-day deadline in UTC rather than the preceding local day", () => {
    render(roster([traveler()], { startDate: "2026-10-09T00:00:00.000Z", deadline: "2026-10-02T00:00:00.000Z" }));
    expect(container.textContent).toContain("Antes del 2 oct");
    expect(container.textContent).not.toContain("Antes del 1 oct");
  });

  it("shows real days-until-departure, not days since the roster deadline", () => {
    const t1 = traveler({ id: "t1" });
    // Deadline (roster cutoff) is already 4 days in the past — the old code
    // derived {days} from this and clamped to 0. Departure itself is still
    // 3 days out, which is what the copy claims to show.
    const startDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000 + 60_000,
    ).toISOString();
    const deadline = new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000,
    ).toISOString();

    render(roster([t1], { locked: true, startDate, deadline }));

    expect(container.textContent).toContain("Bloqueado hace 3 días");
  });

  it("regression: departure tomorrow at UTC midnight, less than 24h away this afternoon — reads 1, not 0", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-14T15:00:00.000Z"));
    try {
      const t1 = traveler({ id: "t1" });
      render(
        roster([t1], {
          locked: true,
          startDate: "2026-08-15T00:00:00.000Z",
          deadline: "2026-08-08T00:00:00.000Z",
        }),
      );

      expect(container.textContent).toContain("Bloqueado hace 1 días");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("TravelerRosterSection — companion view (T6)", () => {
  const me = traveler({ id: "me", isSelf: true, joined: true, status: "COMPLETE", fullName: "Me Myself", email: "me@example.com", idDocument: null });
  const other = traveler({
    id: "other", fullName: "Other Person", email: null, idDocument: null, dateOfBirth: null,
    status: "COMPLETE", joined: false,
  });
  const companionRoster = () => roster([me, other], { viewerRole: "companion", submitted: 2 });

  it("renders the companion intro instead of the buyer's invite copy", () => {
    render(companionRoster());
    expect(container.textContent).toContain("Tu grupo");
    expect(container.textContent).toContain("Te sumaron");
  });

  it("shows other travelers by name only, with no inputs, invite action or buyer notes", () => {
    render(companionRoster());

    expect(container.textContent).toContain("Other Person");
    expect(container.textContent).toContain("Los gestiona quien reservó");
    expect(container.querySelector("#traveler-other-fullName")).toBeNull();
    expect(container.querySelector("#traveler-other-email")).toBeNull();
    expect(container.querySelector("#traveler-other-idDocument")).toBeNull();
    // The only inputs on screen belong to the viewer's own row.
    const ids = Array.from(container.querySelectorAll("input")).map((i) => i.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith("traveler-me-"))).toBe(true);
    expect(container.querySelector("button")).toBeNull();
  });

  it("saveAll only saves the viewer's own row", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ traveler: { ...me, idDocument: "X" } }));
    render(companionRoster());

    await act(async () => { await handleRef.current?.saveAll(); });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/travelers/me");
  });
});
