import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

export function LandingFaqItem({
  question,
  children,
  expanded,
  onToggle,
  onClose,
}: {
  question: string;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const [localOpen, setOpen] = useState(false);
  const open = expanded ?? localOpen;
  const id = useId();
  const item = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !item.current || !window.IntersectionObserver) return;
    const header = document.querySelector<HTMLElement>(".public-header");
    const inset =
      header && getComputedStyle(header).position === "sticky"
        ? header.getBoundingClientRect().height
        : 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (onClose) onClose();
          else setOpen(false);
        }
      },
      { rootMargin: `-${inset}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(item.current);
    return () => observer.disconnect();
  }, [open, onClose]);
  return (
    <div ref={item} className={`landing-faq-item ${open ? "is-expanded" : ""}`}>
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
