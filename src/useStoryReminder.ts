import { useEffect, useState } from "react";
import type { User } from "./api";

const week = 7 * 24 * 60 * 60 * 1000;
type Reminder = { at: number; pending: boolean };
function read(key: string): Reminder | null {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
function write(key: string, value: Reminder) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing can disable storage. */
  }
}
export function needsStoryReminder(user: User | null) {
  return (
    !!user &&
    (user.profile.contextCount === 0 ||
      (typeof user.profile.contextCharacterCount === "number" &&
        user.profile.contextCharacterCount < 180))
  );
}

// A quiet inbox item, scoped to the account and limited to once a week on this device.
export function useStoryReminder(user: User | null) {
  const [pending, setPending] = useState(false);
  const key = `nexus-story-reminder:${user?.id}`;
  const needsMore = needsStoryReminder(user);
  useEffect(() => {
    setPending(false);
    if (!user) return;
    const saved = read(key);
    if (!needsMore) {
      if (saved?.pending) write(key, { ...saved, pending: false });
      return;
    }
    if (saved?.pending) {
      setPending(true);
      return;
    }
    if (saved && Date.now() - saved.at < week) return;
    const timer = setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      write(key, { at: Date.now(), pending: true });
      setPending(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [key, needsMore, user?.id]);
  function dismiss() {
    write(key, { at: Date.now(), pending: false });
    setPending(false);
  }
  return { pending: pending && needsMore, dismiss };
}
