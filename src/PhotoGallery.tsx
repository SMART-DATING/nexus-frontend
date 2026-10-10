import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Camera,
  Expand,
} from "lucide-react";
import type { Profile } from "./api";
import { PhotoViewer } from "./PhotoViewer";
import { useProfileMedia } from "./useProfileMedia";
export function PhotoGallery({
  profile,
  onPhotoChange,
}: {
  profile: Profile;
  onPhotoChange?: (url?: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const media = useProfileMedia(profile);
  const photos =
    media.profile.photos ??
    (media.profile.avatarUrl
      ? [{ id: 0, position: 0, url: media.profile.avatarUrl }]
      : []);
  const current = photos[Math.min(index, Math.max(0, photos.length - 1))];
  const broken = !!current && media.failed.includes(current.url);
  const [viewer, setViewer] = useState(false);
  useEffect(() => {
    setIndex(0);
    setViewer(false);
  }, [profile.userId]);
  useEffect(
    () => onPhotoChange?.(photos[index]?.url),
    [index, photos[index]?.url, onPhotoChange],
  );
  useEffect(
    () => setIndex((i) => Math.min(i, Math.max(0, photos.length - 1))),
    [photos.length],
  );
  const hidden = Math.max(
    0,
    (media.profile.photoCount ?? photos.length) - photos.length,
  );
  return (
    <div
      className="profile-gallery"
      aria-label="Фотографии анкеты"
      style={
        {
          "--gallery-photo": photos[index]?.url
            ? `url("${photos[index].url.replaceAll('"', "%22")}")`
            : "none",
        } as React.CSSProperties
      }
    >
      {!!photos.length && !broken && (
        <img
          key={current.url}
          src={photos[Math.min(index, photos.length - 1)].url}
          alt={`Фото ${index + 1} из ${photos.length}`}
          draggable={false}
          onError={() => media.onError(current.url)}
        />
      )}
      {!!photos.length && !broken && (
        <button
          type="button"
          className="gallery-expand"
          aria-label="Открыть фотографии"
          onClick={() => setViewer(true)}
        >
          <Expand size={17} />
        </button>
      )}
      {viewer && !!photos.length && (
        <PhotoViewer
          photos={photos}
          initialIndex={Math.min(index, photos.length - 1)}
          onClose={() => setViewer(false)}
          onError={media.onError}
          onRetry={() => void media.refresh()}
          loading={media.loading}
        />
      )}
      {!photos.length && (
        <div className="locked-gallery">
          <span>
            <LockKeyhole size={32} />
          </span>
          <h3>
            {profile.photoCount === 0
              ? "Пока без фотографий"
              : "Знакомство начинается глубже"}
          </h3>
          <p>
            {profile.photoCount === 0
              ? "У этого человека ещё нет фото. Можно начать с разговора."
              : "Добавьте своё фото, чтобы увидеть первое фото этого человека."}
          </p>
          {hidden > 0 && (
            <a className="gallery-unlock" href="/#profile/photos">
              <Camera size={14} />
              Добавить своё фото
            </a>
          )}
        </div>
      )}
      {broken && (
        <div className="locked-gallery">
          <Camera size={28} />
          <p role="status">
            {media.loading ? "Обновляем фото…" : "Не удалось загрузить фото."}
          </p>
          <button
            type="button"
            className="outline"
            disabled={media.loading}
            onClick={() => void media.refresh()}
          >
            Попробовать снова
          </button>
        </div>
      )}
      {photos.length > 1 && (
        <>
          <div className="gallery-dots">
            {photos.map((p, i) => (
              <button
                type="button"
                key={p.id}
                className={i === index ? "active" : ""}
                aria-label={`Показать фото ${i + 1}`}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="gallery-prev"
            aria-label="Предыдущее фото"
            onClick={() =>
              setIndex((index + photos.length - 1) % photos.length)
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="gallery-next"
            aria-label="Следующее фото"
            onClick={() => setIndex((index + 1) % photos.length)}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      {(photos.length > 0 || hidden > 0) && (
        <span className="gallery-count">
          {photos.length ? `${index + 1}/${photos.length}` : "0"}
          {hidden > 0 && (
            <>
              <LockKeyhole size={12} />
              <span>ещё {hidden}</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
