import { describe, it, expect, vi, beforeEach } from "vitest";
import { subscribeUnreadRefresh, publishUnreadRefresh } from "../unreadDotBus";

describe("unreadDotBus", () => {
  it("invokes a subscribed listener when publishUnreadRefresh is called", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUnreadRefresh(listener);

    publishUnreadRefresh();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("stops invoking the listener after unsubscribe is called", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUnreadRefresh(listener);

    unsubscribe();
    publishUnreadRefresh();

    expect(listener).not.toHaveBeenCalled();
  });

  it("fans out a single publish to every subscribed listener", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubscribeA = subscribeUnreadRefresh(listenerA);
    const unsubscribeB = subscribeUnreadRefresh(listenerB);

    publishUnreadRefresh();

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);
    unsubscribeA();
    unsubscribeB();
  });

  it("does not affect other listeners when only one unsubscribes", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const unsubscribeA = subscribeUnreadRefresh(listenerA);
    const unsubscribeB = subscribeUnreadRefresh(listenerB);

    unsubscribeA();
    publishUnreadRefresh();

    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledTimes(1);
    unsubscribeB();
  });
});
