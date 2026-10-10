import { useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  Copy,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import type { Profile } from "./api";

function steps(profile: Profile) {
  return [
    {
      section: 0,
      title: "Основные данные",
      detail: "Имя, город и твои предпочтения",
      done: profile.properties.length === 4,
      icon: UserRound,
    },
    {
      section: 2,
      title: "Немного о себе",
      detail: "Короткий рассказ или ответы на вопросы Некса — только для тебя",
      done: (profile.contextCount ?? 0) > 0,
      icon: Sparkles,
    },
    {
      section: 1,
      title: "Хотя бы одно фото",
      detail: "Чтобы тебя узнали и тебе открылись фото других людей",
      done: (profile.photoCount ?? profile.photos?.length ?? 0) > 0,
      icon: Camera,
    },
  ];
}

export function SetupChecklist({
  profile,
  onOpen,
}: {
  profile: Profile;
  onOpen: (section: number) => void;
}) {
  return (
    <nav className="setup-checklist" aria-label="Первые шаги">
      {steps(profile).map(({ section, title, detail, done, icon: Icon }) => (
        <button
          key={section}
          type="button"
          className={done ? "done" : "pending"}
          onClick={() => onOpen(section)}
        >
          {done ? <Check size={20} /> : <Icon size={20} />}
          <span>
            <strong>{title}</strong>
            <small>{done ? "Готово · можно изменить" : detail}</small>
          </span>
          {!done && <ArrowRight size={17} />}
        </button>
      ))}
    </nav>
  );
}

export function DiscoverySetup({
  profile,
  onOpen,
}: {
  profile: Profile;
  onOpen: (section: number) => void;
}) {
  const next = steps(profile).find((step) => !step.done)!;
  return (
    <section
      className="empty setup-empty"
      aria-label="Подготовка к знакомствам"
    >
      <Sparkles size={36} />
      <h2>Ещё немного — и можно знакомиться</h2>
      <p>
        Добавь хотя бы одно фото и немного расскажи о себе. По личному рассказу
        мы найдём общее — сам текст другие люди не увидят.
      </p>
      <SetupChecklist profile={profile} onOpen={onOpen} />
      <button
        type="button"
        className="primary"
        onClick={() => onOpen(next.section)}
      >
        {next.section === 2
          ? "Рассказать о себе"
          : next.section === 1
            ? "Добавить фото"
            : "Добавить основные данные"}
        <ArrowRight size={18} />
      </button>
    </section>
  );
}

export function InviteFriends() {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const link = `${window.location.origin}/#register`;
  return (
    <aside className="invite-friends">
      <Users size={24} />
      <div>
        <strong>Больше людей — больше общего</strong>
        <p>Позови друзей на Nexus. Возможно, их человек тоже где-то рядом.</p>
        {fallback && (
          <input
            aria-label="Ссылка для приглашения"
            value={link}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
        )}
      </div>
      <button
        type="button"
        className="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setFallback(false);
          } catch {
            setFallback(true);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Ссылка скопирована" : "Позвать друзей"}
      </button>
      <span className="visually-hidden" role="status">
        {copied ? "Приглашение скопировано" : ""}
      </span>
    </aside>
  );
}
