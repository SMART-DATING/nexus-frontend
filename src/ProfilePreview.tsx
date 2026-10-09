import { MapPin, UserRound } from "lucide-react";
import { Dialog } from "./Dialog";
import { PhotoGallery } from "./PhotoGallery";
import { value, type Profile } from "./api";
export function ProfilePreview({
  profile,
  onClose,
  onEdit,
}: {
  profile: Profile;
  onClose: () => void;
  onEdit: () => void;
}) {
  const publicProfile = {
    ...profile,
    properties: profile.properties.filter((p) => p.visible),
  };
  return (
    <Dialog title="Твоя анкета" onClose={onClose} className="profile-preview">
      <div className="preview-portrait">
        <PhotoGallery profile={publicProfile} />
      </div>
      <h3>{value(publicProfile, "display_name") || "Имя скрыто"}</h3>
      {value(publicProfile, "city") && (
        <p className="preview-city">
          <MapPin size={16} />
          {value(publicProfile, "city")}
        </p>
      )}
      {value(publicProfile, "bio") && (
        <p className="preview-bio">{value(publicProfile, "bio")}</p>
      )}
      <div className="tags">
        {profile.interests.map((i) => (
          <span key={i}>{i}</span>
        ))}
      </div>
      <p className="preview-caption">
        Здесь только опубликованные поля. Тебе доступны все свои фото; другим —
        по количеству их фотографий. Личные рассказы не отображаются.
      </p>
      <button className="primary" onClick={onEdit}>
        <UserRound size={18} />
        Редактировать профиль
      </button>
    </Dialog>
  );
}
