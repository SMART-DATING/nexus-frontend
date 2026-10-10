import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Heart, RotateCcw, X } from "lucide-react";
import { value, type Profile } from "./api";
import { ProfileCard } from "./ProfileCard";

export function SwipeDeck({
  people,
  busy,
  onReact,
  onPhotoChange,
}: {
  people: Profile[];
  busy: boolean;
  onReact: (p: Profile, like: boolean) => Promise<boolean>;
  onFocus: (id: number) => void;
  cycle: number;
  reviewed: number;
  liked: number;
  onPhotoChange?: (url?: string) => void;
}) {
  const p = people[0],
    name = value(p, "display_name");
  const [leaving, setLeaving] = useState<"like" | "skip" | null>(null);
  const [dragging, setDragging] = useState(false);
  const card = useRef<HTMLElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
  } | null>(null);
  const frame = useRef<number | null>(null);
  const choosing = useRef(false),
    alive = useRef(false);
  function paint(dx: number) {
    card.current?.style.setProperty("--swipe-x", `${dx}px`);
    card.current?.style.setProperty("--swipe-rotation", `${dx / 110}deg`);
    card.current?.style.setProperty(
      "--like-opacity",
      `${Math.max(0, Math.min(1, dx / 120))}`,
    );
    card.current?.style.setProperty(
      "--skip-opacity",
      `${Math.max(0, Math.min(1, -dx / 120))}`,
    );
  }
  function stopFrame() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopFrame();
    };
  }, []);
  useEffect(() => {
    stopFrame();
    gesture.current = null;
    paint(0);
    setDragging(false);
    setLeaving(null);
  }, [p.userId]);
  const nextPhoto = people[1]?.photos?.[0]?.url ?? people[1]?.avatarUrl;
  useEffect(() => {
    if (nextPhoto) {
      const image = new Image();
      image.src = nextPhoto;
    }
  }, [nextPhoto]);
  async function choose(like: boolean) {
    if (busy || choosing.current) return;
    choosing.current = true;
    stopFrame();
    const currentX = parseFloat(
      card.current?.style.getPropertyValue("--swipe-x") || "0",
    );
    const distance = Math.max(120, (card.current?.clientWidth ?? 600) * 0.18);
    const targetX = currentX + (like ? distance : -distance);
    card.current?.style.setProperty("--exit-x", `${targetX}px`);
    card.current?.style.setProperty(
      "--exit-rotation",
      `${Math.max(-5, Math.min(5, targetX / 110))}deg`,
    );
    card.current?.style.setProperty("--like-opacity", like ? "1" : "0");
    card.current?.style.setProperty("--skip-opacity", like ? "0" : "1");
    setDragging(false);
    setLeaving(like ? "like" : "skip");
    try {
      await Promise.all([
        onReact(p, like),
        new Promise((resolve) => setTimeout(resolve, 360)),
      ]);
    } finally {
      choosing.current = false;
      if (alive.current) {
        setLeaving(null);
        paint(0);
      }
    }
  }
  function cancel() {
    stopFrame();
    gesture.current = null;
    setDragging(false);
    paint(0);
  }
  function down(e: PointerEvent<HTMLElement>) {
    if (
      busy ||
      choosing.current ||
      !e.isPrimary ||
      e.button !== 0 ||
      (e.target as HTMLElement).closest("button,a,input,summary,textarea")
    )
      return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 };
    if (e.pointerType === "mouse") e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x,
      dy = e.clientY - g.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 18) {
      cancel();
      return;
    }
    g.dx = dx * 0.75;
    if (Math.abs(dx) < 8) return;
    setDragging(true);
    if (frame.current === null)
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        paint(g.dx);
      });
  }
  function up(e: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    stopFrame();
    paint(g.dx);
    setDragging(false);
    if (Math.abs(g.dx) >= 90) void choose(g.dx > 0);
    else paint(0);
  }
  return (
    <div className="swipe-experience">
      <div className="deck-column">
        <div className="deck-stack">
          <article
            ref={card}
            key={p.userId}
            aria-label={`Анкета: ${name}`}
            tabIndex={0}
            className={`swipe-card ${leaving ? "leaving-" + leaving : ""} ${dragging ? "dragging" : ""}`}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
            onDragStart={(e) => e.preventDefault()}
            onLostPointerCapture={() => {
              if (gesture.current) cancel();
            }}
            onKeyDown={(e) => {
              if (
                e.target === e.currentTarget &&
                (e.key === "ArrowLeft" || e.key === "ArrowRight")
              ) {
                e.preventDefault();
                void choose(e.key === "ArrowRight");
              }
            }}
          >
            <ProfileCard
              key={p.userId}
              profile={p}
              onPhotoChange={onPhotoChange}
            >
              <span aria-hidden="true" className="swipe-stamp stamp-like">
                НРАВИТСЯ ♡
              </span>
              <span aria-hidden="true" className="swipe-stamp stamp-skip">
                ПРОПУСКАЮ
              </span>
            </ProfileCard>
          </article>
          {busy && (
            <span className="deck-updating" role="status">
              Момент, ищем твою волну…
            </span>
          )}
        </div>
        <div className="swipe-controls">
          <button
            className="swipe-choice swipe-no"
            disabled={busy || !!leaving}
            onClick={() => void choose(false)}
            aria-label={`Пропустить ${name}`}
          >
            <X size={28} />
            <span>Пропустить</span>
          </button>
          <button
            className="swipe-choice swipe-yes"
            disabled={busy || !!leaving}
            onClick={() => void choose(true)}
            aria-label={`Нравится ${name}`}
          >
            <Heart size={28} />
            <span>Нравится</span>
          </button>
        </div>
        <details className="discovery-help">
          <summary>
            <RotateCcw size={14} /> Как работает подбор
          </summary>
          <p>
            Сначала показываем самый близкий уровень сходства, затем следующий —
            с шагом 10%. Пропущенные вернутся после всех уровней, лайкнутые не
            повторяются. Процент — сходство рассказов. Можно свайпать или
            нажимать кнопки и ← / →.
          </p>
        </details>
      </div>
    </div>
  );
}
