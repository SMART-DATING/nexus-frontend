let motion: { frame: HTMLElement; request: number } | null = null;

function stopMotion() {
  if (motion) cancelAnimationFrame(motion.request);
  motion = null;
}

/** A bounded, eased journey between scenes, in either direction. */
export function showLandingFrame(frame: HTMLElement) {
  stopMotion();
  const start = window.scrollY;
  const top = Math.max(0, frame.getBoundingClientRect().top + start);
  if (
    Math.abs(top - start) < 1 ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    window.scrollTo({ top, behavior: "instant" });
    return;
  }
  let began: number | undefined;
  const transition = { frame, request: 0 };
  motion = transition;
  function tick(now: number) {
    if (motion !== transition) return;
    began ??= now;
    const progress = Math.min(1, Math.max(0, (now - began) / 480));
    const eased = progress * progress * (3 - 2 * progress);
    window.scrollTo({
      top: start + (top - start) * eased,
      behavior: "instant",
    });
    if (progress < 1) transition.request = requestAnimationFrame(tick);
    else motion = null;
  }
  transition.request = requestAnimationFrame(tick);
}

export function installLandingNavigation() {
  const frames = [
    ...document.querySelectorAll<HTMLElement>(".landing-hero, .landing-screen"),
  ];
  let lastWheel = 0;
  let switched = false;
  let distance = 0;
  let direction = 0;
  const enabled = () =>
    window.innerWidth >= 900 &&
    window.innerHeight >= 600 &&
    !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches &&
    !document.querySelector("dialog[open]");
  function target(step: number) {
    if (motion) {
      return frames[frames.indexOf(motion.frame) + step] ?? null;
    }
    const containing = frames.findIndex((frame) => {
      const rect = frame.getBoundingClientRect();
      return rect.top <= 12 && rect.bottom > 12;
    });
    const index =
      containing >= 0
        ? containing
        : frames.reduce(
            (best, frame, i) =>
              Math.abs(frame.getBoundingClientRect().top) <
              Math.abs(frames[best].getBoundingClientRect().top)
                ? i
                : best,
            0,
          );
    const rect = frames[index].getBoundingClientRect();
    // Let taller content scroll normally until its edge, including expanded FAQ answers.
    if (step > 0 && rect.bottom > window.innerHeight + 12) return null;
    if (step < 0 && rect.top < -12) return null;
    return frames[index + step] ?? null;
  }
  function scrollable(node: HTMLElement | null, step: number) {
    while (node && node !== document.body) {
      if (
        /(auto|scroll)/.test(getComputedStyle(node).overflowY) &&
        node.scrollHeight > node.clientHeight &&
        (step > 0
          ? node.scrollTop + node.clientHeight < node.scrollHeight - 1
          : node.scrollTop > 0)
      )
        return true;
      node = node.parentElement;
    }
    return false;
  }
  function wheel(event: WheelEvent) {
    if (
      !enabled() ||
      event.ctrlKey ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
      !event.deltaY
    )
      return;
    const step = Math.sign(event.deltaY);
    if (scrollable(event.target as HTMLElement, step)) return;
    const now = window.performance.now();
    if (now - lastWheel > 160 || direction !== step) {
      switched = false;
      distance = 0;
    }
    lastWheel = now;
    if (switched || (motion && direction === step)) {
      event.preventDefault();
      return;
    } // Trackpad momentum belongs to the same gesture.
    const frame = target(step);
    if (!frame) return;
    event.preventDefault();
    if (direction !== step) distance = 0;
    direction = step;
    distance +=
      Math.abs(event.deltaY) *
      (event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1);
    if (distance < 18) return;
    switched = true;
    showLandingFrame(frame);
  }
  function key(event: KeyboardEvent) {
    if (
      !enabled() ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      (event.target as HTMLElement).closest(
        "input,textarea,select,button,a,[contenteditable=true]",
      )
    )
      return;
    const step =
      event.key === "PageDown" || (event.key === " " && !event.shiftKey)
        ? 1
        : event.key === "PageUp" || (event.key === " " && event.shiftKey)
          ? -1
          : 0;
    if (!step) return;
    const frame = target(step);
    if (frame) {
      event.preventDefault();
      showLandingFrame(frame);
    }
  }
  window.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("keydown", key);
  window.addEventListener("pointerdown", stopMotion);
  window.addEventListener("resize", stopMotion);
  return () => {
    stopMotion();
    window.removeEventListener("wheel", wheel);
    window.removeEventListener("keydown", key);
    window.removeEventListener("pointerdown", stopMotion);
    window.removeEventListener("resize", stopMotion);
  };
}
