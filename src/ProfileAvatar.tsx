import { value, type Profile } from "./api";
import { useProfileMedia } from "./useProfileMedia";

export function ProfileAvatar({
  profile,
  large = false,
}: {
  profile: Profile;
  large?: boolean;
}) {
  const media = useProfileMedia(profile);
  const url = media.profile.avatarUrl;
  return (
    <span className={`avatar${large ? " large" : ""}`}>
      {value(profile, "display_name").slice(0, 1) || "Я"}
      {url && !media.failed.includes(url) && (
        <img
          className="avatar-photo"
          src={url}
          alt=""
          onError={() => media.onError(url)}
        />
      )}
    </span>
  );
}
