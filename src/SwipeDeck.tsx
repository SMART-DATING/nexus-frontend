import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
  onFocus,
  cycle,
  reviewed,
  liked,
}: {
  people: Profile[];
  busy: boolean;
  onReact: (p: Profile, like: boolean) => Promise<boolean>;
  onFocus: (id: number) => void;
  cycle: number;
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
        <div className="deck-meta">
          <span>
            <Sparkles size={14} /> Поймаем общий вайб
          </span>
          <span>
            <RotateCcw size={13} /> Круг {cycle}
          </span>
        </div>
        <div className="deck-stack">
          <div className="stack-ghost ghost-two" />
          <div className="stack-ghost ghost-one" />
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
              <PhotoGallery profile={p} />
              <span className="swipe-score">
                <Sparkles size={15} />
                {Math.round(Math.max(0, p.compatibilityScore ?? 0) * 100)}%
                сходства рассказов
              </span>
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
                <span className="eyebrow">МОЖЕТ, ЭТО ТВОЙ ЧЕЛОВЕК</span>
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
              <p className={expanded ? "expanded" : ""}>
                {value(p, "bio") || "Лучшие истории начинаются с «привет»."}
              </p>
              <div className="tags">
                {p.interests.slice(0, expanded ? 10 : 4).map((i) => (
                  <span key={i} className={common.includes(i) ? "common" : ""}>
                    {i}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="story-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Свернуть анкету" : "Узнать поближе"}
                <ChevronDown size={16} />
              </button>
            </div>
          </article>
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
          <span className="gesture-caption">
            <ArrowLeft size={13} /> свайп <ArrowRight size={13} />
          </span>
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
        <p className="keyboard-hint">
          Потяните карточку или используйте ← / →, когда она выбрана
        </p>
      </div>
      <div className="discovery-side">
        <section className="connection-panel">
          <span className="eyebrow">НАЧНИТЕ С ОБЩЕГО</span>
          <h3>
            {common.length
              ? "Ваша общая волна"
              : "Разные интересы. Новая история."}
          </h3>
          <p>
            {common.length
              ? "Нажмите на интерес — найдём повод для первого разговора."
              : "Иногда самое интересное начинается с любопытства."}
          </p>
          <div className="connection-interests">
            {(common.length ? common : p.interests.slice(0, 3)).map((i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setIdea(
                    ideas[i] || `Что тебе больше всего нравится в теме «${i}»?`,
                  )
                }
                className={
                  idea ===
                  (ideas[i] || `Что тебе больше всего нравится в теме «${i}»?`)
                    ? "selected"
                    : ""
                }
              >
                <Sparkles size={13} />
                {i}
              </button>
            ))}
          </div>
          <div className="conversation-idea" aria-live="polite">
            <span>ИДЕЯ ДЛЯ ЗНАКОМСТВА</span>
            <p>{idea || "Как выглядит твой идеальный выходной?"}</p>
            <small>
              Сходство текстов — ориентир для знакомства. Личные рассказы
              собеседника остаются скрытыми.
            </small>
          </div>
        </section>
        <section className="rhythm-panel">
          <span className="eyebrow">В ЭТОЙ ПОДБОРКЕ</span>
          <div>
            <strong>
              {reviewed}
              <small>просмотрено</small>
            </strong>
            <strong>
              {liked}
              <small>симпатий</small>
            </strong>
          </div>
          <p>Без спешки. Ваш человек может быть на следующей карточке.</p>
        </section>
        {people.length > 1 && (
          <section className="up-next">
            <div>
              <h3>Дальше в подборке</h3>
              <small>{people.length - 1} анкет</small>
            </div>
            <div className="preview-people">
              {people.slice(1, 5).map((other) => (
                <button
                  key={other.userId}
                  disabled={busy || !!leaving}
                  onClick={() => onFocus(other.userId)}
                  aria-label={`Посмотреть анкету ${value(other, "display_name")}`}
                >
                  <span>
                    {value(other, "display_name").slice(0, 1)}
                    {other.avatarUrl && (
                      <img
                        src={other.avatarUrl}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </span>
                  <small>{value(other, "display_name")}</small>
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="circle-note">
          <RotateCcw size={17} />
          <p>
            Пропустил? Анкета вернётся в новом круге. Лайки остаются — повторно
            свайпать их не придётся.
          </p>
        </div>
      </div>
    </div>
  );
}
