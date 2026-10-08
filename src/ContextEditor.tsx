import { useEffect, useState } from "react";
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
type Context = {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
};
export function ContextEditor({
  onChanged,
}: {
  onChanged: () => Promise<unknown>;
}) {
  const [items, setItems] = useState<Context[]>([]),
    [ready, setReady] = useState(false),
    [available, setAvailable] = useState(true),
    [editing, setEditing] = useState<number | null | undefined>(undefined),
    [title, setTitle] = useState(""),
    [content, setContent] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [confirm, setConfirm] = useState<number | null>(null);
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
      await api(
        editing == null ? "/contexts/me" : `/contexts/me/${editing}`,
        editing == null ? "POST" : "PUT",
        { title, content },
      );
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
      <div className="context-heading">
        <span className="privacy-icon">
          <LockKeyhole size={25} />
        </span>
        <div>
          <span className="eyebrow">ЗДЕСЬ МОЖНО БЫТЬ СОБОЙ</span>
          <h2>Ближе по смыслу</h2>
          <p>
            Расскажите о себе глубже. Эти тексты видны только вам — по ним мы
            ищем близких по духу людей.
          </p>
        </div>
      </div>
      <div className="private-promise">
        <LockKeyhole size={16} />
        <p>
          Рассказы не появляются в анкете, переписках и объяснениях подбора.
          Модель обрабатывает их локально; внешним ИИ-сервисам они не
          отправляются.
        </p>
      </div>
      {!available && ready && (
        <p role="alert">
          Текстовая модель пока не установлена. Установите её по инструкции
          запуска, чтобы сохранить рассказ и начать подбор.
        </p>
      )}
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
      {ready && !items.length && editing === undefined && (
        <div className="context-empty">
          <Sparkles size={25} />
          <h3>С чего начать?</h3>
          <p>
            Что вас увлекает? Что важно в отношениях? Как выглядит идеальный
            день? Пишите своими словами, без списка «правильных» ответов.
          </p>
        </div>
      )}
      {editing !== undefined ? (
        <form className="context-form" onSubmit={save}>
          <label>
            Название рассказа
            <input
              required
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Личный рассказ
            <textarea
              autoFocus
              required
              minLength={20}
              maxLength={6000}
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Мне нравится… Для меня важно… Я чувствую себя на своём месте, когда…"
            />
          </label>
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
                disabled={busy || !available || content.trim().length < 20}
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
