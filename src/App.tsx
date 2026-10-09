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
  RotateCcw,
} from "lucide-react";
import {
  api,
  ApiError,
  value,
  type Profile,
  type User,
  type Match,
  type Message,
  type Notice,
  type Property,
} from "./api";
import "./style.css";
import "./swipe.css";
import { SwipeDeck } from "./SwipeDeck";
import { PhotoUpload } from "./PhotoUpload";
import { ContextEditor } from "./ContextEditor";
import "./semantic.css";
import { Onboarding } from "./Onboarding";
import "./youth.css";
type Tab = "discover" | "matches" | "profile" | "notifications";
function readRoute(): { tab: Tab; matchId: number | null } {
  const id = window.location.pathname.match(/^\/match\/(\d+)$/)?.[1];
  if (id) return { tab: "matches", matchId: Number(id) };
  const section = window.location.hash.slice(1);
  return {
    tab: ["matches", "profile", "notifications"].includes(section)
      ? (section as Tab)
      : "discover",
    matchId: null,
  };
}
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
    [tab, setTab] = useState<Tab>(() => readRoute().tab),
    [routeMatchId, setRouteMatchId] = useState<number | null>(
      () => readRoute().matchId,
    ),
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
    [filters, setFilters] = useState(false),
    [skippedCount, setSkippedCount] = useState(0),
    [celebration, setCelebration] = useState<Match | null>(null);
  const [cycle, setCycle] = useState(1),
    [reviewed, setReviewed] = useState(0),
    [liked, setLiked] = useState(0);
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [onboardingDismissed, setOnboardingDismissed] = useState<number | null>(
    () => Number(sessionStorage.getItem("nexus-onboarding-dismissed")) || null,
  );
  const currentMatch = useRef<number | null>(null);
  currentMatch.current = selected?.id ?? null;
  function navigate(next: Tab, match: Match | null = null) {
    const url = match
      ? `/match/${match.id}`
      : next === "discover"
        ? "/"
        : `/#${next}`;
    if (window.location.pathname + window.location.hash !== url)
      window.history.pushState(null, "", url);
    setTab(next);
    setRouteMatchId(match?.id ?? null);
    setSelected(match);
    setText("");
    setError("");
  }
  useEffect(() => {
    const sync = () => {
      const route = readRoute();
      setTab(route.tab);
      setRouteMatchId(route.matchId);
      setSelected(null);
      setText("");
      setError("");
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  function reset() {
    setUser(null);
    setOnboardingDismissed(null);
    sessionStorage.removeItem("nexus-onboarding-dismissed");
    setPeople([]);
    setMatches([]);
    setNotices([]);
    setSelected(null);
    setMessages([]);
    setError("");
    setPassword("");
    setToast("");
    setCelebration(null);
    setSkippedCount(0);
    setCycle(1);
    setReviewed(0);
    setLiked(0);
    setTab("discover");
    setRouteMatchId(null);
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
    const matchId = routeMatchId;
    if (matchId)
      api<Match>(`/matches/${matchId}`)
        .then((m) => {
          if (alive && readRoute().matchId === matchId) {
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
  }, [user?.id, routeMatchId]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const complete =
    !!user &&
    user.profile.properties.length === 4 &&
    (user.profile.contextCount ?? 0) > 0;
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setError("");
    const path =
      tab === "discover" && complete
        ? "/recommendations/next"
        : tab === "matches"
          ? "/matches"
          : tab === "notifications"
            ? "/notifications"
            : null;
    if (path)
      api<{
        items: Profile[] | Match[] | Notice[];
        skippedCount?: number;
        cycleRestarted?: boolean;
      }>(path, tab === "discover" ? "POST" : "GET")
        .then((r) => {
          if (!alive) return;
          if (tab === "discover") {
            setPeople(r.items as Profile[]);
            setSkippedCount(r.skippedCount ?? 0);
            if (r.cycleRestarted) {
              setCycle((old) => old + 1);
              setToast("Новый круг: пропущенные анкеты снова здесь");
            }
          }
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
    let inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const r = await api<{ items: Notice[] }>("/notifications");
        if (alive) setNotices(r.items);
        if (tab === "matches") {
          const m = await api<{ items: Match[] }>("/matches");
          if (alive) setMatches(m.items);
        }
      } catch (e) {
        if (alive) report(e);
      } finally {
        inFlight = false;
      }
    };
    poll();
    const t = setInterval(poll, 7000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user?.id, tab]);
  useEffect(() => {
    if (!selected || !user || tab !== "matches") return;
    let alive = true;
    setMessages([]);
    let after = 0;
    let inFlight = false;
    async function poll() {
      if (inFlight) return;
      inFlight = true;
      try {
        const r = await api<{ items: Message[] }>(
          `/matches/${selected!.id}/messages?after=${after}`,
        );
        if (!alive) return;
        if (r.items.length) {
          after = r.items[r.items.length - 1].id;
          setMessages((old) =>
            [
              ...old,
              ...r.items.filter((m) => !old.some((x) => x.id === m.id)),
            ].sort((a, b) => a.id - b.id),
          );
        }
      } catch (e) {
        if (alive) report(e);
      } finally {
        inFlight = false;
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
      if (!readRoute().matchId) navigate("discover");
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
      const r = await api<{ matched: boolean; matchId?: number }>(
        `/users/${p.userId}/${like ? "like" : "skip"}`,
        "POST",
      );
      setPeople((old) => old.filter((x) => x.userId !== p.userId));
      setReviewed((old) => old + 1);
      if (like) setLiked((old) => old + 1);
      if (!like) setSkippedCount((old) => old + 1);
      if (r.matched && r.matchId) {
        setCelebration({
          id: r.matchId,
          user: p,
          createdAt: new Date().toISOString(),
        });
      }
      setToast(
        r.matched
          ? "Это взаимно! Новый чат уже в совпадениях."
          : like
            ? "Симпатия отправлена"
            : "Перейдём к следующему знакомству",
      );
      if (people.length === 1) {
        const next = await api<{
          items: Profile[];
          skippedCount: number;
          cycleRestarted: boolean;
        }>("/recommendations/next", "POST");
        setPeople(next.items);
        setSkippedCount(next.skippedCount);
        if (next.cycleRestarted) {
          setCycle((old) => old + 1);
          setToast("Новый круг: пропущенные анкеты снова здесь");
        }
      }
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409)
        setPeople((old) => old.filter((x) => x.userId !== p.userId));
      report(e);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function restartRecommendations() {
    setBusy(true);
    setError("");
    try {
      const next = await api<{
        items: Profile[];
        skippedCount?: number;
        cycleRestarted?: boolean;
      }>("/recommendations/next", "POST");
      setPeople(next.items);
      setSkippedCount(next.skippedCount ?? 0);
      if (next.cycleRestarted) setCycle((old) => old + 1);
      setToast(
        next.items.length
          ? "Подборка обновлена"
          : "Пока нет анкет по вашим предпочтениям",
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
            <img className="brand-icon" src="/nexus-mark.svg" alt="" />
            nexus
          </a>
          <div>
            <span className="eyebrow">ЗНАКОМСТВА СО СМЫСЛОМ</span>
            <h1>
              Твой вайб.
              <br />
              Твои <em>люди.</em>
            </h1>
            <p>
              Расскажи, что тебя цепляет.
              <br />
              Найди того, кто чувствует похоже.
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
          <div className="auth-benefits">
            <span>✦ Подбор по смыслу</span>
            <span>♡ Взаимная симпатия</span>
            <span>◌ Личные истории скрыты</span>
          </div>
          <small>Сервис знакомств для пользователей от 18 лет.</small>
        </main>
      </div>
    );
  if (!complete && onboardingDismissed !== user.id)
    return (
      <>
        <Onboarding
          key={user.id}
          user={user}
          interests={interests}
          onDone={async () => {
            await refresh();
            navigate("discover");
            setToast("Твоя история сохранена. Пора знакомиться!");
          }}
          onLater={() => {
            void refresh()
              .then(() => {
                sessionStorage.setItem(
                  "nexus-onboarding-dismissed",
                  String(user.id),
                );
                setOnboardingDismissed(user.id);
                navigate("profile");
              })
              .catch(report);
          }}
        />
        {error && (
          <div className="onboarding-error" role="alert">
            {error}
            <button
              onClick={() => {
                void api<{ items: string[] }>("/interests")
                  .then((r) => setInterests(r.items))
                  .then(refresh)
                  .then(() => setError(""))
                  .catch(report);
              }}
            >
              Повторить
            </button>
          </div>
        )}
      </>
    );
  const nav = [
    { id: "discover", label: "Знакомства", icon: Compass },
    { id: "matches", label: "Совпадения", icon: MessageCircle },
    { id: "profile", label: "Мой профиль", icon: UserRound },
    { id: "notifications", label: "Уведомления", icon: Bell },
  ] as const;
  return (
    <div className={`app ${tab === "discover" ? "is-discover" : ""}`}>
      <aside>
        <a className="brand" href="/">
          <img className="brand-icon" src="/nexus-mark.svg" alt="" />
          nexus
        </a>
        <span className="nav-caption">ВАШЕ ПРОСТРАНСТВО</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={tab === n.id ? "active" : ""}
              onClick={() => navigate(n.id)}
              aria-current={tab === n.id ? "page" : undefined}
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
          <h3>На какой ты волне?</h3>
          <p>Твои истории помогают найти тех, кто тебя понимает.</p>
          <button className="text-button" onClick={() => navigate("profile")}>
            Добавить свой вайб <ArrowRight size={15} />
          </button>
        </div>
        <div className="account">
          <Avatar profile={user.profile} />
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
            onClick={() => navigate("notifications")}
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
        {celebration && (
          <MatchCelebration
            match={celebration}
            me={user.profile}
            onClose={() => setCelebration(null)}
            onOpen={() => {
              navigate("matches", celebration);
              setCelebration(null);
            }}
          />
        )}
        {tab === "discover" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">ЛЮДИ, С КОТОРЫМИ ЕСТЬ ОБЩЕЕ</span>
                <h1>
                  На одной волне<span className="dot">.</span>
                </h1>
                <p>Новый человек. Знакомое чувство.</p>
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
                    const r = await api<{
                      items: Profile[];
                      skippedCount?: number;
                      cycleRestarted?: boolean;
                    }>("/recommendations/next", "POST");
                    setPeople(r.items);
                    setSkippedCount(r.skippedCount ?? 0);
                    if (r.cycleRestarted) setCycle((c) => c + 1);
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
                Подобрано по смыслу ваших рассказов
              </span>
              <small>
                {people.length} {people.length === 1 ? "профиль" : "профилей"} в
                подборке
              </small>
            </div>
            {!complete ? (
              <Empty
                title="Давайте сначала познакомимся"
                text="Заполните основные данные и добавьте личный рассказ — по нему мы найдём близких по духу людей. Рассказ виден только вам."
                action={() => navigate("profile")}
                label="Заполнить профиль"
              />
            ) : loading ? (
              <div className="boot">
                <LoaderCircle className="spin" />
                Ищем общее…
              </div>
            ) : people.length === 0 ? (
              <div className="empty">
                <Sparkles size={40} />
                <h2>Новые лица ещё появятся</h2>
                <p>
                  Вы поставили симпатии всем подходящим анкетам или фильтр пока
                  слишком узкий. Попробуйте расширить возрастной диапазон.
                  Пропущенные анкеты возвращаются автоматически, когда круг
                  заканчивается.
                </p>
                <div className="empty-actions">
                  {
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={restartRecommendations}
                    >
                      <RotateCcw size={18} />
                      {busy ? "Обновляем подборку…" : "Обновить подборку"}
                    </button>
                  }
                  <button className="outline" onClick={() => setFilters(true)}>
                    <SlidersHorizontal size={17} />
                    Изменить предпочтения
                  </button>
                  <button
                    className="text-button"
                    onClick={() => navigate("matches")}
                  >
                    К совпадениям <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <SwipeDeck
                people={people}
                busy={busy}
                onReact={react}
                cycle={cycle}
                reviewed={reviewed}
                liked={liked}
                onFocus={(id) =>
                  setPeople((old) => [
                    ...old.filter((p) => p.userId === id),
                    ...old.filter((p) => p.userId !== id),
                  ])
                }
              />
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
            <div className="profile-progress">
              <div>
                <Sparkles size={18} />
                <span>Ваша анкета становится ближе к вам</span>
                <strong>
                  {Math.round(
                    ((user.profile.properties.filter((p) => p.value.trim())
                      .length +
                      (user.profile.interests.length ? 1 : 0) +
                      (user.profile.avatarUrl ? 1 : 0) +
                      ((user.profile.contextCount ?? 0) > 0 ? 1 : 0)) /
                      7) *
                      100,
                  )}
                  %
                </strong>
              </div>
              <progress
                aria-label="Заполненность профиля"
                max={7}
                value={
                  user.profile.properties.filter((p) => p.value.trim()).length +
                  (user.profile.interests.length ? 1 : 0) +
                  (user.profile.avatarUrl ? 1 : 0) +
                  ((user.profile.contextCount ?? 0) > 0 ? 1 : 0)
                }
              />
            </div>
            <PhotoUpload
              profile={user.profile}
              onSaved={(profile) =>
                setUser((old) => (old ? { ...old, profile } : old))
              }
            />
            <ContextEditor
              interests={user.profile.interests}
              onChanged={refresh}
            />
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
                action={() => navigate("discover")}
                label="К знакомствам"
              />
            ) : (
              <div className="chat-layout">
                <div className="match-list">
                  {matches.map((m) => (
                    <button
                      className={selected?.id === m.id ? "selected" : ""}
                      key={m.id}
                      onClick={() => navigate("matches", m)}
                    >
                      <Avatar profile={m.user} />
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
                        <Avatar profile={selected.user} />
                        <strong>{value(selected.user, "display_name")}</strong>
                        <small>Совпадение · {date(selected.createdAt)}</small>
                      </div>
                      <div className="messages" aria-live="polite">
                        {messages.length === 0 && (
                          <div className="chat-hint">
                            <p>
                              Первый шаг — самый интересный. Начните с общего:
                            </p>
                            <div className="icebreaker-row">
                              {conversationStarters(
                                user.profile,
                                selected.user,
                              ).map((prompt) => (
                                <button
                                  type="button"
                                  className="icebreaker"
                                  key={prompt}
                                  onClick={() => setText(prompt)}
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          </div>
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
                        navigate("matches", m);
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
          <small>Nexus · 2026</small>
        </footer>
      </main>
    </div>
  );
}
function Avatar({
  profile,
  large = false,
}: {
  profile: Profile;
  large?: boolean;
}) {
  return (
    <div className={"avatar" + (large ? " large" : "")}>
      {value(profile, "display_name").slice(0, 1) || "Я"}
      {profile.avatarUrl && (
        <img
          className="avatar-photo"
          src={profile.avatarUrl}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
function conversationStarters(me: Profile, other: Profile): string[] {
  const common = other.interests.filter((i) => me.interests.includes(i));
  const prompts: Record<string, string> = {
    Музыка: "Какую песню ты сейчас слушаешь на повторе?",
    Кофе: "Кофе с собой на прогулку или уютная кофейня?",
    Кино: "Какой фильм посоветуешь на вечер?",
    Путешествия: "Куда бы ты отправился на выходные?",
    Книги: "Какая книга тебя недавно зацепила?",
    Игры: "Во что сыграем: настолки или видеоигры?",
  };
  const specific = common.map((interest) => prompts[interest]).filter(Boolean);
  return [
    ...new Set([
      ...specific,
      "Как выглядит твой идеальный выходной?",
      "Что хорошего случилось у тебя на этой неделе?",
    ]),
  ].slice(0, 3);
}
function MatchCelebration({
  match,
  me,
  onClose,
  onOpen,
}: {
  match: Match;
  me: Profile;
  onClose: () => void;
  onOpen: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <div
      className="match-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-celebration-title"
      tabIndex={-1}
      ref={dialog}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab") {
          const buttons = Array.from(
            dialog.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
          );
          const first = buttons[0],
            last = buttons[buttons.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === dialog.current)
          ) {
            e.preventDefault();
            last?.focus();
          }
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="celebration-card">
        <div className="celebration-icon">
          <Avatar profile={me} large />
          <Heart size={32} />
          <Avatar profile={match.user} large />
        </div>
        <span className="eyebrow">ВАША ВОЛНА СОВПАЛА</span>
        <h2 id="match-celebration-title">Это взаимно!</h2>
        <p>
          Вы и {value(match.user, "display_name")} понравились друг другу. Самое
          время начать разговор.
        </p>
        <div className="celebration-actions">
          <button className="primary" onClick={onOpen}>
            <MessageCircle size={18} />
            Начать разговор
          </button>
          <button className="outline" onClick={onClose}>
            Продолжить знакомства
          </button>
        </div>
      </div>
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
    bio: "Короткая подпись (необязательно)",
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
        <Avatar profile={{ ...user.profile, properties: props }} large />
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
        Публичные темы <small>{chosen.length}/10</small>
      </h3>
      <p>
        До 10 тем, которые можно показать собеседнику. Подбор работает по вашим
        личным рассказам.
      </p>
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
      <button className="primary" disabled={busy}>
        {busy ? "Сохраняем…" : "Сохранить профиль"}
        <Check size={17} />
      </button>
    </form>
  );
}
