import { useEffect, useRef, useState } from "react";
import { Camera, Check, LoaderCircle, Upload, X } from "lucide-react";
import { api, type Profile } from "./api";

export function PhotoUpload({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved: (p: Profile) => void;
}) {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function select(selected?: File) {
    setError("");
    setSaved(false);
    if (!selected) return;
    if (!["image/jpeg", "image/png"].includes(selected.type)) {
      setError("Выберите фото JPEG или PNG");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Фото должно быть не больше 5 МБ");
      return;
    }
    setFile(selected);
  }
  async function save(remove = false) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      if (file) body.append("file", file);
      const p = await api<Profile>(
        "/profiles/me/avatar",
        remove ? "DELETE" : "POST",
        remove ? undefined : body,
      );
      onSaved(p);
      setFile(null);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить фото");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="photo-upload" aria-label="Фото профиля">
      <div className="photo-preview">
        <Camera size={32} />
        {(preview || profile.avatarUrl) && (
          <img
            key={preview || profile.avatarUrl}
            src={preview || profile.avatarUrl}
            alt="Предпросмотр фото профиля"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <span>
          <Camera size={15} />
        </span>
      </div>
      <div className="photo-settings">
        <span className="eyebrow">ВАШЕ ЛИЦО. ВАША ИСТОРИЯ.</span>
        <h3>Покажите себя</h3>
        <p>Фото появится в вашей анкете и переписках. JPEG или PNG, до 5 МБ.</p>
        <input
          ref={input}
          className="visually-hidden"
          type="file"
          accept="image/jpeg,image/png"
          aria-label="Выбрать фото профиля"
          disabled={busy}
          onChange={(e) => select(e.target.files?.[0])}
        />
        <div className="photo-actions">
          <button
            type="button"
            className="outline"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={16} />
            {profile.avatarUrl ? "Выбрать другое фото" : "Загрузить фото"}
          </button>
          {file && (
            <>
              <button
                className="primary"
                type="button"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Сохранить фото
              </button>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setFile(null);
                  if (input.current) input.current.value = "";
                }}
              >
                <X size={15} />
                Отмена
              </button>
            </>
          )}
          {!file && profile.avatarUrl?.startsWith("/api/v1/avatars/") && (
            <button
              className="text-button"
              type="button"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Удалить фото
            </button>
          )}
        </div>
        {error && (
          <p className="photo-error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="photo-success" role="status">
            <Check size={14} />
            Фото обновлено
          </p>
        )}
      </div>
    </section>
  );
}
