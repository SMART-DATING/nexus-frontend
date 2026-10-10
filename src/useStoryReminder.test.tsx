import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { needsStoryReminder, useStoryReminder } from "./useStoryReminder";
import type { User } from "./api";
const user = (id = 1, characters = 60): User => ({
  id,
  email: "test@example.com",
  preferences: { minAge: 18, maxAge: 60 },
  profile: {
    userId: id,
    properties: [],
    interests: [],
    contextCount: 1,
    contextCharacterCount: characters,
  },
});
beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("waits quietly, remembers dismissal for a week and scopes reminders to each account", () => {
  const { result, rerender } = renderHook(
    ({ account }) => useStoryReminder(account),
    { initialProps: { account: user() } },
  );
  expect(result.current.pending).toBe(false);
  act(() => vi.advanceTimersByTime(30000));
  expect(result.current.pending).toBe(true);
  act(() => result.current.dismiss());
  rerender({ account: user(2) });
  act(() => vi.advanceTimersByTime(30000));
  expect(result.current.pending).toBe(true);
  rerender({ account: user(1) });
  act(() => vi.advanceTimersByTime(30000));
  expect(result.current.pending).toBe(false);
});
it("removes a pending suggestion once the story is sufficient", () => {
  const { result, rerender } = renderHook(
    ({ account }) => useStoryReminder(account),
    { initialProps: { account: user() } },
  );
  act(() => vi.advanceTimersByTime(30000));
  expect(result.current.pending).toBe(true);
  rerender({ account: user(1, 200) });
  expect(result.current.pending).toBe(false);
  expect(needsStoryReminder(null)).toBe(false);
  expect(needsStoryReminder(user(1, 200))).toBe(false);
});
