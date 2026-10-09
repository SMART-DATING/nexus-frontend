import { useState, type ReactNode } from "react";

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
  return (
    <div className={`wave-guide ${compact ? "compact" : ""} mood-${mood}`}>
      <button
        className={`guide-character ${wave ? "is-waving" : ""}`}
        type="button"
        aria-label="Поздороваться с Нексом"
        onClick={() => setWave((v) => !v)}
        aria-pressed={wave}
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
        {wave && (
          <small className="guide-greeting" role="status">
            Привет! Здесь можно быть собой ✦
          </small>
        )}
      </div>
    </div>
  );
}
