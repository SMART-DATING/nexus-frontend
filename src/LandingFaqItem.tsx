import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export function LandingFaqItem({
  question,
  children,
  expanded,
  onToggle,
}: {
  question: string;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [localOpen, setOpen] = useState(false);
  const open = expanded ?? localOpen;
  const id = useId();
  return (
    <div className={`landing-faq-item ${open ? "is-expanded" : ""}`}>
      <button
        type="button"
        id={`${id}-question`}
        aria-expanded={open}
        aria-controls={`${id}-answer`}
        onPointerDown={(e) => {
          e.currentTarget.dataset.pointerFocus = "true";
        }}
        onKeyDown={(e) => {
          delete e.currentTarget.dataset.pointerFocus;
        }}
        onClick={() => (onToggle ? onToggle() : setOpen((value) => !value))}
      >
        <span>{question}</span>
        <Plus size={20} aria-hidden="true" />
      </button>
      <div
        className="faq-answer"
        id={`${id}-answer`}
        role="region"
        aria-labelledby={`${id}-question`}
        aria-hidden={!open}
        inert={!open}
      >
        <div>{children}</div>
      </div>
    </div>
  );
}
