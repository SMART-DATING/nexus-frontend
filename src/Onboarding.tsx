import { useState, useRef } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { api, value, type User, type Property } from "./api";
import { GuidedInterview } from "./GuidedInterview";
import { WaveGuide } from "./WaveGuide";
import { AmbientBackdrop } from "./AmbientBackdrop";
const emoji: Record<string, string> = {
  Книги: "📚",
  Музыка: "🎧",
  Психология: "🧠",
  Кино: "🎬",
  Путешествия: "🧳",
  Кофе: "☕",
  Спорт: "🏃",
  Игры: "🎮",
  Природа: "🌿",
  Искусство: "🎨",
  Технологии: "💻",
  Кулинария: "🍜",
  Фотография: "📸",
};
export function InterestPicker({
  items,
  selected,
  onChange,
}: {
  items: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  return (
    <div className="interest-picker" aria-label="Выбор интересов">
      {items.map((i) => (
        <button
          type="button"
          key={i}
          aria-pressed={selected.includes(i)}
          disabled={!selected.includes(i) && selected.length >= 10}
          onClick={() =>
            onChange(
              selected.includes(i)
                ? selected.filter((x) => x !== i)
                : [...selected, i],
            )
          }
        >
          <span aria-hidden="true">{emoji[i] ?? "✨"}</span>
          {i}
          {selected.includes(i) && <Check size={15} />}
        </button>
      ))}
    </div>
  );
}
export function Onboarding({
  user,
  interests,
  onDone,
  onLater,
}: {
  user: User;
  interests: string[];
  onDone: () => Promise<unknown>;
  onLater: () => void;
}) {
  const createdStory = useRef<number | null>(null);
  const [step, setStep] = useState(
      user.profile.properties.length === 4 ? 2 : 0,
    ),
    [selected, setSelected] = useState(user.profile.interests),
    [name, setName] = useState(value(user.profile, "display_name")),
    [birth, setBirth] = useState(value(user.profile, "birth_date")),
    [city, setCity] = useState(value(user.profile, "city")),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function basic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const existing = user.profile.properties;
      const properties: Property[] = [
        { name: "display_name", value: name.trim(), visible: true },
        {
          name: "birth_date",
          value: birth,
          visible:
            existing.find((p) => p.name === "birth_date")?.visible ?? false,
        },
        {
          name: "city",
          value: city.trim(),
          visible: existing.find((p) => p.name === "city")?.visible ?? true,
        },
        {
          name: "bio",
          value: value(user.profile, "bio"),
          visible: existing.find((p) => p.name === "bio")?.visible ?? true,
        },
      ];
      await api("/profiles/me", "PUT", { properties, interests: selected });
      setStep(2);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не получилось сохранить профиль.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="onboarding-screen">
      <AmbientBackdrop />
      <header>
        <a className="brand" href="/" aria-label="Nexus">
          <img src="/nexus-mark.svg" alt="" />
          nexus
        </a>
        <span>Знакомства на твоей волне</span>
        <button className="text-button" onClick={onLater} disabled={busy}>
          Позже
        </button>
      </header>
      <main className="onboarding-content">
        <div className="onboarding-steps" aria-label="Шаги знакомства">
          {["Твоя волна", "Пара слов о тебе", "Твоя история"].map(
            (label, i) => (
              <span
                className={i === step ? "active" : i < step ? "done" : ""}
                key={label}
              >
                <b>{i < step ? <Check size={13} /> : i + 1}</b>
                {label}
              </span>
            ),
          )}
        </div>
        {step === 0 ? (
          <section className="onboarding-intro">
            <WaveGuide compact>
              <p>
                Привет, я Некс. Выбери то, что тебе близко — это только начало,
                не ярлык навсегда.
              </p>
            </WaveGuide>
            <span className="eyebrow">
              <Sparkles size={14} />
              НАЧНЁМ С ТОГО, ЧТО ЦЕПЛЯЕТ
            </span>
            <h1>
              Что тебя увлекает<span className="dot">?</span>
            </h1>
            <p>
              Не нужно определять себя навсегда. Выбери несколько тем — или
              начни без них.
            </p>
            <InterestPicker
              items={interests}
              selected={selected}
              onChange={setSelected}
            />
            <small>{selected.length}/10 · темы будут видны в анкете</small>
            <div className="onboarding-actions">
              <button
                className="primary"
                disabled={!interests.length}
                onClick={() => setStep(1)}
              >
                {selected.length ? "Это моя волна" : "Пока без списка"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        ) : step === 1 ? (
          <section className="onboarding-basics">
            <WaveGuide compact>
              <p>
                Уже есть за что зацепиться! Ещё имя и город — и поговорим о
                твоём.
              </p>
            </WaveGuide>
            <span className="eyebrow">ДОБАВИМ НЕМНОГО КОНТЕКСТА</span>
            <h1>
              Как к тебе обращаться<span className="dot">?</span>
            </h1>
            <p>
              Основное — сейчас. Фотографии и подпись добавишь в профиле, когда
              захочется.
            </p>
            <form onSubmit={basic}>
              <label>
                Твоё имя
                <input
                  required
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Как тебя зовут?"
                />
              </label>
              <div className="basics-grid">
                <label>
                  Дата рождения
                  <input
                    required
                    type="date"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    autoComplete="bday"
                  />
                </label>
                <label>
                  Город
                  <input
                    required
                    maxLength={80}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    autoComplete="address-level2"
                    placeholder="Твой город"
                  />
                </label>
              </div>
              <small>
                Только для совершеннолетних. Дата рождения скрыта по умолчанию.
              </small>
              {error && (
                <p role="alert" className="photo-error">
                  {error}
                </p>
              )}
              <div className="onboarding-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setStep(0)}
                  disabled={busy}
                >
                  <ArrowLeft size={16} />
                  Назад
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? "Сохраняем…" : "Давай познакомимся"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          </section>
        ) : (
          <GuidedInterview
            interests={selected}
            onLater={onLater}
            onSave={async (content) => {
              const story = await api<{ id: number }>(
                createdStory.current === null
                  ? "/contexts/me"
                  : `/contexts/me/${createdStory.current}`,
                createdStory.current === null ? "POST" : "PUT",
                {
                  title: "Моя волна",
                  content,
                },
              );
              createdStory.current = story.id;
              await onDone();
            }}
          />
        )}
      </main>
      <footer>Никаких идеальных ответов. Просто будь собой.</footer>
    </div>
  );
}
