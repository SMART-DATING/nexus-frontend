import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Upload,
  Plus,
  Check,
  X,
  Trash2,
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { api, type Profile } from "./api";
import { Dialog } from "./Dialog";
import { useProfileMedia } from "./useProfileMedia";
export function PhotoUpload({
  profile,
  onSaved,
  onDiscover,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
  onDiscover?: () => void;
}) {
  const media = useProfileMedia(profile);
  const photos = media.profile.photos ?? [],
    count = media.profile.photoCount ?? photos.length;
  const [files, setFiles] = useState<File[]>([]),
    [previews, setPreviews] = useState<string[]>([]),
    [replacing, setReplacing] = useState<number | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false),
    [confirm, setConfirm] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  function choose(id: number | null = null) {
    setReplacing(id);
    setConfirm(null);
    input.current?.click();
  }
  function select(selected: File[]) {
    setError("");
    setSaved(false);
    if (!selected.length) return;
    if (selected.some((f) => !["image/jpeg", "image/png"].includes(f.type))) {
      setError("Выберите фото JPEG или PNG");
      return;
    }
    if (selected.some((f) => f.size > 5 * 1024 * 1024)) {
      setError("Каждое фото должно быть не больше 5 МБ");
      return;
    }
    if (replacing !== null && selected.length !== 1) {
      setError("Для замены выберите одно фото");
      return;
    }
    if (replacing === null && selected.length + count > 6) {
      setError(`Можно добавить ещё ${6 - count} фото`);
      return;
    }
    setFiles(selected);
  }
  function cancel() {
    setFiles([]);
    setReplacing(null);
    if (input.current) input.current.value = "";
  }
  async function save() {
    setBusy(true);
    setError("");
    let completed = 0;
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        const p = await api<Profile>(
          replacing === null
            ? "/profiles/me/photos"
            : `/profiles/me/photos/${replacing}`,
          replacing === null ? "POST" : "PUT",
          body,
        );
        onSaved(p);
        completed++;
      }
      cancel();
      setSaved(true);
    } catch (e) {
      setFiles((old) => old.slice(completed));
      setError(e instanceof Error ? e.message : "Не удалось сохранить фото");
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: number) {
    setBusy(true);
    setError("");
    try {
      onSaved(await api<Profile>(`/profiles/me/photos/${id}`, "DELETE"));
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить фото");
    } finally {
      setBusy(false);
    }
  }
  async function move(id: number, step: number) {
    setBusy(true);
    setError("");
    const ids = photos.map((p) => p.id),
      i = ids.indexOf(id),
      j = i + step;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      onSaved(await api<Profile>("/profiles/me/photos/order", "PUT", { ids }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось изменить порядок");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="photo-upload photo-six" aria-label="Фото профиля">
      <div className="photo-settings">
        <span className="eyebrow">
          РОВНО СТОЛЬКО, СКОЛЬКО ВЫ ОТКРЫЛИ О СЕБЕ
        </span>
        <h2>
          Ваши шесть кадров <small>{count}/6</small>
        </h2>
        <p>
          Загрузили одно фото — видите первое фото других. Два — первые два. До
          шести фото в каждой анкете.
        </p>
      </div>
      {!!media.failed.length && (
        <div className="media-retry">
          <p role="status">
            {media.loading
              ? "Обновляем фотографии…"
              : "Некоторые фото не загрузились."}
          </p>
          <button
            type="button"
            className="outline"
            disabled={media.loading}
            onClick={() => void media.refresh()}
          >
            Загрузить фотографии снова
          </button>
        </div>
      )}
      <div className="six-photo-grid">
        {Array.from({ length: 6 }, (_, i) => {
          const photo = photos[i];
          return (
            <div
              className={`photo-slot ${photo ? "filled" : ""}`}
              key={photo?.id ?? `slot-${i}`}
            >
              {photo ? (
                <>
                  {!media.failed.includes(photo.url) && (
                    <img
                      key={photo.url}
                      src={photo.url}
                      alt={`Ваше фото ${i + 1}`}
                      onError={() => media.onError(photo.url)}
                    />
                  )}
                  <span className="slot-number">
                    {i === 0 ? "Главное" : i + 1}
                  </span>
                  <div className="slot-actions">
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Заменить фото ${i + 1}`}
                      onClick={() => choose(photo.id)}
                    >
                      <Camera size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      aria-label={`Удалить фото ${i + 1}`}
                      onClick={() => setConfirm(photo.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                    {i > 0 && (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Передвинуть фото ${i + 1} влево`}
                        onClick={() => void move(photo.id, -1)}
                      >
                        <ArrowLeft size={15} />
                      </button>
                    )}
                    {i < photos.length - 1 && (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Передвинуть фото ${i + 1} вправо`}
                        onClick={() => void move(photo.id, 1)}
                      >
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  disabled={busy || count >= 6}
                  onClick={() => choose()}
                  aria-label={`Добавить фото в ячейку ${i + 1}`}
                >
                  <Plus size={25} />
                  <span>Кадр {i + 1}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="photo-quota">
        <LockKeyhole size={17} />
        <p>
          {count
            ? `Вам открыто до ${count} фото в чужих анкетах. Остальные пока скрыты.`
            : "Добавь хотя бы одно фото, чтобы начать знакомства и видеть фотографии других людей."}
        </p>
      </div>
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png"
        multiple={replacing === null}
        aria-label="Выбрать фото профиля"
        disabled={busy}
        onChange={(e) => select(Array.from(e.target.files ?? []))}
      />
      <div className="photo-actions">
        <button
          type="button"
          className="outline"
          disabled={busy || count >= 6}
          onClick={() => choose()}
        >
          <Upload size={16} /> Добавить фото
        </button>
        <small>JPEG или PNG · до 5 МБ каждое</small>
      </div>
      {!!files.length && (
        <Dialog
          title={replacing === null ? "Добавить фото?" : "Заменить фото?"}
          className="photo-confirm-dialog"
          onClose={() => {
            if (!busy) cancel();
          }}
        >
          <div aria-busy={busy}>
            <p>
              {replacing === null
                ? "Эти кадры появятся в твоей анкете. Первый станет главным, если у тебя ещё нет фото."
                : "Новое фото займёт место выбранного кадра."}
            </p>
            <div className="photo-confirm-preview">
              {previews.map((src, i) => (
                <img key={src} src={src} alt={`Предпросмотр фото ${i + 1}`} />
              ))}
            </div>
            {error && (
              <p role="alert" className="photo-error">
                {error}
              </p>
            )}
            <div className="photo-confirm-actions">
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={cancel}
              >
                Отмена
              </button>
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => void save()}
              >
                <Check size={18} />
                {busy ? "Сохраняем…" : "Сохранить фото"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {confirm !== null && (
        <Dialog
          title="Удалить фото?"
          className="photo-confirm-dialog"
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <div aria-busy={busy}>
            <div className="photo-confirm-preview">
              <img
                src={photos.find((p) => p.id === confirm)?.url}
                alt="Фото для удаления"
              />
            </div>
            <p>
              Этот кадр исчезнет из анкеты. Тебе станет доступно на одно фото
              меньше у других людей.
            </p>
            {error && (
              <p role="alert" className="photo-error">
                {error}
              </p>
            )}
            <div className="photo-confirm-actions">
              <button
                type="button"
                className="outline"
                disabled={busy}
                onClick={() => setConfirm(null)}
              >
                Оставить фото
              </button>
              <button
                type="button"
                className="primary danger"
                disabled={busy}
                onClick={() => void remove(confirm)}
              >
                <Trash2 size={18} />
                {busy ? "Удаляем…" : "Да, удалить фото"}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {saved && (
        <div className="photo-success">
          <p role="status">Фото обновлены</p>
          {!!count && onDiscover && (
            <button type="button" className="primary" onClick={onDiscover}>
              К знакомствам <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}
      {error && !files.length && confirm === null && (
        <p role="alert" className="photo-error">
          {error}
        </p>
      )}
    </section>
  );
}
