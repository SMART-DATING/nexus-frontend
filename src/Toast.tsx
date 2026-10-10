import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (message) {
      setText(message);
      let nextFrame = 0;
      const frame = requestAnimationFrame(() => {
        nextFrame = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(nextFrame);
      };
    }
    setVisible(false);
    const timer = setTimeout(() => setText(""), 260);
    return () => clearTimeout(timer);
  }, [message]);
  return text
    ? createPortal(
        <div
          className={`nexus-toast${visible ? " is-visible" : ""}`}
          role="status"
        >
          <span className="toast-check">
            <Check size={17} />
          </span>
          <span>{text}</span>
          <button
            type="button"
            aria-label="Закрыть уведомление"
            onClick={onDismiss}
          >
            <X size={16} />
          </button>
        </div>,
        document.body,
      )
    : null;
}
