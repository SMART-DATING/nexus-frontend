import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type AmbientFeedback = { swipe: (progress: number) => void };

// A small local colour sample; no photo or derived data leaves the browser.
export const AmbientBackdrop = forwardRef<
  AmbientFeedback,
  { photoUrl?: string; publicPage?: boolean }
>(function AmbientBackdrop({ photoUrl, publicPage = false }, ref) {
  const backdrop = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      swipe(progress) {
        const node = backdrop.current;
        if (!node) return;
        const amount = Math.max(-1, Math.min(1, progress));
        node.dataset.swiping = amount === 0 ? "false" : "true";
        node.style.setProperty("--ambient-like", `${Math.max(0, amount)}`);
        node.style.setProperty("--ambient-skip", `${Math.max(0, -amount)}`);
      },
    }),
    [],
  );
  const [tone, setTone] = useState("108, 91, 216");
  useEffect(() => {
    let active = true;
    if (!photoUrl) {
      setTone("108, 91, 216");
      return;
    }
    const photo = new Image();
    photo.onload = () => {
      if (!active) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(photo, 0, 0, 16, 16);
        const pixels = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const light = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          if (pixels[i + 3] < 128 || light < 25 || light > 230) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          count++;
        }
        if (count)
          setTone([r, g, b].map((v) => Math.round(v / count)).join(", "));
      } catch {
        setTone("108, 91, 216");
      }
    };
    photo.onerror = () => {
      if (active) setTone("108, 91, 216");
    };
    photo.src = photoUrl;
    return () => {
      active = false;
      photo.onload = null;
      photo.onerror = null;
    };
  }, [photoUrl]);
  return (
    <div
      ref={backdrop}
      aria-hidden="true"
      className={`ambient-backdrop${publicPage ? " public-ambient" : ""}`}
      style={{ "--ambient-tone": tone } as CSSProperties}
    >
      <i />
      <b />
      <span className="ambient-like" />
      <span className="ambient-skip" />
    </div>
  );
});
