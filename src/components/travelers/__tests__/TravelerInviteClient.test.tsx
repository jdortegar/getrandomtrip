import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";
import TravelerInviteClient, {
  type TravelerInviteResolution,
} from "../TravelerInviteClient";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const sessionState = vi.hoisted(() => ({
  value: { status: "unauthenticated", data: null } as {
    status: string;
    data: { user?: { email?: string | null; emailVerified?: boolean } } | null;
  },
}));
const signOut = vi.hoisted(() => vi.fn());
const authModalProps = vi.hoisted(() => ({ last: null as Record<string, unknown> | null }));

vi.mock("next-auth/react", () => ({
  useSession: () => sessionState.value,
  signOut,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/auth/AuthModal", () => ({
  default: (props: Record<string, unknown>) => {
    authModalProps.last = props;
    return null;
  },
}));

const copy = enCopy.inviteTravelers;
// Default payload for a viewer who is not signed in with the invited address:
// the server sends the masked form only.
const okResolution: TravelerInviteResolution = {
  ok: true,
  buyerFirstName: "Ana",
  idDocumentRequired: true,
  maskedEmail: "j***@gmail.com",
};
// Server-rendered payload for a viewer already signed in with the invited address.
const matchingResolution: TravelerInviteResolution = {
  ...okResolution,
  invitedEmail: "jane.doe@gmail.com",
};

let container: HTMLDivElement;
let root: Root;

function render(resolution: TravelerInviteResolution, inviteCopy = copy) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <TravelerInviteClient
        authCopy={{ auth: enCopy.auth } as never}
        copy={inviteCopy}
        locale="en"
        resolution={resolution}
        token="tok"
      />,
    );
  });
}

beforeEach(() => {
  sessionState.value = { status: "unauthenticated", data: null };
  authModalProps.last = null;
  signOut.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});

describe("TravelerInviteClient — invited email", () => {
  it("shows the masked hint and an editable, unprefilled email in the sign-up modal (T11)", () => {
    render(okResolution);

    expect(container.textContent).toContain(
      copy.landingEmailHint.replace("{maskedEmail}", "j***@gmail.com"),
    );
    expect(container.textContent).not.toContain("jane.doe@gmail.com");
    expect(authModalProps.last).not.toHaveProperty("initialEmail", "jane.doe@gmail.com");
    expect(authModalProps.last?.lockEmail).toBeFalsy();
    expect(authModalProps.last?.initialEmail).toBeUndefined();
  });

  it("omits the hint when there is no masked address", () => {
    render({ ...okResolution, maskedEmail: null });
    expect(container.textContent).not.toContain("***");
  });

  it("blocks a signed-in account the server flagged as a different email, showing only the masked address (T11)", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "someone.else@example.com" } },
    };
    render({ ...okResolution, emailMismatch: true });

    expect(container.textContent).toContain(
      copy.landingEmailMismatch.replace("{maskedEmail}", "j***@gmail.com"),
    );
    expect(container.textContent).not.toContain("jane.doe@gmail.com");
    expect(container.querySelector("form")).toBeNull();

    const switchButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === copy.landingSwitchAccount,
    )!;
    act(() => switchButton.click());
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("still blocks when the client itself can tell the signed-in account differs (T2)", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "someone.else@example.com" } },
    };
    render(matchingResolution);

    expect(container.textContent).toContain(
      copy.landingEmailMismatch.replace("{maskedEmail}", "j***@gmail.com"),
    );
    expect(container.querySelector("form")).toBeNull();
  });

  it("shows the details form for a signed-in account whose email matches case-insensitively (T2)", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "Jane.Doe@Gmail.com" } },
    };
    render(matchingResolution);

    expect(container.querySelector("form")).not.toBeNull();
    expect(container.textContent).not.toContain("j***@gmail.com");
  });

  it("shows the mismatch message when the server rejects with email_mismatch, even though the client never held the full address (T11)", async () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "someone.else@example.com" } },
    };
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "email_mismatch" }, { status: 403 }),
    );
    render(okResolution);

    const input = container.querySelector<HTMLInputElement>("#traveler-invite-idDocument")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "ID1");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    });
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain(
      copy.landingEmailMismatch.replace("{maskedEmail}", "j***@gmail.com"),
    );
  });
});

describe("TravelerInviteClient — ended trips", () => {
  it.each([
    ["en", enCopy.inviteTravelers],
    ["es", esCopy.inviteTravelers],
  ])("renders the localized ended message (%s) (T1)", (_, dict) => {
    render({ ok: false, reason: "ended" }, dict as never);
    expect(container.textContent).toContain(dict.landingReasonEnded);
    expect(dict.landingReasonEnded.length).toBeGreaterThan(0);
  });
});

describe("TravelerInviteClient — verified email required (T12)", () => {
  const inbox = copy.landingVerifyInbox.replace("{maskedEmail}", "j***@gmail.com");

  it("sends the invite return path to the sign-up modal so verification comes back here", () => {
    render(okResolution);
    expect(authModalProps.last).toMatchObject({ inviteReturnPath: "/en/invite/tok" });
  });

  it("shows the check-your-inbox state, not the form, for a signed-in but unverified account", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com", emailVerified: false } },
    };
    render(matchingResolution);

    expect(container.textContent).toContain(inbox);
    expect(container.textContent).not.toContain("jane.doe@gmail.com");
    expect(container.querySelector("form")).toBeNull();
  });

  it("falls back to the session address (masked) when the payload has none", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com", emailVerified: false } },
    };
    render({ ...okResolution, maskedEmail: null });

    expect(container.textContent).toContain(inbox);
  });

  it("shows the form for a verified account", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com", emailVerified: true } },
    };
    render(matchingResolution);

    expect(container.querySelector("form")).not.toBeNull();
    expect(container.textContent).not.toContain(inbox);
  });

  it("switches to the same state when the server answers email_unverified", async () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com", emailVerified: true } },
    };
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "email_unverified" }, { status: 403 }));
    render(matchingResolution);

    const input = container.querySelector<HTMLInputElement>("#traveler-invite-idDocument")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "ID1");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    });
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(container.textContent).toContain(inbox);
    expect(container.querySelector("form")).toBeNull();
  });

  it("prefers the mismatch message over the unverified state", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "someone.else@example.com", emailVerified: false } },
    };
    render({ ...okResolution, emailMismatch: true });

    expect(container.textContent).toContain(
      copy.landingEmailMismatch.replace("{maskedEmail}", "j***@gmail.com"),
    );
    expect(container.textContent).not.toContain(inbox);
  });
});

describe("TravelerInviteClient — inbox address (T16)", () => {
  const unverified = (email: string) => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email, emailVerified: false } },
    };
  };

  it("names the session account's own (masked) address, not the invited one", () => {
    unverified("other.person@example.com");
    render({ ...okResolution, emailMismatch: false });

    expect(container.textContent).toContain(
      copy.landingVerifyInbox.replace("{maskedEmail}", "o***@example.com"),
    );
    expect(container.textContent).not.toContain("j***@gmail.com");
    expect(container.textContent).not.toContain("other.person@example.com");
  });

  it("names the invited address when it is also the session address", () => {
    unverified("jane.doe@gmail.com");
    render(matchingResolution);

    expect(container.textContent).toContain(
      copy.landingVerifyInbox.replace("{maskedEmail}", "j***@gmail.com"),
    );
  });

  it("lets the mismatch state win over the inbox state and offers no resend", () => {
    unverified("other.person@example.com");
    render({ ...okResolution, emailMismatch: true });

    expect(container.textContent).toContain(
      copy.landingEmailMismatch.replace("{maskedEmail}", "j***@gmail.com"),
    );
    expect(container.textContent).not.toContain(copy.landingResendCta);
  });
});

describe("TravelerInviteClient — resend verification (T15)", () => {
  const resendButton = () =>
    [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.includes(copy.landingResendCta) || b.getAttribute("aria-busy") === "true",
    ) as HTMLButtonElement | undefined;

  beforeEach(() => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com", emailVerified: false } },
    };
  });

  it.each([
    ["en", enCopy.inviteTravelers],
    ["es", esCopy.inviteTravelers],
  ])("has localized resend copy (%s)", (_, dict) => {
    for (const key of [
      "landingResendCta",
      "landingResendPending",
      "landingResendSent",
      "landingResendCooldown",
      "landingResendAlreadyVerified",
      "landingResendError",
    ] as const) {
      expect(dict[key].length).toBeGreaterThan(0);
    }
  });

  it("posts the invite return path and confirms the send", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ ok: true }));
    render(matchingResolution);

    await act(async () => resendButton()!.click());

    expect(fetch).toHaveBeenCalledWith("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: "/en/invite/tok" }),
    });
    expect(container.textContent).toContain(copy.landingResendSent);
  });

  it("shows a busy state and ignores a second click while pending", async () => {
    let resolve!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(matchingResolution);

    await act(async () => resendButton()!.click());
    const busy = container.querySelector<HTMLButtonElement>('button[aria-busy="true"]')!;
    expect(busy.disabled).toBe(true);
    expect(busy.textContent).toContain(copy.landingResendPending);
    await act(async () => busy.click());
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => resolve(Response.json({ ok: true })));
    expect(container.querySelector('button[aria-busy="true"]')).toBeNull();
    expect(container.textContent).toContain(copy.landingResendSent);
  });

  it("explains the cooldown on 429 and allows trying again later", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "cooldown", retryAfterSeconds: 30 }, { status: 429 }),
    );
    render(matchingResolution);

    await act(async () => resendButton()!.click());

    expect(container.textContent).toContain(copy.landingResendCooldown);
    expect(container.textContent).not.toContain(copy.landingResendSent);
    expect(resendButton()!.disabled).toBe(false);
  });

  it("says the account is already verified on 409", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json({ error: "already_verified" }, { status: 409 }),
    );
    render(matchingResolution);

    await act(async () => resendButton()!.click());

    expect(container.textContent).toContain(copy.landingResendAlreadyVerified);
  });

  it.each([
    ["a server error", () => vi.mocked(fetch).mockResolvedValue(Response.json({ error: "internal_error" }, { status: 500 }))],
    ["a network failure", () => vi.mocked(fetch).mockRejectedValue(new Error("offline"))],
  ])("shows a generic error on %s and allows retry", async (_, arrange) => {
    arrange();
    render(matchingResolution);

    await act(async () => resendButton()!.click());

    expect(container.textContent).toContain(copy.landingResendError);
    expect(resendButton()!.disabled).toBe(false);
  });
});
