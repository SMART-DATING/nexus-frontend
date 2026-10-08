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
export function PhotoUpload({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const photos = profile.photos ?? [],
    count = profile.photoCount ?? photos.length;
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
                  <img
                    key={photo.url}
                    src={photo.url}
                    alt={`Ваше фото ${i + 1}`}
                  />
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
            : "Пока у вас нет фото, чужие фотографии скрыты. Знакомиться и переписываться можно и так."}
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
      {!!previews.length && (
        <div className="upload-preview">
          <p>
            {replacing !== null
              ? "Новое фото для замены"
              : "Проверьте выбранные кадры перед загрузкой"}
          </p>
          <div>
            {previews.map((src, i) => (
              <img key={src} src={src} alt={`Предпросмотр фото ${i + 1}`} />
            ))}
          </div>
        </div>
      )}
      <div className="photo-actions">
        {files.length ? (
          <>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => void save()}
            >
              <Check size={16} />
              {busy ? "Сохраняем…" : "Сохранить фото"}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={cancel}
            >
              <X size={15} />
              Отмена
            </button>
          </>
        ) : (
          <button
            type="button"
            className="outline"
            disabled={busy || count >= 6}
            onClick={() => choose()}
          >
            <Upload size={16} />
            Добавить фото
          </button>
        )}
        <small>JPEG или PNG · до 5 МБ каждое</small>
      </div>
      {confirm !== null && (
        <div className="photo-delete-confirm">
          <p>
            Удалить это фото? Доступное вам число чужих фото тоже уменьшится.
          </p>
          <button
            type="button"
            className="text-button danger"
            disabled={busy}
            onClick={() => void remove(confirm)}
          >
            Да, удалить фото
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => setConfirm(null)}
          >
            Оставить фото
          </button>
        </div>
      )}
      {saved && (
        <p role="status" className="photo-success">
          Фото обновлены
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
