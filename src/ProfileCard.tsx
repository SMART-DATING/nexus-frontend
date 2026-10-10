import { useState, type ReactNode } from "react";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { value, type Profile } from "./api";
import { PhotoGallery } from "./PhotoGallery";

const ideas: Record<string, string> = {
  Музыка: "Какой трек у тебя сейчас на повторе?",
  Кофе: "Кофе на прогулке или уютная кофейня?",
  Кино: "Какой фильм хочется пересмотреть вместе?",
  Путешествия: "Куда отправимся на маленькие выходные?",
  Книги: "Какая книга тебя недавно зацепила?",
  Игры: "Настолки или видеоигры — что выбираешь?",
};

export function ProfileCard({
  profile: p,
  own = false,
  onPhotoChange,
  children,
}: {
  profile: Profile;
  own?: boolean;
  onPhotoChange?: (url?: string) => void;
  children?: ReactNode;
}) {
  const [idea, setIdea] = useState("");
  const common = p.commonInterests ?? [];
  const name = value(p, "display_name") || "Имя скрыто";
  return (
    <div className="profile-card-content">
      <div className="mobile-profile-heading">
        <div>
          <strong>{name}</strong>
          {value(p, "city") && (
            <span>
              <MapPin size={13} />
              {value(p, "city")}
            </span>
          )}
        </div>
        {!own && typeof p.compatibilityScore === "number" && (
          <span className="mobile-score">
            <Sparkles size={14} />
            {Math.round(Math.min(1, Math.max(0, p.compatibilityScore)) * 100)}%
            <small>совпадения</small>
          </span>
        )}
      </div>
      <div className={`swipe-portrait art-${p.userId % 6}`}>
        <PhotoGallery profile={p} onPhotoChange={onPhotoChange} />
        {children}
      </div>
      <div className="swipe-story">
        {!own && (
          <span className="story-label">
            <Sparkles size={16} />
            {typeof p.compatibilityScore === "number"
              ? `${Math.round(Math.min(1, Math.max(0, p.compatibilityScore)) * 100)}% совпадения`
              : "По твоей истории"}
          </span>
        )}
        <div className="profile-identity">
          <h2>{name}</h2>
          {value(p, "city") && (
            <span>
              <MapPin size={16} />
              {value(p, "city")}
            </span>
          )}
        </div>
        <p className="profile-bio">
          {value(p, "bio") || "Лучшие истории начинаются с «привет»."}
        </p>
        <div className="tags">
          {p.interests.map((i) => (
            <span
              key={i}
              className={common.includes(i) ? "common" : ""}
              title={common.includes(i) ? "Ваш общий интерес" : undefined}
            >
              {common.includes(i) && <Heart size={12} aria-hidden="true" />}
              {i}
            </span>
          ))}
        </div>
        {!!p.interests.length && (
          <div className="conversation-starter">
            <h3>С чего начать разговор</h3>
            <div className="connection-interests">
              {(common.length ? common : p.interests.slice(0, 3)).map((i) => (
                <button
                  type="button"
                  key={i}
                  aria-pressed={
                    idea ===
                    (ideas[i] ||
                      `Что тебе больше всего нравится в теме «${i}»?`)
                  }
                  onClick={() =>
                    setIdea(
                      ideas[i] ||
                        `Что тебе больше всего нравится в теме «${i}»?`,
                    )
                  }
                >
                  {i}
                </button>
              ))}
            </div>
            <p className="conversation-prompt">
              {idea || "Как выглядит твой идеальный выходной?"}
            </p>
          </div>
        )}
        {!own && typeof p.compatibilityScore === "number" && (
          <small className="matching-explanation">
            Сходство ваших личных рассказов, а не прогноз отношений. Сами
            рассказы остаются скрытыми.
          </small>
        )}
      </div>
    </div>
  );
}
