import { useEffect, useState, type ReactNode } from "react";

export function WaveGuide({
  children,
  mood = "idle",
  compact = false,
  activity,
}: {
  children?: ReactNode;
  mood?: "idle" | "listening" | "thinking";
  compact?: boolean;
  activity?: "reading" | "music" | "nature" | "chat";
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
        className={`guide-character ${wave ? "is-waving" : ""}${activity ? ` activity-${activity}` : ""}`}
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
        {activity && (
          <span className="nex-activity" aria-hidden="true">
            {activity === "reading" && (
              <>
                <svg className="nex-book" viewBox="0 0 80 44">
                  <path d="M40 10Q23 0 4 7v30q19-7 36 3 17-10 36-3V7q-19-7-36 3Z" />
                  <path d="M40 10v30M12 15l20 3M12 22l20 3M48 18l20-3M48 25l20-3" />
                  <path
                    className="nex-page"
                    d="M40 10Q52 2 68 5v30q-16-2-28 5Z"
                  />
                </svg>
                <i className="nex-hand hand-left" />
                <i className="nex-hand hand-right" />
              </>
            )}
            {activity === "music" && (
              <>
                <span className="nex-headphones">
                  <i />
                  <b />
                </span>
                <span className="nex-note">♪</span>
                <span className="nex-note second-note">♫</span>
              </>
            )}
            {activity === "nature" && (
              <>
                <svg className="nex-sprig" viewBox="0 0 40 62">
                  <path className="sprig-stem" d="M13 60Q12 27 28 5" />
                  <path d="M23 27Q18 7 35 3q3 19-12 24Z" />
                  <path d="M17 44Q-2 39 4 22q20 1 13 22Z" />
                </svg>
                <span className="nex-butterfly">
                  <i />
                  <b />
                </span>
              </>
            )}
            {activity === "chat" && (
              <span className="nex-chat-bubble">
                <i />
                <i />
                <i />
              </span>
            )}
          </span>
        )}
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
