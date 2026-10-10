import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { api, value, type Profile } from "./api";
import { Dialog } from "./Dialog";
import { ProfileCard } from "./ProfileCard";
import { ProfileAvatar } from "./ProfileAvatar";

export function ChatPartner({
  profile,
  onBlocked,
  onError,
}: {
  profile: Profile;
  onBlocked: () => void;
  onError: (error: unknown) => void;
}) {
  const [view, setView] = useState(false);
  const [fresh, setFresh] = useState<Profile | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [blockError, setBlockError] = useState("");
  const name = value(profile, "display_name") || "Собеседник";
  useEffect(() => {
    if (!view) return;
    let alive = true;
    setFresh(null);
    setFailure("");
    api<Profile>(`/profiles/${profile.userId}`)
      .then((p) => {
        if (alive) setFresh(p);
      })
      .catch(() => {
        if (alive)
          setFailure("Анкета сейчас недоступна. Попробуй открыть её позже.");
      });
    return () => {
      alive = false;
    };
  }, [view, profile.userId]);
  async function block() {
    setBusy(true);
    setBlockError("");
    try {
      await api(`/users/${profile.userId}/block`, "POST");
      setConfirm(false);
      onBlocked();
    } catch (e) {
      setBlockError(
        e instanceof Error
          ? e.message
          : "Не удалось заблокировать. Попробуй ещё раз.",
      );
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        className="chat-partner"
        aria-label={`Посмотреть анкету ${name}`}
        onClick={() => setView(true)}
      >
        <ProfileAvatar profile={profile} />
        <strong>{name}</strong>
      </button>
      <button
        type="button"
        className="icon-button chat-block"
        title="Заблокировать пользователя"
        aria-label={`Заблокировать ${name}`}
        onClick={() => {
          setBlockError("");
          setConfirm(true);
        }}
      >
        <Ban size={19} />
      </button>
      {view && (
        <Dialog
          title={`Анкета · ${name}`}
          onClose={() => setView(false)}
          className="profile-preview partner-preview"
        >
          {fresh ? (
            <ProfileCard profile={fresh} />
          ) : (
            <p role="status">{failure || "Загружаем анкету…"}</p>
          )}
        </Dialog>
      )}
      {confirm && (
        <Dialog
          title={`Заблокировать ${name}?`}
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <p>
            Вы исчезнете из чатов и подбора друг друга. Собеседник не сможет
            писать тебе или открывать твою анкету. История сохранится;
            блокировку можно снять в разделе «Заблокированные».
          </p>
          <div className="block-dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Отмена
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={busy}
              onClick={block}
            >
              {busy ? "Блокируем…" : "Заблокировать"}
            </button>
          </div>
          {blockError && <p role="alert">{blockError}</p>}
        </Dialog>
      )}
    </>
  );
}

type Blocked = { userId: number; displayName: string; createdAt: string };
export function BlockedUsers({
  onUnblocked,
  onError,
}: {
  onUnblocked: () => void;
  onError: (error: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setFailure("");
    api<{ items: Blocked[] }>("/users/me/blocks")
      .then((r) => {
        if (alive) setItems(r.items);
      })
      .catch(() => {
        if (alive)
          setFailure(
            "Не удалось загрузить список. Закрой окно и попробуй ещё раз.",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);
  async function unblock(id: number) {
    setBusy(id);
    try {
      await api(`/users/${id}/block`, "DELETE");
      setItems((old) => old.filter((x) => x.userId !== id));
      onUnblocked();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <button
        type="button"
        className="text-button blocked-users-trigger"
        onClick={() => setOpen(true)}
      >
        Заблокированные
      </button>
      {open && (
        <Dialog
          title="Заблокированные пользователи"
          onClose={() => {
            if (busy === null) setOpen(false);
          }}
        >
          {loading || failure ? (
            <p role="status">{failure || "Загружаем список…"}</p>
          ) : !items.length ? (
            <p>Ты пока никого не заблокировал.</p>
          ) : (
            <ul className="blocked-users-list">
              {items.map((person) => (
                <li key={person.userId}>
                  <strong>{person.displayName}</strong>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy !== null}
                    onClick={() => unblock(person.userId)}
                  >
                    {busy === person.userId ? "Снимаем…" : "Разблокировать"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog>
      )}
    </>
  );
}
