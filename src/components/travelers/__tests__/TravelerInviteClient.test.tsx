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
