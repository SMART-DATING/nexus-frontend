import { useEffect, useRef, useState } from "react";
import { ArrowDown, MessageCircle, X } from "lucide-react";
import { WaveGuide } from "./WaveGuide";

const stops = [
  {
    id: "welcome",
    text: "Я Некс. Пройдёмся вместе? Здесь знакомятся через то, что близко именно тебе.",
    action: "Как всё устроено",
  },
  {
    id: "how-it-works",
    text: "Пара деталей о себе, близкие люди, взаимный лайк — и можно начать разговор.",
    action: "Попробовать разговор",
  },
  {
    id: "explore",
    text: "Нажми на интерес. За одним словом может оказаться целая история — её можно дополнить позже.",
    action: "А что с фотографиями?",
  },
  {
    id: "photos",
    text: "Фото открываются взаимно. Нажми на номера и посмотри, как это работает.",
    action: "О личных границах",
  },
  {
    id: "privacy",
    text: "Ты выбираешь, что видно в анкете. Личные рассказы помогают подбору и остаются скрытыми.",
    action: "Остались вопросы?",
  },
  {
    id: "questions",
    text: "Все вопросы можно пропустить. Начать с малого и дополнить потом — хороший план.",
    action: "Готово, идём знакомиться",
  },
  {
    id: "start",
    text: "Теперь твоя очередь. Расскажи о своём — и найдём людей на твоей волне.",
    action: "Начать знакомство",
  },
];

export function LandingGuide({ onStart }: { onStart: () => void }) {
  const [step, setStep] = useState(0);
  const guide = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(
    () =>
      sessionStorage.getItem("nexus-guide-dismissed") !== "yes" &&
      (window.matchMedia?.("(min-width: 900px)").matches ?? false),
  );
  function hide() {
    setOpen(false);
    sessionStorage.setItem("nexus-guide-dismissed", "yes");
  }
  useEffect(() => {
    function position() {
      const node = guide.current;
      if (!node || !open) return;
      const width = node.offsetWidth,
        height = node.offsetHeight;
      const mobile = window.innerWidth < 900;
      const horizontal = [0.94, 0.04, 0.9, 0.06, 0.92, 0.08, 0.88][step];
      const vertical = [0.85, 0.62, 0.8, 0.58, 0.78, 0.64, 0.75][step];
      const x = mobile
        ? window.innerWidth - width - 14
        : 16 + Math.max(0, window.innerWidth - width - 32) * horizontal;
      const y = mobile
        ? window.innerHeight - height - 18
        : 20 + Math.max(0, window.innerHeight - height - 40) * vertical;
      node.style.setProperty("--guide-x", `${Math.max(10, x)}px`);
      node.style.setProperty("--guide-y", `${Math.max(10, y)}px`);
    }
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [step, open]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const index = stops.findIndex(
              (stop) => stop.id === entry.target.id,
            );
            if (index >= 0) setStep(index);
          }
      },
      { rootMargin: "-15% 0px -50% 0px", threshold: 0 },
    );
    stops.forEach((stop) => {
      const node = document.getElementById(stop.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);
  function next() {
    if (step === stops.length - 1) {
      onStart();
      return;
    }
    const nextStep = step + 1;
    document.getElementById(stops[nextStep].id)?.scrollIntoView({
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    setStep(nextStep);
  }
  return (
    <aside
      ref={guide}
      className={`landing-guide ${open ? "is-open" : ""}`}
      aria-label="Некс — проводник по странице"
    >
      {open ? (
        <>
          <button
            type="button"
            className="guide-close"
            aria-label="Свернуть подсказку Некса"
            onClick={hide}
          >
            <X size={16} />
          </button>
          <WaveGuide compact>
            <p>{stops[step].text}</p>
            <button
              type="button"
              className="text-button guide-next"
              onClick={next}
            >
              {stops[step].action}
              <ArrowDown size={14} />
            </button>
          </WaveGuide>
        </>
      ) : (
        <button
          type="button"
          className="guide-reopen"
          aria-label="Открыть подсказку Некса"
          onClick={() => {
            sessionStorage.removeItem("nexus-guide-dismissed");
            setOpen(true);
          }}
        >
          <span className="mini-nex" aria-hidden="true">
            ·ᴗ·
          </span>
          <span>Некс</span>
          <MessageCircle size={15} />
        </button>
      )}
    </aside>
  );
}
