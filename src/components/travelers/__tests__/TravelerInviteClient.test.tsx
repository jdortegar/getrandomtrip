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
