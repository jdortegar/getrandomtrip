import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TravelerRow, type TravelerRowHandle } from "@/components/app/travelers/TravelerRow";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO } from "@/types/traveler";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const copy: InviteTravelersDict = {
  eyebrow: "",
  heading: "",
  subtitle: "",
  notifTitle: "",
  deadlineLabel: "",
  progressLabel: "",
  lockedBanner: "",
  supportLinkLabel: "",
  footnote: "",
  travelerLabel: "",
  adultTag: "",
  minorTag: "",
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

function baseTraveler(overrides: Partial<TravelerDTO> = {}): TravelerDTO {
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

let container: HTMLDivElement;
let root: Root;
let handleRef: { current: TravelerRowHandle | null };

function render(traveler: TravelerDTO, onUpdated = vi.fn()) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  handleRef = { current: null };
  act(() => {
    root.render(
      <TravelerRow
        copy={copy}
        locked={false}
        onUpdated={onUpdated}
        ref={(el) => {
          handleRef.current = el;
        }}
        traveler={traveler}
        travelerNumber={2}
      />,
    );
  });
  return { onUpdated };
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

describe("TravelerRow — save() return value", () => {
  it("resolves with the server-returned traveler on a successful save", async () => {
    const traveler = baseTraveler();
    const updated = baseTraveler({ status: "COMPLETE" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ traveler: updated }),
    });
    const { onUpdated } = render(traveler);

    let result: TravelerDTO | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toEqual(updated);
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it("resolves with the original (unchanged) traveler when the save request fails", async () => {
    const traveler = baseTraveler();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "generic" }),
    });
    const { onUpdated } = render(traveler);

    let result: TravelerDTO | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toEqual(traveler);
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("resolves with the original (unchanged) traveler when a minor row fails local validation", async () => {
    const traveler = baseTraveler({
      kind: "MINOR",
      fullName: null,
      dateOfBirth: null,
      idDocument: null,
    });
    const { onUpdated } = render(traveler);

    let result: TravelerDTO | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toEqual(traveler);
    expect(fetch).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
