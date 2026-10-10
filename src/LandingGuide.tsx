import { ArrowRight, BookOpen, Camera, LockKeyhole } from "lucide-react";
import { Dialog } from "./Dialog";

export function scrollToLanding(id: string) {
  const target = document.getElementById(id);
  const section = target?.closest<HTMLElement>("section[id]");
  if (!section) return;
  const frame = section.closest<HTMLElement>(".landing-screen") ?? section;
  const top = frame.getBoundingClientRect().top + window.scrollY;
  history.replaceState(history.state, "", `#${section.id}`);
  window.scrollTo({
    top: Math.max(0, top),
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

export function LandingGuide({
  onClose,
  onPrivacy,
}: {
  onClose: () => void;
  onPrivacy: () => void;
}) {
  function go(id: string) {
    onClose();
    // Wait for the dialog to release page scrolling and restore focus.
    requestAnimationFrame(() => scrollToLanding(id));
  }
  return (
    <Dialog
      title="Некс поможет разобраться"
      onClose={onClose}
      className="landing-help"
    >
      <p className="help-intro">
        Выбери, что хочется узнать. Здесь можно спокойно осмотреться —
        регистрация пока не нужна.
      </p>
      <div className="help-options">
        <button type="button" onClick={() => go("explore-example")}>
          <BookOpen size={22} />
          <span>
            <strong>С чего начать рассказ о себе?</strong>
            <small>Попробуй короткий разговор по интересам.</small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button type="button" onClick={() => go("photos")}>
          <Camera size={22} />
          <span>
            <strong>Как открываются фотографии?</strong>
            <small>Посмотри на примере: сколько своих, столько чужих.</small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            onClose();
            onPrivacy();
          }}
        >
          <LockKeyhole size={22} />
          <span>
            <strong>Что увидят другие?</strong>
            <small>Разберись с видимостью анкеты и личными данными.</small>
          </span>
          <ArrowRight size={18} />
        </button>
      </div>
    </Dialog>
  );
}
