import { UserRound } from "lucide-react";
import { Dialog } from "./Dialog";
import { ProfileCard } from "./ProfileCard";
import { type Profile } from "./api";
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
      <ProfileCard profile={publicProfile} own />
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
