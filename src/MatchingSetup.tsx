import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { api, type User } from "./api";
import { InterestPicker } from "./Onboarding";
import { ContextEditor } from "./ContextEditor";

export function MatchingSetup({
  user,
  interests,
  onSaved,
}: {
  user: User;
  interests: string[];
  onSaved: () => Promise<unknown>;
}) {
  const [chosen, setChosen] = useState(user.profile.interests);
  const [started, setStarted] = useState(false);
  const [choosing, setChoosing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedTopics, setSavedTopics] = useState(user.profile.interests);
  return (
    <div className="matching-setup">
      <div className="matching-steps" aria-label="Настройка подбора">
        <span className={choosing ? "active" : "done"}>
          <b>1</b> Твои интересы
        </span>
        <span className={!choosing ? "active" : ""}>
          <b>2</b> Немного о тебе
        </span>
      </div>
      <section className="matching-topics" aria-label="Твои интересы">
        {choosing ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("/profiles/me", "PUT", {
                  properties: user.profile.properties,
                  interests: chosen,
                });
                await onSaved();
                setSavedTopics(chosen);
                setStarted(true);
                setChoosing(false);
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "Не удалось сохранить интересы",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Сначала — то, что тебе близко</h2>
            <p>
              Выбери несколько интересов. Некс спросит чуть больше о выбранных
              темах — без длинной анкеты.
            </p>
            <InterestPicker
              items={interests}
              selected={chosen}
              onChange={setChosen}
              disabled={busy}
            />
            <div className="matching-topic-actions">
              <small>
                {chosen.length}/10 · темы видны в анкете, ответы — только тебе
              </small>
              <button className="primary" disabled={busy || !interests.length}>
                {busy
                  ? "Сохраняем…"
                  : started
                    ? "Сохранить интересы"
                    : chosen.length
                      ? "Дальше — три вопроса"
                      : "Начать без списка"}
                <ArrowRight size={17} />
              </button>
            </div>
            {error && <p role="alert">{error}</p>}
          </form>
        ) : (
          <div className="matching-topic-summary">
            <div>
              <Check size={18} />
              <span>
                <strong>Твои интересы</strong>
                <small>
                  {savedTopics.length
                    ? savedTopics.join(" · ")
                    : "Начнём с общих вопросов"}
                </small>
              </span>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setChoosing(true)}
            >
              Изменить
            </button>
          </div>
        )}
      </section>
      {started && (
        <div hidden={choosing}>
          <ContextEditor
            interests={savedTopics}
            initialGuided
            onChanged={onSaved}
          />
        </div>
      )}
    </div>
  );
}
