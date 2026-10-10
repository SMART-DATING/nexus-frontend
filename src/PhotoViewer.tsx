import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog } from "./Dialog";
import type { Profile } from "./api";
export function PhotoViewer({
  photos,
  initialIndex,
  onClose,
  onError,
  onRetry,
  loading = false,
}: {
  photos: NonNullable<Profile["photos"]>;
  initialIndex: number;
  onClose: () => void;
  onError?: (url: string) => void;
  onRetry?: () => void;
  loading?: boolean;
}) {
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));
  const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
  const [broken, setBroken] = useState(false);
  const currentIndex = Math.max(0, Math.min(index, photos.length - 1));
  useEffect(() => setBroken(false), [currentIndex, photos[currentIndex]?.url]);
  useEffect(() => {
    if (!loading) setBroken(false);
  }, [loading]);
  const move = (step: number) =>
    setIndex((i) => (i + step + photos.length) % photos.length);
  return (
    <Dialog title="Фотографии" onClose={onClose} className="photo-viewer">
      <div
        className="viewer-stage"
        tabIndex={0}
        aria-label="Просмотр фотографии"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            move(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onPointerDown={(e) => {
          if (
            e.isPrimary &&
            e.button === 0 &&
            !(e.target as HTMLElement).closest("button")
          ) {
            gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        onPointerUp={(e) => {
          const g = gesture.current;
          gesture.current = null;
          if (!g || g.id !== e.pointerId) return;
          const dx = e.clientX - g.x,
            dy = e.clientY - g.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4)
            move(dx < 0 ? 1 : -1);
        }}
      >
        {!broken && photos[currentIndex] ? (
          <img
            key={photos[currentIndex].id}
            src={photos[currentIndex].url}
            alt={`Фото ${currentIndex + 1} из ${photos.length}`}
            draggable={false}
            onError={() => {
              setBroken(true);
              onError?.(photos[currentIndex].url);
            }}
          />
        ) : (
          <div className="viewer-error">
            <p role="status">
              {loading ? "Обновляем фото…" : "Фото сейчас недоступно."}
            </p>
            {onRetry && (
              <button className="outline" disabled={loading} onClick={onRetry}>
                Попробовать снова
              </button>
            )}
          </div>
        )}
        {photos.length > 1 && (
          <>
            <button
              className="viewer-prev"
              aria-label="Предыдущее фото в просмотре"
              onClick={() => move(-1)}
            >
              <ChevronLeft />
            </button>
            <button
              className="viewer-next"
              aria-label="Следующее фото в просмотре"
              onClick={() => move(1)}
            >
              <ChevronRight />
            </button>
          </>
        )}
        <span className="viewer-position" role="status">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>
      {photos.length > 1 && (
        <div className="viewer-thumbnails">
          {photos.map((p, i) => (
            <button
              key={p.id}
              className={i === currentIndex ? "active" : ""}
              aria-label={`Открыть фото ${i + 1} в просмотре`}
              aria-pressed={i === currentIndex}
              onClick={() => setIndex(i)}
            >
              <img src={p.url} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </Dialog>
  );
}
