import { useEffect, useState, useRef } from "react";
import {
  LockKeyhole,
  Plus,
  PenLine,
  Trash2,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { api } from "./api";
import { GuidedInterview } from "./GuidedInterview";
import { VoiceInput } from "./VoiceInput";
import { WaveGuide } from "./WaveGuide";
type Context = {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
};
export function ContextEditor({
  onChanged,
  interests = [],
  initialGuided = false,
}: {
  onChanged: () => Promise<unknown>;
  interests?: string[];
  initialGuided?: boolean;
}) {
  const [guided, setGuided] = useState(initialGuided);
  const guidedStory = useRef<number | null>(null);
  const [items, setItems] = useState<Context[]>([]),
    [ready, setReady] = useState(false),
    [available, setAvailable] = useState(true),
    [editing, setEditing] = useState<number | null | undefined>(null),
    [title, setTitle] = useState("Что для меня важно"),
    [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [confirm, setConfirm] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  async function load() {
    const r = await api<{ items: Context[]; modelAvailable: boolean }>(
      "/contexts/me",
    );
    setItems(r.items);
    setAvailable(r.modelAvailable);
    setReady(true);
  }
  useEffect(() => {
    let active = true;
    api<{ items: Context[]; modelAvailable: boolean }>("/contexts/me")
      .then((r) => {
        if (active) {
          setItems(r.items);
          setAvailable(r.modelAvailable);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function edit(item?: Context) {
    setEditing(item?.id ?? null);
    setTitle(item?.title ?? "Что для меня важно");
    setContent(item?.content ?? "");
    setError("");
    setSaved(false);
    setConfirm(null);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const story = await api<{ id: number }>(
        editing == null ? "/contexts/me" : `/contexts/me/${editing}`,
        editing == null ? "POST" : "PUT",
        { title, content },
      );
      setEditing(story.id);
      await load();
      await onChanged();
      setEditing(undefined);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить рассказ");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      await api(`/contexts/me/${id}`, "DELETE");
      await load();
      await onChanged();
      setConfirm(null);
      if (editing === id) setEditing(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить рассказ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="context-editor"
      aria-label="Личные рассказы для подбора"
    >
      {!guided && (
        <WaveGuide
          mood={listening ? "listening" : content.trim() ? "thinking" : "idle"}
        >
          <h2>Расскажи, что тебе близко</h2>
          <p>
            Напиши пару предложений — что любишь и что важно в людях. Так мы
            найдём тех, с кем у тебя больше общего.
          </p>
          <small>
            Этот рассказ видишь только ты. Его смысл помогает находить близких
            людей.
          </small>
        </WaveGuide>
      )}
      <details className="private-promise">
        <summary>
          <LockKeyhole size={14} /> Только для подбора · другие не увидят текст
        </summary>
        <div>
          <LockKeyhole size={16} />
          <p>
            Рассказы не появляются в анкете, переписках и объяснениях подбора.
            Модель обрабатывает их локально; внешним ИИ-сервисам они не
            отправляются.
          </p>
        </div>
      </details>
      {!available && ready && (
        <p role="alert">
          Подбор сейчас недоступен. Можно оставить текст здесь и попробовать
          сохранить позже.
        </p>
      )}
      {!guided && (
        <div
          className="story-seeds"
          role="group"
          aria-label="Идеи для нового рассказа"
        >
          {[
            "Музыка на повторе",
            "Мой идеальный выходной",
            "Что ценю в людях",
          ].map((topic) => (
            <button
              type="button"
              key={topic}
              disabled={busy || !ready || items.length >= 12 || !available}
              onClick={() => {
                edit();
                setTitle(topic);
                setContent(topic + ": ");
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      )}
      {guided && (
        <GuidedInterview
          interests={interests}
          onLater={() => setGuided(false)}
          onSave={async (text) => {
            const story = await api<{ id: number }>(
              guidedStory.current === null
                ? "/contexts/me"
                : `/contexts/me/${guidedStory.current}`,
              guidedStory.current === null ? "POST" : "PUT",
              {
                title: "Моя волна",
                content: text,
              },
            );
            guidedStory.current = story.id;
            await load();
            await onChanged();
            setGuided(false);
            setSaved(true);
          }}
        />
      )}
      {!guided && (
        <button
          type="button"
          className="guided-start"
          disabled={busy || !ready || items.length >= 12 || !available}
          onClick={() => {
            guidedStory.current = null;
            setGuided(true);
          }}
        >
          <Sparkles size={19} />
          <span>
            <strong>Давай немного поболтаем</strong>
            <small>Некс задаст три вопроса · любой можно пропустить</small>
          </span>
        </button>
      )}
      {guided ? null : editing !== undefined ? (
        <form className="context-form" onSubmit={save}>
          <details className="story-title-option">
            <summary>Название истории · по желанию</summary>
            <label>
              Название рассказа
              <input
                required
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          </details>
          <VoiceInput
            label="Личный рассказ"
            value={content}
            onChange={setContent}
            disabled={busy}
            onListeningChange={setListening}
            placeholder="Например: сейчас читаю фантастику, учусь играть на гитаре и люблю долгие прогулки без плана…"
          />
          <div className="context-form-footer">
            <small>{content.length}/6000 · минимум 20 символов</small>
            <div>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => setEditing(undefined)}
              >
                <X size={15} />
                Отмена
              </button>
              <button
                className="primary"
                disabled={
                  busy || !ready || !available || content.trim().length < 20
                }
              >
                <Check size={16} />
                {busy ? "Ищем смысл…" : "Сохранить личный рассказ"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="outline"
          disabled={busy || !ready || items.length >= 12 || !available}
          onClick={() => edit()}
        >
          <Plus size={17} />
          {items.length ? "Добавить ещё один рассказ" : "Написать о себе"}
        </button>
      )}
      <details className="saved-stories">
        <summary>
          Твои сохранённые истории{items.length ? ` · ${items.length}` : ""}
        </summary>
        <div className="context-list">
          {items.map((item) => (
            <article className="context-note" key={item.id}>
              <div>
                <h3>
                  <LockKeyhole size={15} />
                  {item.title}
                </h3>
                <small>
                  Только вам ·{" "}
                  {new Date(item.updatedAt).toLocaleDateString("ru-RU")}
                </small>
              </div>
              <p>{item.content}</p>
              <div className="context-note-actions">
                <button
                  type="button"
                  className="text-button"
                  disabled={busy}
                  onClick={() => edit(item)}
                  aria-label={`Редактировать рассказ ${item.title}`}
                >
                  <PenLine size={15} />
                  Дополнить
                </button>
                {confirm === item.id ? (
                  <>
                    <span>Удалить этот рассказ?</span>
                    <button
                      type="button"
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => void remove(item.id)}
                    >
                      Да, удалить
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setConfirm(null)}
                    >
                      Оставить
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="text-button"
                    disabled={busy}
                    onClick={() => setConfirm(item.id)}
                    aria-label={`Удалить рассказ ${item.title}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!items.length && (
          <p>Здесь появятся твои рассказы. К ним всегда можно вернуться.</p>
        )}
      </details>
      {saved && (
        <p className="photo-success" role="status">
          Рассказ сохранён. Подбор будет учитывать обновление.
        </p>
      )}
      {error && (
        <p role="alert" className="photo-error">
          {error}
        </p>
      )}
    </section>
  );
}
