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
    data: { user?: { email?: string | null } } | null;
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
const okResolution: TravelerInviteResolution = {
  ok: true,
  buyerFirstName: "Ana",
  idDocumentRequired: true,
  invitedEmail: "jane.doe@gmail.com",
  maskedEmail: "j***@gmail.com",
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
  it("prefills and locks the invited email in the sign-up modal (T2)", () => {
    render(okResolution);
    expect(authModalProps.last).toMatchObject({
      initialEmail: "jane.doe@gmail.com",
      lockEmail: true,
    });
  });

  it("blocks a signed-in account with a different email and shows the masked address (T2)", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "someone.else@example.com" } },
    };
    render(okResolution);

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

  it("shows the details form for a signed-in account whose email matches case-insensitively (T2)", () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "Jane.Doe@Gmail.com" } },
    };
    render(okResolution);

    expect(container.querySelector("form")).not.toBeNull();
    expect(container.textContent).not.toContain("j***@gmail.com");
  });

  it("shows the mismatch message when the server rejects with email_mismatch (T2)", async () => {
    sessionState.value = {
      status: "authenticated",
      data: { user: { email: "jane.doe@gmail.com" } },
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
