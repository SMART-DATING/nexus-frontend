import React, { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Heart,
  Compass,
  MessageCircle,
  UserRound,
  Bell,
  LogOut,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  X,
  Check,
  Send,
  Sparkles,
  MapPin,
  LoaderCircle,
} from "lucide-react";
import {
  api,
  value,
  type Profile,
  type User,
  type Match,
  type Message,
  type Notice,
  type Property,
} from "./api";
import "./style.css";
type Tab = "discover" | "matches" | "profile" | "notifications";
const date = (s: string) =>
  new Date(s).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const age = (birth: string) => {
  const today = new Date(),
    d = new Date(birth + "T00:00:00");
  return (
    today.getFullYear() -
    d.getFullYear() -
    (today.getMonth() < d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())
      ? 1
      : 0)
  );
};
export function App() {
  const [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [tab, setTab] = useState<Tab>("discover"),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false);
  const [people, setPeople] = useState<Profile[]>([]),
    [matches, setMatches] = useState<Match[]>([]),
    [notices, setNotices] = useState<Notice[]>([]),
    [selected, setSelected] = useState<Match | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [interests, setInterests] = useState<string[]>([]),
    [loading, setLoading] = useState(false),
    [filters, setFilters] = useState(false);
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const currentMatch = useRef<number | null>(null);
  currentMatch.current = selected?.id ?? null;
  function reset() {
    setUser(null);
    setPeople([]);
    setMatches([]);
    setNotices([]);
    setSelected(null);
    setMessages([]);
    setError("");
    setPassword("");
    setToast("");
    window.history.replaceState(null, "", "/");
    sessionStorage.removeItem("nexus-token");
  }
  function report(e: unknown) {
    setError(
      e instanceof Error ? e.message : "Не удалось подключиться к серверу",
    );
  }
  async function refresh() {
    const u = await api<User>("/users/me");
    setUser(u);
    return u;
  }
  useEffect(() => {
    const expired = () => {
      reset();
      setError("Сессия истекла. Войдите снова");
    };
    window.addEventListener("nexus-session-expired", expired);
    if (sessionStorage.getItem("nexus-token"))
      refresh()
        .catch(report)
        .finally(() => setBoot(false));
    else setBoot(false);
    return () => window.removeEventListener("nexus-session-expired", expired);
  }, []);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const matchId = window.location.pathname.match(/^\/match\/(\d+)$/)?.[1];
    if (matchId)
      api<Match>(`/matches/${matchId}`)
        .then((m) => {
          if (alive) {
            setSelected(m);
            setTab("matches");
          }
        })
        .catch((e) => {
          if (alive) report(e);
        });
    return () => {
      alive = false;
    };
  }, [user?.id]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const complete =
    !!user &&
    user.profile.properties.length === 4 &&
    user.profile.interests.length > 0;
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError("");
    const path =
      tab === "discover" && complete
        ? "/recommendations"
        : tab === "matches"
          ? "/matches"
          : tab === "notifications"
            ? "/notifications"
            : null;
    if (path)
      api<{ items: Profile[] | Match[] | Notice[] }>(path)
        .then((r) => {
          if (!alive) return;
          if (tab === "discover") setPeople(r.items as Profile[]);
          if (tab === "matches") setMatches(r.items as Match[]);
          if (tab === "notifications") setNotices(r.items as Notice[]);
        })
        .catch((e) => {
          if (alive) report(e);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    else setLoading(false);
    api<{ items: string[] }>("/interests")
      .then((r) => {
        if (alive) setInterests(r.items);
      })
      .catch((e) => {
        if (alive) report(e);
      });
    return () => {
      alive = false;
    };
  }, [tab, user?.id, complete]);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const poll = () =>
      api<{ items: Notice[] }>("/notifications")
        .then((r) => {
          if (alive) setNotices(r.items);
        })
        .catch(() => {});
    poll();
    const t = setInterval(poll, 7000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user?.id]);
  useEffect(() => {
    if (!selected || !user || tab !== "matches") return;
    let alive = true;
    setMessages([]);
    let after = 0;
    async function poll() {
      try {
        const r = await api<{ items: Message[] }>(
          `/matches/${selected!.id}/messages?after=${after}`,
        );
        if (!alive) return;
        if (r.items.length) {
          after = r.items[r.items.length - 1].id;
          setMessages((old) => [
            ...old,
            ...r.items.filter((m) => !old.some((x) => x.id === m.id)),
          ]);
        }
      } catch (e) {
        if (alive) report(e);
      }
    }
    poll();
    const t = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [selected?.id, user?.id, tab]);
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ accessToken: string; user: User }>(
        "/auth/" + (register ? "register" : "login"),
        "POST",
        { email, password },
      );
      sessionStorage.setItem("nexus-token", r.accessToken);
      setUser(r.user);
      setPassword("");
      setTab(r.user.profile.properties.length ? "discover" : "profile");
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }
  async function react(p: Profile, like: boolean) {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ matched: boolean }>(
        `/users/${p.userId}/${like ? "like" : "skip"}`,
        "POST",
      );
      setPeople((old) => old.filter((x) => x.userId !== p.userId));
      setToast(
        r.matched
          ? "Это взаимно! Новый чат уже в совпадениях."
          : like
            ? "Симпатия отправлена"
            : "Перейдём к следующему знакомству",
      );
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!selected || !text.trim()) return;
    setBusy(true);
    setError("");
    try {
      const m = await api<Message>(`/matches/${selected.id}/messages`, "POST", {
        text,
      });
      if (currentMatch.current !== selected.id) return;
      setMessages((old) =>
        old.some((x) => x.id === m.id) ? old : [...old, m],
      );
      setText("");
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }
  if (boot)
    return (
      <div className="boot">
        <LoaderCircle className="spin" /> Загружаем Nexus…
      </div>
    );
  if (!user)
    return (
      <div className="auth">
        <section className="auth-story">
          <a className="brand" href="/">
            nexus<span>✳</span>
          </a>
          <div>
            <span className="eyebrow">ЗНАКОМСТВА СО СМЫСЛОМ</span>
            <h1>
              Ближе по духу.
              <br />
              На одной <em>волне.</em>
            </h1>
            <p>
              Новые люди, общие интересы и разговоры,
              <br />
              которые хочется продолжить.
            </p>
            <div className="orbit">
              <span>♫</span>
              <span>✳</span>
              <span>♡</span>
            </div>
          </div>
          <small>Меньше случайностей. Больше общего.</small>
        </section>
        <main className="auth-form">
          <span className="eyebrow">ВАША СЛЕДУЮЩАЯ ИСТОРИЯ</span>
          <h2>{register ? "Начнём знакомство" : "С возвращением"}</h2>
          <p>
            {register
              ? "Создайте аккаунт и расскажите о себе."
              : "Ваши люди уже где-то рядом."}
          </p>
          <form onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <button disabled={busy} className="primary">
              {busy ? "Подождите…" : register ? "Создать аккаунт" : "Войти"}
              <ArrowRight size={18} />
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
          >
            {register
              ? "Уже есть аккаунт? Войти"
              : "Первый раз здесь? Зарегистрироваться"}
          </button>
          <div className="demo">
            <strong>Демонстрация прототипа</strong>
            <p>
              При запуске с демоданными: demo@nexus.local
              <br />
              Пароль: NexusDemo2026!
            </p>
            <button
              onClick={() => {
                setEmail("demo@nexus.local");
                setPassword("NexusDemo2026!");
                setRegister(false);
              }}
            >
              Заполнить демоаккаунт <ArrowUpRight size={14} />
            </button>
          </div>
          <small>Сервис знакомств для пользователей от 18 лет.</small>
        </main>
      </div>
    );
  const nav = [
    { id: "discover", label: "Знакомства", icon: Compass },
    { id: "matches", label: "Совпадения", icon: MessageCircle },
    { id: "profile", label: "Мой профиль", icon: UserRound },
    { id: "notifications", label: "Уведомления", icon: Bell },
  ] as const;
  return (
    <div className="app">
      <aside>
        <a className="brand" href="/">
          nexus<span>✳</span>
        </a>
        <span className="nav-caption">ВАШЕ ПРОСТРАНСТВО</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => {
                setTab(n.id);
                setError("");
              }}
            >
              <n.icon size={20} />
              {n.label}
              {n.id === "notifications" && notices.some((n) => !n.seen) && (
                <i />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={22} />
          <h3>Начните с общего</h3>
          <p>Добавьте интересы — и мы найдём больше точек соприкосновения.</p>
        </div>
        <div className="account">
          <div className="avatar">
            {value(user.profile, "display_name").slice(0, 1) || "Я"}
          </div>
          <div>
            <strong>
              {value(user.profile, "display_name") || "Ваш профиль"}
            </strong>
            <small>На своей волне</small>
          </div>
          <button
            aria-label="Выйти"
            title="Выйти"
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                reset();
              } catch (e) {
                report(e);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header>
          <span>
            NEXUS / <b>{nav.find((n) => n.id === tab)?.label.toUpperCase()}</b>
          </span>
          <button
            className="icon-button mobile-logout"
            aria-label="Выйти из аккаунта"
            disabled={busy}
            onClick={async () => {
              try {
                await api("/auth/logout", "POST");
                reset();
              } catch (e) {
                report(e);
              }
            }}
          >
            <LogOut size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Открыть уведомления"
            onClick={() => setTab("notifications")}
          >
            <Bell size={19} />
            {notices.some((n) => !n.seen) && <i />}
          </button>
        </header>
        {error && (
          <div role="alert" className="error">
            {error}
            <button aria-label="Закрыть ошибку" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}
        {toast && (
          <div role="status" className="toast">
            <Check size={18} />
            {toast}
          </div>
        )}
        {tab === "discover" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">ЛЮДИ, С КОТОРЫМИ ЕСТЬ ОБЩЕЕ</span>
                <h1>
                  На одной волне<span className="dot">.</span>
                </h1>
                <p>Хорошее знакомство начинается с маленького совпадения.</p>
              </div>
              <button className="outline" onClick={() => setFilters(!filters)}>
                <SlidersHorizontal size={17} />
                Предпочтения
              </button>
            </div>
            {filters && (
              <form
                className="filter-panel"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const d = new FormData(e.currentTarget);
                  setBusy(true);
                  try {
                    await api("/preferences/me", "PUT", {
                      minAge: Number(d.get("minAge")),
                      maxAge: Number(d.get("maxAge")),
                    });
                    await refresh();
                    const r = await api<{ items: Profile[] }>(
                      "/recommendations",
                    );
                    setPeople(r.items);
                    setFilters(false);
                    setToast("Предпочтения сохранены");
                  } catch (e) {
                    report(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Возраст от
                  <input
                    name="minAge"
                    type="number"
                    min={18}
                    max={100}
                    defaultValue={user.preferences.minAge}
                    required
                  />
                </label>
                <label>
                  До
                  <input
                    name="maxAge"
                    type="number"
                    min={18}
                    max={100}
                    defaultValue={user.preferences.maxAge}
                    required
                  />
                </label>
                <button className="primary" disabled={busy}>
                  Применить
                </button>
              </form>
            )}
            <div className="discover-bar">
              <span>
                <span className="live-dot" />
                Подобрано по вашим интересам
              </span>
              <small>
                {people.length} {people.length === 1 ? "профиль" : "профилей"} в
                подборке
              </small>
            </div>
            {!complete ? (
              <Empty
                title="Давайте сначала познакомимся"
                text="Заполните профиль и выберите интересы — это основа вашей подборки."
                action={() => setTab("profile")}
                label="Заполнить профиль"
              />
            ) : loading ? (
              <div className="boot">
                <LoaderCircle className="spin" />
                Ищем общее…
              </div>
            ) : people.length === 0 ? (
              <Empty
                title="Вы посмотрели всю подборку"
                text="Попробуйте расширить возрастной диапазон. Новые участники появятся здесь."
                action={() => setFilters(true)}
                label="Изменить предпочтения"
              />
            ) : (
              <div className="cards">
                {people.map((p, index) => (
                  <article className="person" key={p.userId}>
                    <div className={"portrait art-" + (p.userId % 6)}>
                      <div className="art-shape one" />
                      <div className="art-shape two" />
                      <span className="monogram">
                        {value(p, "display_name").slice(0, 1)}
                      </span>
                      <span className="card-index">
                        N° {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="score">
                        <Sparkles size={13} />
                        {Math.round((p.compatibilityScore || 0) * 100)}% общих
                        интересов
                      </span>
                    </div>
                    <div className="person-body">
                      <h2>
                        {value(p, "display_name")}
                        {value(p, "birth_date") && (
                          <span>, {age(value(p, "birth_date"))}</span>
                        )}
                      </h2>
                      {value(p, "city") && (
                        <div className="city">
                          <MapPin size={13} />
                          {value(p, "city")}
                        </div>
                      )}
                      <p className="bio">
                        {value(p, "bio") ||
                          "Лучшие истории начинаются с «привет»."}
                      </p>
                      <div className="tags">
                        {p.interests.map((i) => (
                          <span
                            key={i}
                            className={
                              p.commonInterests?.includes(i) ? "common" : ""
                            }
                          >
                            {i}
                          </span>
                        ))}
                      </div>
                      <div className="card-actions">
                        <button
                          disabled={busy}
                          className="skip"
                          onClick={() => react(p, false)}
                        >
                          <X size={18} />
                          Пропустить
                        </button>
                        <button
                          disabled={busy}
                          className="like"
                          onClick={() => react(p, true)}
                        >
                          <Heart size={18} />
                          Нравится
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="quiet-note">
              <Heart size={16} />
              Общение начинается, когда симпатия взаимна.
            </div>
          </>
        )}
        {tab === "profile" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">БЫТЬ СОБОЙ — ЛУЧШЕЕ НАЧАЛО</span>
                <h1>
                  Ваш профиль<span className="dot">.</span>
                </h1>
                <p>Расскажите, что делает вас вами.</p>
              </div>
            </div>
            <ProfileEditor
              key={user.id}
              user={user}
              interests={interests}
              busy={busy}
              onSave={async (p) => {
                setBusy(true);
                setError("");
                try {
                  await api("/profiles/me", "PUT", p);
                  await refresh();
                  setToast("Профиль сохранён");
                } catch (e) {
                  report(e);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </>
        )}
        {tab === "matches" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">СИМПАТИЯ ВЗАИМНА</span>
                <h1>
                  Есть контакт<span className="dot">.</span>
                </h1>
                <p>Самое время сказать «привет».</p>
              </div>
            </div>
            {loading ? (
              <div className="boot">Загружаем совпадения…</div>
            ) : matches.length === 0 ? (
              <Empty
                title="Ваша история ещё впереди"
                text="Поставьте симпатию в подборке. Если она взаимна, здесь появится чат."
                action={() => setTab("discover")}
                label="К знакомствам"
              />
            ) : (
              <div className="chat-layout">
                <div className="match-list">
                  {matches.map((m) => (
                    <button
                      className={selected?.id === m.id ? "selected" : ""}
                      key={m.id}
                      onClick={() => {
                        setSelected(m);
                        setText("");
                        setError("");
                        window.history.replaceState(null, "", `/match/${m.id}`);
                      }}
                    >
                      <div className="avatar">
                        {value(m.user, "display_name").slice(0, 1)}
                      </div>
                      <div>
                        <strong>{value(m.user, "display_name")}</strong>
                        <small>У вас есть общее ♡</small>
                      </div>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
                <section className="chat">
                  {selected ? (
                    <>
                      <div className="chat-title">
                        <strong>{value(selected.user, "display_name")}</strong>
                        <small>Совпадение · {date(selected.createdAt)}</small>
                      </div>
                      <div className="messages" aria-live="polite">
                        {messages.length === 0 && (
                          <p className="chat-hint">
                            Начните с вопроса об общих интересах.
                          </p>
                        )}
                        {messages.map((m) => (
                          <div
                            className={
                              "message " +
                              (m.senderId === user.id ? "mine" : "")
                            }
                            key={m.id}
                          >
                            <p>{m.text}</p>
                            <small>{date(m.createdAt)}</small>
                          </div>
                        ))}
                      </div>
                      <form className="composer" onSubmit={send}>
                        <input
                          aria-label="Сообщение"
                          placeholder="Напишите что-нибудь хорошее…"
                          maxLength={5000}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                        />
                        <button
                          className="primary"
                          aria-label="Отправить сообщение"
                          disabled={busy || !text.trim()}
                        >
                          <Send size={18} />
                        </button>
                      </form>
                    </>
                  ) : (
                    <Empty
                      title="Выберите собеседника"
                      text="Здесь начинается ваше общение."
                    />
                  )}
                </section>
              </div>
            )}
          </>
        )}
        {tab === "notifications" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">НЕ ПРОПУСТИТЕ ВАЖНОЕ</span>
                <h1>
                  Новые события<span className="dot">.</span>
                </h1>
              </div>
            </div>
            {notices.length === 0 ? (
              <Empty
                title="Пока всё спокойно"
                text="Здесь появятся новые совпадения и сообщения."
              />
            ) : (
              <div className="notices">
                {notices.map((n) => (
                  <button
                    key={n.id}
                    className={n.seen ? "" : "unread"}
                    onClick={async () => {
                      try {
                        await api(`/notifications/${n.id}/read`, "PATCH");
                        setNotices((old) =>
                          old.map((x) =>
                            x.id === n.id ? { ...x, seen: true } : x,
                          ),
                        );
                        const m = await api<Match>(`/matches/${n.matchId}`);
                        setSelected(m);
                        setTab("matches");
                      } catch (e) {
                        report(e);
                      }
                    }}
                  >
                    <div className="avatar">
                      <Heart size={20} />
                    </div>
                    <div>
                      <strong>{n.text}</strong>
                      <small>{date(n.createdAt)}</small>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <footer>
          <span>nexus ✳</span>
          <small>Знакомства со смыслом</small>
          <small>Учебный прототип · 2026</small>
        </footer>
      </main>
    </div>
  );
}
function Empty({
  title,
  text,
  action,
  label,
}: {
  title: string;
  text: string;
  action?: () => void;
  label?: string;
}) {
  return (
    <div className="empty">
      <Sparkles size={34} />
      <h2>{title}</h2>
      <p>{text}</p>
      {action && (
        <button className="primary" onClick={action}>
          {label}
          <ArrowRight size={17} />
        </button>
      )}
    </div>
  );
}
function ProfileEditor({
  user,
  interests,
  busy,
  onSave,
}: {
  user: User;
  interests: string[];
  busy: boolean;
  onSave: (p: { properties: Property[]; interests: string[] }) => void;
}) {
  const [props, setProps] = useState<Property[]>(
      ["display_name", "bio", "birth_date", "city"].map(
        (name) =>
          user.profile.properties.find((p) => p.name === name) || {
            name,
            value: "",
            visible: name !== "birth_date",
          },
      ),
    ),
    [chosen, setChosen] = useState(user.profile.interests);
  const labels: Record<string, string> = {
    display_name: "Как вас зовут",
    bio: "Немного о себе",
    birth_date: "Дата рождения",
    city: "Город",
  };
  function update(name: string, data: Partial<Property>) {
    setProps((old) =>
      old.map((p) => (p.name === name ? { ...p, ...data } : p)),
    );
  }
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ properties: props, interests: chosen });
      }}
    >
      <div className="form-intro">
        <div className="avatar large">{props[0].value.slice(0, 1) || "Я"}</div>
        <div>
          <h2>Всё начинается с вас</h2>
          <p>
            Скрытые поля видны только вам. Дата рождения используется для
            подбора.
          </p>
        </div>
      </div>
      <div className="fields">
        {props.map((p) => (
          <div className={p.name === "bio" ? "wide" : ""} key={p.name}>
            <label>
              {labels[p.name]}
              {p.name === "bio" ? (
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={p.value}
                  onChange={(e) => update(p.name, { value: e.target.value })}
                />
              ) : (
                <input
                  required
                  type={p.name === "birth_date" ? "date" : "text"}
                  maxLength={p.name === "display_name" ? 60 : 80}
                  value={p.value}
                  onChange={(e) => update(p.name, { value: e.target.value })}
                />
              )}
            </label>
            {p.name !== "display_name" && (
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={p.visible}
                  onChange={(e) =>
                    update(p.name, { visible: e.target.checked })
                  }
                />
                Показывать в профиле
              </label>
            )}
          </div>
        ))}
      </div>
      <h3>
        Ваши интересы <small>{chosen.length}/10</small>
      </h3>
      <p>Выберите от 1 до 10. Общие интересы помогут найти своих людей.</p>
      <div className="interest-picker">
        {interests.map((i) => (
          <button
            type="button"
            key={i}
            className={chosen.includes(i) ? "chosen" : ""}
            disabled={!chosen.includes(i) && chosen.length >= 10}
            onClick={() =>
              setChosen((old) =>
                old.includes(i) ? old.filter((x) => x !== i) : [...old, i],
              )
            }
          >
            {chosen.includes(i) && <Check size={14} />} {i}
          </button>
        ))}
      </div>
      <button className="primary" disabled={busy || !chosen.length}>
        {busy ? "Сохраняем…" : "Сохранить профиль"}
        <Check size={17} />
      </button>
    </form>
  );
}
