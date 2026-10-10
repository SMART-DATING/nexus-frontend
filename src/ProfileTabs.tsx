import { useEffect, useId, useState, type ReactNode } from "react";
import { Camera, UserRound } from "lucide-react";

/** Keep draft editors mounted when a person switches sections. */
export function ProfileTabs({
  about,
  photos,
  initialTab = 0,
  onChange,
}: {
  about: ReactNode;
  photos: ReactNode;
  initialTab?: number;
  onChange?: (index: number) => void;
}) {
  const id = useId();
  const [active, setActive] = useState(initialTab);
  useEffect(() => setActive(initialTab), [initialTab]);
  function select(index: number) {
    setActive(index);
    onChange?.(index);
  }
  const sections = [
    { title: "Анкета", icon: UserRound, content: about },
    { title: "Фото", icon: Camera, content: photos },
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
            onClick={() => select(i)}
            onKeyDown={(e) => {
              let next = i;
              if (e.key === "ArrowRight") next = (i + 1) % sections.length;
              else if (e.key === "ArrowLeft")
                next = (i + sections.length - 1) % sections.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = sections.length - 1;
              else return;
              e.preventDefault();
              select(next);
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
