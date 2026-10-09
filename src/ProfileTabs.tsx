import { useId, useState, type ReactNode } from "react";
import { Camera, LockKeyhole, UserRound } from "lucide-react";

/** Keep draft editors mounted when a person switches sections. */
export function ProfileTabs({
  about,
  photos,
  story,
}: {
  about: ReactNode;
  photos: ReactNode;
  story: ReactNode;
}) {
  const id = useId();
  const [active, setActive] = useState(0);
  const sections = [
    { title: "Анкета", icon: UserRound, content: about },
    { title: "Фото", icon: Camera, content: photos },
    { title: "Для подбора", icon: LockKeyhole, content: story },
  ];
  return (
    <div className="profile-sections">
      <div className="profile-tabs" role="tablist" aria-label="Разделы профиля">
        {sections.map((section, i) => (
          <button
            key={section.title}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              let next = i;
              if (e.key === "ArrowRight") next = (i + 1) % sections.length;
              else if (e.key === "ArrowLeft")
                next = (i + sections.length - 1) % sections.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = sections.length - 1;
              else return;
              e.preventDefault();
              setActive(next);
              e.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [next]?.focus();
            }}
          >
            <section.icon size={18} />
            {section.title}
          </button>
        ))}
      </div>
      {sections.map((section, i) => (
        <div
          key={section.title}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={active !== i}
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}
