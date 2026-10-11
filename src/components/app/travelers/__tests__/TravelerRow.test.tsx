import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TravelerRow, type TravelerRowHandle } from "@/components/app/travelers/TravelerRow";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO } from "@/types/traveler";


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
  emailLockedJoinedHint: "Se unió: el email no se puede cambiar",
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
    joined: false,
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;
let handleRef: { current: TravelerRowHandle | null };

function render(traveler: TravelerDTO, onUpdated = vi.fn(), locked = false) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  handleRef = { current: null };
  act(() => {
    root.render(
      <TravelerRow
        copy={copy}
        locked={locked}
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

    let result: TravelerDTO | null | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toEqual(updated);
    expect(onUpdated).toHaveBeenCalledWith(updated);
  });

  it("resolves null when the save request fails", async () => {
    const traveler = baseTraveler();
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "generic" }),
    });
    const { onUpdated } = render(traveler);

    let result: TravelerDTO | null | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toBeNull();
    expect(onUpdated).not.toHaveBeenCalled();
  });

  it("resolves null when a minor row fails local validation", async () => {
    const traveler = baseTraveler({
      kind: "MINOR",
      fullName: null,
      dateOfBirth: null,
      idDocument: null,
    });
    const { onUpdated } = render(traveler);

    let result: TravelerDTO | null | undefined;
    await act(async () => {
      result = await handleRef.current?.save();
    });

    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
  });
});

it.each(["PENDING", "INVITED", "COMPLETE"] as const)("keeps empty persisted fields editable after cutoff, including %s rows", (status) => {
  render(baseTraveler({ status, idDocument: " " }), vi.fn(), true);
  expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-fullName")!.disabled).toBe(true);
  expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-idDocument")!.disabled).toBe(false);
  expect(container.querySelector("button")).not.toBeNull();
});

it("does not lock a formerly empty field as the user types, only after it is saved", async () => {
  const traveler = baseTraveler({ idDocument: null });
  const updated = { ...traveler, idDocument: "PASSPORT", status: "COMPLETE" as const };
  vi.mocked(fetch).mockResolvedValue(Response.json({ traveler: updated }));
  render(traveler, vi.fn(), true);
  const input = container.querySelector<HTMLInputElement>("#traveler-trav-1-idDocument")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "PASSPORT");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(input.disabled).toBe(false);
  await act(async () => { await handleRef.current?.save(); });
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ fullName: traveler.fullName, email: traveler.email, idDocument: "PASSPORT" }) }));
  act(() => root.render(<TravelerRow copy={copy} locked onUpdated={vi.fn()} traveler={updated} travelerNumber={2} />));
  expect(input.disabled).toBe(true);
});

describe("TravelerRow — auto-sent invites (T3)", () => {
  const textCopy: InviteTravelersDict = {
    ...copy,
    resendInviteAction: "Resend invite",
    invitedNote: "Invited {date}",
    inviteResentNote: "Invite resent just now",
    savedNote: "Saved just now",
  };

  function renderWithText(traveler: TravelerDTO) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    handleRef = { current: null };
    act(() => {
      root.render(
        <TravelerRow
          copy={textCopy}
          locked={false}
          onUpdated={vi.fn()}
          ref={(el) => {
            handleRef.current = el;
          }}
          traveler={traveler}
          travelerNumber={2}
        />,
      );
    });
  }

  it("labels the invite action 'Resend invite' for every adult row, whatever its status", () => {
    renderWithText(baseTraveler({ status: "PENDING" }));
    expect(container.querySelector("button")!.getAttribute("aria-label")).toBe("Resend invite");
  });

  it("tells the buyer an invite went out when a save auto-sent one", async () => {
    const updated = baseTraveler({ status: "INVITED", invitedAt: new Date().toISOString() });
    vi.mocked(fetch).mockResolvedValue(Response.json({ traveler: updated, invited: true }));
    renderWithText(baseTraveler({ email: null }));

    await act(async () => { await handleRef.current?.save(); });

    expect(container.textContent).toContain("Invited ");
    expect(container.textContent).not.toContain("{date}");
    expect(container.textContent).not.toContain("Saved just now");
  });

  it("does not POST a second invite when the save already auto-sent one", async () => {
    const updated = baseTraveler({ status: "INVITED", invitedAt: new Date().toISOString() });
    vi.mocked(fetch).mockResolvedValue(Response.json({ traveler: updated, invited: true }));
    renderWithText(baseTraveler());

    await act(async () => {
      container.querySelector("button")!.click();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/travelers/trav-1");
  });

  it("explicitly resends through POST /invite when the save sent nothing (same email)", async () => {
    const invited = baseTraveler({ status: "INVITED", invitedAt: new Date().toISOString() });
    vi.mocked(fetch)
      .mockResolvedValueOnce(Response.json({ traveler: invited }))
      .mockResolvedValueOnce(Response.json({ traveler: invited }));
    renderWithText(invited);

    await act(async () => {
      container.querySelector("button")!.click();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("/api/travelers/trav-1/invite");
    expect(container.textContent).toContain("Invite resent just now");
  });
});

describe("TravelerRow — buyer invite badge (T8)", () => {
  const badgeCopy: InviteTravelersDict = {
    ...copy,
    resendInviteAction: "Resend invite",
    sendInviteErrorGeneric: "Invite failed",
  };

  function renderBadge(traveler: TravelerDTO) {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    handleRef = { current: null };
    act(() => {
      root.render(
        <TravelerRow
          copy={badgeCopy}
          locked={false}
          onUpdated={vi.fn()}
          ref={(el) => {
            handleRef.current = el;
          }}
          traveler={traveler}
          travelerNumber={2}
        />,
      );
    });
  }
  const resend = () => container.querySelector('button[aria-label="Resend invite"]');

  it("says 'No email' for an adult without a saved email", () => {
    renderBadge(baseTraveler({ email: null }));
    expect(container.textContent).toContain("Sin email");
  });

  it("shows 'Invitation sent' with the sent date and keeps Resend invite", () => {
    renderBadge(baseTraveler({ status: "INVITED", invitedAt: "2026-09-30T10:00:00.000Z" }));
    expect(container.textContent).toContain("Enviada ");
    expect(container.textContent).not.toContain("{date}");
    expect(resend()).not.toBeNull();
  });

  it("shows 'Joined' and hides Resend invite once the companion linked an account", () => {
    renderBadge(baseTraveler({ status: "COMPLETE", joined: true, invitedAt: "2026-09-30T10:00:00.000Z" }));
    expect(container.textContent).toContain("Se unió");
    expect(container.textContent).not.toContain("Enviada");
    expect(resend()).toBeNull();
  });

  it("says the invite was not sent when an email is saved but no invite went out", () => {
    renderBadge(baseTraveler({ invitedAt: null }));
    expect(container.textContent).toContain("Sin enviar");
  });

  it("keeps the existing missing-details status badge next to the invite badge", () => {
    renderBadge(baseTraveler({ status: "PENDING", idDocument: null }));
    expect(container.textContent).toContain("Pendiente");
  });

  it("shows no invite badge on minor rows", () => {
    renderBadge(baseTraveler({ kind: "MINOR", email: null, dateOfBirth: "2016-01-01T00:00:00.000Z" }));
    expect(container.textContent).not.toContain("Sin email");
  });

  it("shows the send error and keeps the row usable when a save could not issue the invite (T14a)", async () => {
    const updated = baseTraveler({ status: "COMPLETE" });
    vi.mocked(fetch).mockResolvedValue(Response.json({ traveler: updated, inviteFailed: true }));
    renderBadge(baseTraveler({ email: null }));

    await act(async () => { await handleRef.current?.save(); });

    expect(container.textContent).toContain("Invite failed");
    expect(container.textContent).not.toContain("Guardado");
    expect(resend()).not.toBeNull();
  });
});

describe("TravelerRow — a companion's own row (T6)", () => {
  it("locks the email, offers no invite action and shows no invite badge", () => {
    render(baseTraveler({ isSelf: true, joined: true, status: "COMPLETE", idDocument: null }));

    expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-email")!.disabled).toBe(true);
    expect(container.querySelector("button")).toBeNull();
    expect(container.textContent).not.toContain("Se unió");
    expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-idDocument")!.disabled).toBe(false);
  });
});

describe("TravelerRow — joined email lock (T10)", () => {
  it("makes the email read-only with a hint once the companion joined", () => {
    render(baseTraveler({ status: "COMPLETE", joined: true, email: "joined@example.com" }));

    expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-email")!.disabled).toBe(true);
    expect(container.textContent).toContain("Se unió: el email no se puede cambiar");
  });

  it("keeps the email editable before the companion joins", () => {
    render(baseTraveler({ status: "INVITED", joined: false }));

    expect(container.querySelector<HTMLInputElement>("#traveler-trav-1-email")!.disabled).toBe(false);
    expect(container.textContent).not.toContain("el email no se puede cambiar");
  });
});
