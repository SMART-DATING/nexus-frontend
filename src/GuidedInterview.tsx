import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { WaveGuide } from "./WaveGuide";
export type Prompt = { id: string; topic: string; text: string; hint: string };
const prompts: Record<string, Prompt> = {
  Кофе: {
    id: "coffee",
    topic: "Кофе",
    text: "Где любишь задержаться за чашкой кофе?",
    hint: "Любимая кофейня, домашний ритуал или разговор, который не хочется заканчивать.",
  },
  Книги: {
    id: "books",
    topic: "Книги",
    text: "Какая книга осталась с тобой надолго?",
    hint: "Что читаешь, какие герои цепляют и почему? Можно вспомнить одну книгу.",
  },
  Музыка: {
    id: "music",
    topic: "Музыка",
    text: "Что у тебя сейчас на повторе?",
    hint: "Артист, трек, жанр или концерт, после которого ещё долго было хорошо.",
  },
  Психология: {
    id: "psychology",
    topic: "Психология",
    text: "Что для тебя значит быть близкими?",
    hint: "Например, доверие, поддержка, личное пространство. Только то, чем хочется поделиться.",
  },
  Кино: {
    id: "cinema",
    topic: "Кино",
    text: "Какой фильм хочется обсудить после титров?",
    hint: "Не обязательно любимый. Что зацепило: история, атмосфера или персонаж?",
  },
  Путешествия: {
    id: "travel",
    topic: "Путешествия",
    text: "Куда бы ты сорвался на пару дней?",
    hint: "Новый город, горы, море или место рядом с домом — что делает поездку твоей?",
  },
  Игры: {
    id: "games",
    topic: "Игры",
    text: "Во что хочется залипнуть вместе?",
    hint: "Настолки, видеоигры, любимый мир. Нравится соревноваться или проходить заодно?",
  },
  Спорт: {
    id: "sport",
    topic: "Спорт",
    text: "От какого движения становится хорошо?",
    hint: "Зал, танцы, бег, велосипед — расскажи про свой ритм, без рекордов.",
  },
  Искусство: {
    id: "art",
    topic: "Искусство",
    text: "Что тебя вдохновляет в последнее время?",
    hint: "Выставка, рисунок, фотография или то, что создаёшь сам.",
  },
  Технологии: {
    id: "tech",
    topic: "Технологии",
    text: "Над чем любишь экспериментировать?",
    hint: "Проект, идея или штука, о которой можешь увлечённо рассказывать.",
  },
  Кулинария: {
    id: "food",
    topic: "Кулинария",
    text: "Какое блюдо приготовишь для своего человека?",
    hint: "Может, семейный рецепт или эксперимент, который неожиданно получился.",
  },
  Природа: {
    id: "nature",
    topic: "Природа",
    text: "Где получается выдохнуть?",
    hint: "Лес, палатка, парк, вода. Как выглядит день, в котором тебе спокойно?",
  },
  Фотография: {
    id: "photo",
    topic: "Фотография",
    text: "Что хочется ловить в кадре?",
    hint: "Людей, город, поездки или маленькие детали. Что ты в них замечаешь?",
  },
};
const general: Prompt[] = [
  {
    id: "day",
    topic: "Твой ритм",
    text: "Как выглядит день, который хочется повторить?",
    hint: "Чем занимаешься, как отдыхаешь, на что всегда находится время?",
  },
  {
    id: "curiosity",
    topic: "Любопытство",
    text: "О чём можешь говорить часами?",
    hint: "Даже если это не похоже на «серьёзное увлечение».",
  },
  {
    id: "values",
    topic: "Близость",
    text: "С какими людьми тебе по-настоящему хорошо?",
    hint: "Что важно в общении и что хочется разделить с другим человеком?",
  },
];
export function interviewPrompts(interests: string[]): Prompt[] {
  const selected = interests
    .map((i) => prompts[i])
    .filter(Boolean)
    .slice(0, 2);
  return [
    ...selected,
    ...general.filter((p) => !selected.some((s) => s.id === p.id)),
  ].slice(0, 3);
}
export function GuidedInterview({
  interests,
  onSave,
  onLater,
}: {
  interests: string[];
  onSave: (content: string) => Promise<void>;
  onLater?: () => void;
}) {
  const questions = interviewPrompts(interests);
  const [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [review, setReview] = useState(false),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const q = questions[index];
  const [listening, setListening] = useState(false);
  function next() {
    if (index < questions.length - 1) setIndex((i) => i + 1);
    else {
      setDraft(
        questions
          .map((question) => {
            const answer = answers[question.id]?.trim();
            return answer ? `${question.topic}: ${answer}` : "";
          })
          .filter(Boolean)
          .join("\n\n"),
      );
      setReview(true);
    }
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave(draft.trim());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не получилось сохранить. Попробуй ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="guided-interview"
      aria-label="Знакомство через интересы"
    >
      <div className="interview-topline">
        <span>
          <Sparkles size={15} />
          Твоя история
        </span>
        <span>
          {review ? "Последний штрих" : `${index + 1} из ${questions.length}`}
        </span>
      </div>
      <div className="interview-progress" aria-label="Ход знакомства">
        {questions.map((p, i) => (
          <i key={p.id} className={review || i <= index ? "done" : ""} />
        ))}
      </div>
      <div
        className="question-message"
        key={`question-${review ? "review" : q.id}`}
      >
        <WaveGuide
          mood={
            listening
              ? "listening"
              : (review ? draft : (answers[q.id] ?? "")).trim()
                ? "thinking"
                : "idle"
          }
        >
          <span className="question-topic">
            {review ? "Без чужих глаз" : q.topic}
          </span>
          <h2>{review ? "Уже звучит как ты." : q.text}</h2>
          <p>
            {review
              ? "Поправь текст, если хочется. Он останется личным и поможет найти людей с похожими интересами."
              : q.hint}
          </p>
        </WaveGuide>
      </div>
      <VoiceInput
        key={`answer-${review ? "review" : q.id}`}
        maxLength={review ? 6000 : 1800}
        label={review ? "Твой личный рассказ" : "Твой ответ"}
        value={review ? draft : (answers[q.id] ?? "")}
        onChange={(s) =>
          review ? setDraft(s) : setAnswers((a) => ({ ...a, [q.id]: s }))
        }
        disabled={busy}
        onListeningChange={setListening}
      />
      <div className="interview-footer">
        <small>
          <LockKeyhole size={13} />
          Текст видишь только ты
        </small>
        <div>
          {(index > 0 || review) && (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() =>
                review ? setReview(false) : setIndex((i) => i - 1)
              }
            >
              <ArrowLeft size={16} />
              Назад
            </button>
          )}
          {review ? (
            <button
              type="button"
              className="primary"
              disabled={busy || draft.trim().length < 20}
              onClick={() => void save()}
            >
              <Check size={17} />
              {busy ? "Находим твою волну…" : "Сохранить и знакомиться"}
            </button>
          ) : (
            <button type="button" className="primary" onClick={next}>
              {(answers[q.id] ?? "").trim() ? "Дальше" : "Пропустить вопрос"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </div>
      {review && draft.trim().length < 20 && (
        <p className="interview-hint">
          Добавь хотя бы пару предложений — от 20 символов. Или вернись к этому
          позже.
        </p>
      )}
      {error && (
        <p role="alert" className="photo-error">
          {error}
        </p>
      )}
      {onLater && (
        <button
          className="interview-later"
          type="button"
          disabled={busy}
          onClick={onLater}
        >
          Расскажу позже
        </button>
      )}
      {!review && (
        <p className="interview-hint">
          Три вопроса — и всё. Любой можно пропустить.
        </p>
      )}
    </section>
  );
}
