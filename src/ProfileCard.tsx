import { type ReactNode } from "react";
import { Heart, MapPin, Sparkles } from "lucide-react";
import { value, type Profile } from "./api";
import { PhotoGallery } from "./PhotoGallery";

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
  const common = p.commonInterests ?? [];
  const name = value(p, "display_name") || "Имя скрыто";
  return (
    <div
      className={`profile-card-content ${value(p, "bio").length > 280 ? "long-bio" : ""}`}
    >
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
        {!own && typeof p.compatibilityScore === "number" && (
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
      </div>
    </div>
  );
}
