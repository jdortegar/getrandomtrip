import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProviders, signIn } from "next-auth/react";
import AuthModal from "../AuthModal";
import TripperInviteClient from "../TripperInviteClient";
import en from "@/dictionaries/en.json";

vi.mock("next-auth/react", () => ({ getProviders: vi.fn(), signIn: vi.fn() }));
vi.mock("@/lib/helpers/tracking/gtm", () => ({
  trackButtonClick: vi.fn(),
  trackCustomEvent: vi.fn(),
}));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
const providers = {
  google: {
    id: "google",
    name: "Google",
    type: "oauth",
    signinUrl: "/api/auth/signin/google",
    callbackUrl: "/api/auth/callback/google",
  },
} as unknown as NonNullable<Awaited<ReturnType<typeof getProviders>>>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.mocked(getProviders).mockResolvedValue(providers);
  vi.mocked(signIn).mockResolvedValue(undefined);
  vi.stubGlobal("localStorage", { getItem: () => null });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ ok: true })),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
const googleButton = () =>
  [...container.querySelectorAll("button")].find((button) =>
    button.textContent?.includes(en.auth.continueWithGoogle),
  );
async function clickGoogle() {
  await act(async () => {
    googleButton()!.click();
  });
}

for (const entry of ["login", "invite"] as const) {
  describe(`Google availability and pending feedback: ${entry}`, () => {
    const render = async (isOpen = true) => {
      await act(async () => {
        root.render(
          entry === "login" ? (
            <AuthModal dict={en} isOpen={isOpen} onClose={() => {}} />
          ) : (
            <TripperInviteClient
              authCopy={en.auth}
              copy={en.tripperInviteAccept}
              locale="en"
              resolution={{
                ok: true,
                email: "test@example.com",
                hasAccount: false,
                kind: "TRIPPER",
              }}
              token="invite-token"
            />
          ),
        );
      });
    };
    it("hides Google and its divider while loading, then shows the configured provider", async () => {
      const request = deferred<Awaited<ReturnType<typeof getProviders>>>();
      vi.mocked(getProviders).mockReturnValue(request.promise);
      await render();
      expect(googleButton()).toBeUndefined();
      expect(container.textContent).not.toContain(en.auth.orContinueWith);
      expect(container.querySelector('input[type="password"]')).not.toBeNull();
      await act(async () => request.resolve(providers));
      expect(googleButton()).toBeDefined();
      expect(container.textContent).toContain(en.auth.orContinueWith);
    });
    it.each(["absent", "null", "network"])(
      "hides Google on %s provider lookup",
      async (failure) => {
        if (failure === "network")
          vi.mocked(getProviders).mockRejectedValue(new Error("Offline"));
        else
          vi.mocked(getProviders).mockResolvedValue(
            failure === "null" ? null : ({} as typeof providers),
          );
        await render();
        expect(googleButton()).toBeUndefined();
        expect(container.textContent).not.toContain(en.auth.orContinueWith);
        expect(
          container.querySelector('input[type="password"]'),
        ).not.toBeNull();
        expect(signIn).not.toHaveBeenCalled();
      },
    );
    it.each(["success", "rejection"])(
      "blocks duplicate redirects, shows pending feedback, and recovers after %s",
      async (outcome) => {
        const request = deferred<Awaited<ReturnType<typeof signIn>>>();
        vi.mocked(signIn).mockReturnValueOnce(request.promise);
        await render();
        const button = googleButton()!;
        await act(async () => {
          button.click();
          button.click();
        });
        expect(signIn).toHaveBeenCalledTimes(1);
        expect(button.disabled).toBe(true);
        expect(button.getAttribute("aria-busy")).toBe("true");
        expect(button.textContent).toContain(en.auth.loading);
        expect(
          button.querySelector('svg.animate-spin[aria-hidden="true"]'),
        ).not.toBeNull();
        expect(signIn).toHaveBeenCalledWith("google", {
          callbackUrl: entry === "login" ? window.location.href : "/en/",
        });
        await act(async () => {
          if (outcome === "rejection") request.reject(new Error("Offline"));
          else request.resolve(undefined);
        });
        expect(button.disabled).toBe(false);
        expect(button.getAttribute("aria-busy")).toBe("false");
        expect(button.textContent).toContain(en.auth.continueWithGoogle);
        if (outcome === "rejection") {
          expect(
            container.querySelector('[role="alert"]')?.textContent,
          ).toContain(en.auth.loginFailed);
          await clickGoogle();
          expect(signIn).toHaveBeenCalledTimes(2);
        }
      },
    );
    if (entry === "login") {
      it.each(["null", "network"])(
        "retries a %s lookup when the mounted modal reopens",
        async (failure) => {
          await render(false);
          expect(getProviders).not.toHaveBeenCalled();
          if (failure === "network")
            vi.mocked(getProviders).mockRejectedValueOnce(new Error("Offline"));
          else vi.mocked(getProviders).mockResolvedValueOnce(null);
          await render();
          expect(googleButton()).toBeUndefined();
          await render(false);
          await render();
          expect(getProviders).toHaveBeenCalledTimes(2);
          expect(googleButton()).toBeDefined();
        },
      );

      it("hides a prior successful result while revalidating on reopen", async () => {
        await render();
        expect(googleButton()).toBeDefined();
        await render(false);
        const request = deferred<Awaited<ReturnType<typeof getProviders>>>();
        vi.mocked(getProviders).mockReturnValueOnce(request.promise);
        await render();
        expect(googleButton()).toBeUndefined();
        await act(async () => request.resolve(providers));
        expect(googleButton()).toBeDefined();
      });
    }
    if (entry === "invite") {
      it.each(["HTTP", "network"])(
        "preserves the invite by stopping before Google on %s init failure",
        async (failure) => {
          if (failure === "HTTP")
            vi.mocked(fetch).mockResolvedValueOnce(
              new Response("", { status: 400 }),
            );
          else vi.mocked(fetch).mockRejectedValueOnce(new Error("Offline"));
          await render();
          await clickGoogle();
          expect(signIn).not.toHaveBeenCalled();
          expect(
            container.querySelector('[role="alert"]')?.textContent,
          ).toContain(en.auth.loginFailed);
          expect(googleButton()?.disabled).toBe(false);
          await clickGoogle();
          expect(signIn).toHaveBeenCalledOnce();
          expect(fetch).toHaveBeenLastCalledWith(
            "/api/tripper-invite/oauth-init",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: "invite-token" }),
            },
          );
        },
      );
    }
  });
}
