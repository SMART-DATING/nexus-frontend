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
export function PhotoGallery({ profile }: { profile: Profile }) {
  const [index, setIndex] = useState(0);
  const photos =
    profile.photos ??
    (profile.avatarUrl ? [{ id: 0, position: 0, url: profile.avatarUrl }] : []);
  const [broken, setBroken] = useState(false);
  const [viewer, setViewer] = useState(false);
  useEffect(() => {
    setIndex(0);
    setBroken(false);
    setViewer(false);
  }, [profile.userId]);
  useEffect(() => setBroken(false), [index, photos[index]?.url]);
  useEffect(
    () => setIndex((i) => Math.min(i, Math.max(0, photos.length - 1))),
    [photos.length],
  );
  const hidden = Math.max(
    0,
    (profile.photoCount ?? photos.length) - photos.length,
  );
  return (
    <div className="profile-gallery" aria-label="Фотографии анкеты">
      {!!photos.length && !broken && (
        <img
          key={`${photos[Math.min(index, photos.length - 1)].id}-${index}`}
          src={photos[Math.min(index, photos.length - 1)].url}
          alt={`Фото ${index + 1} из ${photos.length}`}
          draggable={false}
          onError={() => setBroken(true)}
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
          <p>Обновите подборку, чтобы снова открыть фото.</p>
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
