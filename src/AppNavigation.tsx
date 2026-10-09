import { useEffect, useRef, useState } from "react";
import {
  Compass,
  MessageCircle,
  UserRound,
  Bell,
  Eye,
  Shield,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { value, type User } from "./api";
type Tab = "discover" | "matches" | "profile" | "notifications";
export function AppNavigation({
  user,
  tab,
  unread,
  onNavigate,
  onPreview,
  onPrivacy,
  onLogout,
}: {
  user: User;
  tab: Tab;
  unread: boolean;
  onNavigate: (tab: Tab) => void;
  onPreview: () => void;
  onPrivacy: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  useEffect(() => setOpen(false), [tab]);
  const name = value(user.profile, "display_name") || "Твой профиль";
  return (
    <header className="app-navigation">
      <a className="brand" href="/" aria-label="Nexus — знакомства">
        <img src="/nexus-mark.svg" alt="" />
        nexus
      </a>
      <nav className="primary-navigation" aria-label="Основные разделы">
        {[
          { id: "discover", label: "Знакомства", icon: Compass },
          { id: "matches", label: "Чаты", icon: MessageCircle },
          { id: "profile", label: "Профиль", icon: UserRound },
        ].map((n) => (
          <button
            key={n.id}
            className={tab === n.id ? "active" : ""}
            aria-current={tab === n.id ? "page" : undefined}
            onClick={() => onNavigate(n.id as Tab)}
          >
            <n.icon size={19} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="navigation-actions">
        <button
          className="icon-button notification-trigger"
          aria-label="Открыть уведомления"
          onClick={() => onNavigate("notifications")}
        >
          <Bell size={20} />
          {unread && <i />}
        </button>
        <div className="account-popover" ref={menu}>
          <button
            ref={trigger}
            className="account-trigger"
            aria-label={`Профиль и настройки: ${name}`}
            aria-expanded={open}
            aria-controls="account-options"
            onClick={() => setOpen(!open)}
          >
            <span className="avatar">
              {user.profile.avatarUrl ? (
                <img src={user.profile.avatarUrl} alt="" />
              ) : (
                name[0]?.toUpperCase()
              )}
            </span>
            <span className="account-name">{name}</span>
            <ChevronDown size={15} />
          </button>
          {open && (
            <div id="account-options" className="account-options">
              <strong>{name}</strong>
              <button
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                  onPreview();
                }}
              >
                <Eye size={18} />
                Посмотреть анкету
              </button>
              <button onClick={() => onNavigate("profile")}>
                <UserRound size={18} />
                Редактировать профиль
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  trigger.current?.focus();
                  onPrivacy();
                }}
              >
                <Shield size={18} />
                Мои данные
              </button>
              <hr />
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
