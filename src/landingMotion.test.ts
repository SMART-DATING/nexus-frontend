import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { installLandingNavigation, showLandingFrame } from "./landingMotion";

let now = 0;
let request = 0;
let pending: Map<number, FrameRequestCallback>;
let cleanup: () => void;
let frames: HTMLElement[];
let scroll: ReturnType<typeof vi.spyOn>;

function advance(time: number) {
  now = time;
  const callbacks = [...pending.values()];
  pending.clear();
  callbacks.forEach((callback) => callback(time));
}

beforeEach(() => {
  now = 0;
  pending = new Map();
  vi.stubGlobal("innerWidth", 1440);
  vi.stubGlobal("innerHeight", 900);
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.spyOn(window.performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    pending.set(++request, callback);
    return request;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => pending.delete(id));
  scroll = vi.spyOn(window, "scrollTo").mockImplementation((options) => {
    vi.stubGlobal("scrollY", (options as ScrollToOptions).top ?? 0);
  });
  document.body.innerHTML =
    '<div class="landing-hero"></div><div class="landing-screen"></div><div class="landing-screen"></div>';
  frames = [...document.body.children] as HTMLElement[];
  frames.forEach((frame, index) => {
    vi.spyOn(frame, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          top: index * 900 - scrollY,
          bottom: (index + 1) * 900 - scrollY,
        }) as DOMRect,
    );
  });
  cleanup = installLandingNavigation();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("travels through intermediate positions and settles exactly in both directions", () => {
  showLandingFrame(frames[1]);
  expect(scroll).not.toHaveBeenCalled();
  advance(0);
  advance(120);
  expect(scrollY).toBeGreaterThan(0);
  expect(scrollY).toBeLessThan(450);
  advance(240);
  expect(scrollY).toBe(450);
  advance(480);
  expect(scrollY).toBe(900);
  showLandingFrame(frames[0]);
  advance(480);
  advance(720);
  expect(scrollY).toBe(450);
  advance(960);
  expect(scrollY).toBe(0);
});

it("absorbs same-direction inertia and smoothly reverses an unfinished journey", () => {
  const wheel = (deltaY: number) =>
    document.body.dispatchEvent(
      new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }),
    );
  wheel(80);
  advance(0);
  advance(240);
  expect(scrollY).toBe(450);
  wheel(80);
  wheel(-80);
  advance(240);
  advance(480);
  expect(scrollY).toBe(225);
  advance(720);
  expect(scrollY).toBe(0);
});

it("stops a pending journey on departure and lets pointer interaction interrupt it", () => {
  showLandingFrame(frames[1]);
  advance(0);
  advance(240);
  window.dispatchEvent(new Event("pointerdown"));
  advance(480);
  expect(scrollY).toBe(450);
  showLandingFrame(frames[1]);
  cleanup();
  advance(960);
  expect(scrollY).toBe(450);
});

it("moves immediately when reduced motion is requested", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  showLandingFrame(frames[1]);
  expect(scrollY).toBe(900);
  expect(pending.size).toBe(0);
});
