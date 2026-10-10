import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Mail,
  MailOpen,
  Eraser,
  Trash2,
} from "lucide-react";
import { Dialog } from "./Dialog";
import type { Match } from "./api";

export type ChatAction =
  | "pin"
  | "unpin"
  | "unread"
  | "read"
  | "clear"
  | "delete";
export function ChatMenu({
  match,
  onAction,
  children,
}: {
  match: Match;
  onAction: (action: ChatAction) => Promise<void>;
  children?: ReactNode;
}) {
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [confirm, setConfirm] = useState<"clear" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  function close(restore = true) {
    setPoint(null);
    if (restore) origin.current?.focus();
  }
  function open(x: number, y: number) {
    origin.current = document.activeElement as HTMLElement;
    setPoint({ x, y });
  }
  useLayoutEffect(() => {
    if (!point || !menu.current) return;
    const rect = menu.current.getBoundingClientRect();
    menu.current.style.left = `${Math.max(8, Math.min(point.x, innerWidth - rect.width - 8))}px`;
    menu.current.style.top = `${Math.max(8, Math.min(point.y, innerHeight - rect.height - 8))}px`;
    menu.current
      .querySelector<HTMLButtonElement>("button")
      ?.focus({ preventScroll: true });
  }, [point]);
  useEffect(() => {
    if (!point) return;
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) close(false);
    };
    const dismiss = () => close(false);
    const scroll = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", dismiss);
    window.addEventListener("wheel", scroll, true);
    window.addEventListener("touchmove", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("wheel", scroll, true);
      window.removeEventListener("touchmove", scroll, true);
    };
  }, [point]);
  async function execute(action: ChatAction) {
    setBusy(true);
    setError("");
    try {
      await onAction(action);
      setConfirm(null);
      close();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось выполнить действие. Попробуй ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  }
  const items = [
    {
      action: match.pinned ? "unpin" : "pin",
      label: match.pinned ? "Открепить" : "Закрепить",
      icon: match.pinned ? PinOff : Pin,
    },
    {
      action: match.unreadCount ? "read" : "unread",
      label: match.unreadCount
        ? "Отметить прочитанным"
        : "Отметить непрочитанным",
      icon: match.unreadCount ? MailOpen : Mail,
    },
    { action: "clear", label: "Очистить переписку", icon: Eraser },
    { action: "delete", label: "Удалить чат", icon: Trash2 },
  ] as const;
  return (
    <div
      className={children ? "match-row" : "chat-menu-trigger"}
      onContextMenu={(e) => {
        e.preventDefault();
        open(e.clientX, e.clientY);
      }}
      onKeyDown={(e) => {
        if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
          e.preventDefault();
          const r = e.currentTarget.getBoundingClientRect();
          open(r.left + 24, r.top + 24);
        }
      }}
    >
      {children}
      <button
        type="button"
        ref={trigger}
        className="icon-button chat-more"
        aria-label="Действия с чатом"
        aria-haspopup="menu"
        aria-expanded={!!point}
        onClick={() => {
          if (point) close();
          else {
            const r = trigger.current!.getBoundingClientRect();
            open(r.right - 240, r.bottom + 4);
          }
        }}
      >
        <MoreHorizontal size={20} />
      </button>
      {point &&
        createPortal(
          <div
            ref={menu}
            className="chat-context-menu"
            role="menu"
            aria-label="Действия с чатом"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                close();
                return;
              }
              if (e.key === "Tab") {
                close(false);
                return;
              }
              const buttons = Array.from(
                menu.current!.querySelectorAll<HTMLButtonElement>("button"),
              );
              const index = buttons.indexOf(
                document.activeElement as HTMLButtonElement,
              );
              const next =
                e.key === "ArrowDown"
                  ? (index + 1) % buttons.length
                  : e.key === "ArrowUp"
                    ? (index + buttons.length - 1) % buttons.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? buttons.length - 1
                        : -1;
              if (next >= 0) {
                e.preventDefault();
                buttons[next].focus();
              }
            }}
          >
            {items.map((item) => (
              <button
                key={item.action}
                type="button"
                role="menuitem"
                disabled={busy}
                onClick={() => {
                  if (item.action === "clear" || item.action === "delete") {
                    close();
                    setError("");
                    setConfirm(item.action);
                  } else void execute(item.action);
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            {error && <p role="alert">{error}</p>}
          </div>,
          document.body,
        )}
      {confirm && (
        <Dialog
          title={confirm === "clear" ? "Очистить переписку?" : "Удалить чат?"}
          onClose={() => {
            if (!busy) setConfirm(null);
          }}
        >
          <p>
            {confirm === "clear"
              ? "Текущие сообщения исчезнут только у тебя. У собеседника переписка останется. Новые сообщения будут отображаться как обычно."
              : "Чат исчезнет из твоего списка. У собеседника он останется. Новое сообщение вернёт его в список."}
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="chat-confirm-actions">
            <button
              className="outline"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Отмена
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={() => void execute(confirm)}
            >
              {busy
                ? "Сохраняем…"
                : confirm === "clear"
                  ? "Очистить"
                  : "Удалить"}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export function activityLabel(value?: string | null) {
  if (!value) return "Нет данных об активности";
  const ago = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ago)) return "Нет данных об активности";
  if (ago < 75_000) return "В сети";
  if (ago < 3_600_000) return "Заходил(а) недавно";
  return `Последний заход: ${new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}
