import { useEffect, useState, type CSSProperties } from "react";

// A small local colour sample; no photo or derived data leaves the browser.
export function AmbientBackdrop({ photoUrl }: { photoUrl?: string }) {
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
      aria-hidden="true"
      className="ambient-backdrop"
      style={{ "--ambient-tone": tone } as CSSProperties}
    >
      <i />
      <b />
    </div>
  );
}
