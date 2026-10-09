import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Heart,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
  ChevronDown,
} from "lucide-react";
import { value, type Profile } from "./api";
import { PhotoGallery } from "./PhotoGallery";

const ideas: Record<string, string> = {
  Музыка: "Какой трек у тебя сейчас на повторе?",
  Кофе: "Кофе на прогулке или уютная кофейня?",
  Кино: "Какой фильм хочется пересмотреть вместе?",
  Путешествия: "Куда отправимся на маленькие выходные?",
  Книги: "Какая книга тебя недавно зацепила?",
  Игры: "Настолки или видеоигры — что выбираешь?",
};

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
  onPhotoChange?: (url?: string) => void;
  reviewed: number;
  liked: number;
}) {
  const p = people[0],
    name = value(p, "display_name");
  const [drag, setDrag] = useState(0),
    [leaving, setLeaving] = useState<"like" | "skip" | null>(null),
    [expanded, setExpanded] = useState(false),
    [idea, setIdea] = useState("");
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dx: number;
  } | null>(null);
  const choosing = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    setDrag(0);
    setLeaving(null);
    setExpanded(false);
    setIdea("");
  }, [p.userId]);
  async function choose(like: boolean) {
    if (busy || choosing.current) return;
    choosing.current = true;
    setLeaving(like ? "like" : "skip");
    await new Promise((resolve) => setTimeout(resolve, 220));
    if (!alive.current) return;
    try {
      await onReact(p, like);
    } finally {
      choosing.current = false;
      if (alive.current) {
        setLeaving(null);
        setDrag(0);
      }
    }
  }
  function down(e: PointerEvent<HTMLElement>) {
    if (
      busy ||
      choosing.current ||
      !e.isPrimary ||
      e.button !== 0 ||
      (e.target as HTMLElement).closest("button,a,input")
    )
      return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 };
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
    g.dx = dx;
    setDrag(Math.max(-220, Math.min(220, dx)));
  }
  function cancel() {
    gesture.current = null;
    setDrag(0);
  }
  function up(e: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    if (Math.abs(g.dx) >= 90) void choose(g.dx > 0);
    else setDrag(0);
  }
  const common = p.commonInterests ?? [];
  return (
    <div className="swipe-experience">
      <div className="deck-column">
        <div className="deck-stack">
          <article
            key={p.userId}
            aria-label={`Анкета: ${name}`}
            tabIndex={0}
            className={`swipe-card ${leaving ? "leaving-" + leaving : ""} ${drag ? "dragging" : ""}`}
            style={{
              transform: leaving
                ? undefined
                : `translateX(${drag}px) rotate(${drag / 18}deg)`,
            }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                void choose(e.key === "ArrowRight");
              }
            }}
          >
            <div className={`swipe-portrait art-${p.userId % 6}`}>
              <span className="swipe-fallback">{name.slice(0, 1)}</span>
              <PhotoGallery profile={p} onPhotoChange={onPhotoChange} />
              <span
                aria-hidden="true"
                className="swipe-stamp stamp-like"
                style={{
                  opacity: leaving === "like" ? 1 : Math.max(0, drag / 100),
                }}
              >
                НРАВИТСЯ ♡
              </span>
              <span
                aria-hidden="true"
                className="swipe-stamp stamp-skip"
                style={{
                  opacity: leaving === "skip" ? 1 : Math.max(0, -drag / 100),
                }}
              >
                ПРОПУСКАЮ
              </span>
              <div className="swipe-identity">
                <h2>{name}</h2>
                {value(p, "city") && (
                  <span>
                    <MapPin size={15} />
                    {value(p, "city")}
                  </span>
                )}
              </div>
            </div>
            <div className="swipe-story">
              <span className="story-label">
                <Sparkles size={15} />
                {typeof p.compatibilityScore === "number"
                  ? `${Math.round(Math.min(1, Math.max(0, p.compatibilityScore)) * 100)}% совпадения`
                  : "По твоей истории"}
              </span>
              <p className={expanded ? "expanded" : ""}>
                {value(p, "bio") || "Лучшие истории начинаются с «привет»."}
              </p>
              <div className="tags">
                {p.interests.slice(0, expanded ? 10 : 4).map((i) => (
                  <span
                    key={i}
                    className={common.includes(i) ? "common" : ""}
                    title={common.includes(i) ? "Ваш общий интерес" : undefined}
                  >
                    {common.includes(i) && (
                      <Heart size={12} aria-hidden="true" />
                    )}
                    {i}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="story-toggle"
                aria-expanded={expanded}
                aria-controls={expanded ? `details-${p.userId}` : undefined}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Свернуть анкету" : "Узнать поближе"}
                <ChevronDown size={16} />
              </button>
              {expanded && (
                <div className="profile-details" id={`details-${p.userId}`}>
                  <h3>С чего начать разговор</h3>
                  <div className="connection-interests">
                    {(common.length ? common : p.interests.slice(0, 3)).map(
                      (i) => (
                        <button
                          type="button"
                          key={i}
                          aria-pressed={
                            idea ===
                            (ideas[i] ||
                              `Что тебе больше всего нравится в теме «${i}»?`)
                          }
                          onClick={() =>
                            setIdea(
                              ideas[i] ||
                                `Что тебе больше всего нравится в теме «${i}»?`,
                            )
                          }
                        >
                          {i}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="conversation-prompt" aria-live="polite">
                    {idea || "Как выглядит твой идеальный выходной?"}
                  </p>
                  <p className="matching-explanation">
                    Сходство личных рассказов:{" "}
                    {Math.round(Math.max(0, p.compatibilityScore ?? 0) * 100)}%.
                    Это ориентир, а не оценка отношений. Чужие рассказы остаются
                    скрытыми.
                  </p>
                </div>
              )}
            </div>
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
            Сначала — новые люди, потом — пропущенные. Те, кто понравился,
            повторяться не будут. Можно свайпать карточку или выбрать её и
            нажимать ← / →.
          </p>
        </details>
      </div>
    </div>
  );
}
