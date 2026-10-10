/** One short scene change instead of the browser's distance-dependent smooth scroll. */
export function showLandingFrame(frame: HTMLElement) {
  const top = frame.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    const content = frame.querySelector("section") ?? frame;
    content.getAnimations?.().forEach((animation) => animation.cancel());
    content.animate?.(
      [
        { opacity: 0.65, translate: "0 10px" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: 170, easing: "ease-out" },
    );
  }
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
    const now = performance.now();
    if (now - lastWheel > 160) {
      switched = false;
      distance = 0;
    }
    lastWheel = now;
    if (switched) {
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
  return () => {
    window.removeEventListener("wheel", wheel);
    window.removeEventListener("keydown", key);
  };
}
