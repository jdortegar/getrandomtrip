import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TravelerRosterSection,
  type TravelerRosterSectionHandle,
} from "@/components/app/travelers/TravelerRosterSection";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO, TravelerRoster } from "@/types/traveler";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  sendInviteAction: "",
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
  landingReasonLocked: "",
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

describe("TravelerRosterSection — saveAll() completeness", () => {
  it("resolves true when every row is COMPLETE after saving", async () => {
    const t1 = traveler({ id: "t1" });
    const t2 = traveler({ id: "t2", fullName: "Ana B" });
    (fetch as ReturnType<typeof vi.fn>).mockImplementation(
      async (url: string) => ({
        ok: true,
        json: async () => ({
          traveler: {
            ...(url.includes("t1") ? t1 : t2),
            status: "COMPLETE",
          },
        }),
      }),
    );
    render(roster([t1, t2]));

    let allComplete: boolean | undefined;
    await act(async () => {
      allComplete = await handleRef.current?.saveAll();
    });

    expect(allComplete).toBe(true);
  });

  it("resolves false when at least one row is not COMPLETE after saving", async () => {
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

    let allComplete: boolean | undefined;
    await act(async () => {
      allComplete = await handleRef.current?.saveAll();
    });

    expect(allComplete).toBe(false);
  });
});

describe("TravelerRosterSection — locked banner days", () => {
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
