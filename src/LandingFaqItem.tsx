import { useId, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export function LandingFaqItem({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={`landing-faq-item ${open ? "is-expanded" : ""}`}>
      <button
        type="button"
        id={`${id}-question`}
        aria-expanded={open}
        aria-controls={`${id}-answer`}
        onClick={() => setOpen((value) => !value)}
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
