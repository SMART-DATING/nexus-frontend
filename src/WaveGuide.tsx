import { useEffect, useState, type ReactNode } from "react";

export function WaveGuide({
  children,
  mood = "idle",
  compact = false,
}: {
  children?: ReactNode;
  mood?: "idle" | "listening" | "thinking";
  compact?: boolean;
}) {
  const [wave, setWave] = useState(false);
  useEffect(() => {
    if (!wave) return;
    const timer = window.setTimeout(() => setWave(false), 1550);
    return () => window.clearTimeout(timer);
  }, [wave]);
  return (
    <div className={`wave-guide ${compact ? "compact" : ""} mood-${mood}`}>
      <button
        className={`guide-character ${wave ? "is-waving" : ""}`}
        type="button"
        aria-label="Поздороваться с Нексом"
        onClick={() => setWave(true)}
        onAnimationEnd={(event) => {
          if (event.animationName === "nex-peek") setWave(false);
        }}
      >
        <span className="guide-face" aria-hidden="true">
          <i />
          <i />
          <b />
        </span>
        <span className="guide-spark" aria-hidden="true">
          ✦
        </span>
      </button>
      <div className="guide-speech">
        <span className="guide-name">
          Некс <small>твой проводник</small>
        </span>
        {children}
      </div>
    </div>
  );
}
