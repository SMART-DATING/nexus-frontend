import React, { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Heart,
  MessageCircle,
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
  ArrowLeft,
  LockKeyhole,
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
import "./layout.css";
import { ProfileTabs } from "./ProfileTabs";
import { PublicHome } from "./PublicHome";
import { AppNavigation } from "./AppNavigation";
import { Dialog } from "./Dialog";
import { PrivacyNotice } from "./PrivacyNotice";
import { ProfilePreview } from "./ProfilePreview";
import { ProfileAvatar as Avatar } from "./ProfileAvatar";
import { DataControls } from "./DataControls";
import "./experience.css";
import "./viewport.css";
import "./wave.css";
import "./discovery.css";
import "./landing.css";
import "./polish.css";
import { AmbientBackdrop } from "./AmbientBackdrop";
import { useStoryReminder } from "./useStoryReminder";
import { WaveGuide } from "./WaveGuide";
type Tab = "discover" | "matches" | "profile" | "notifications";
function readRoute(): { tab: Tab; matchId: number | null } {
  const id = window.location.pathname.match(/^\/match\/(\d+)$/)?.[1];
  if (id) return { tab: "matches", matchId: Number(id) };
  const section = window.location.hash.slice(1).split("/")[0];
  return {
    tab: ["matches", "profile", "notifications"].includes(section)
      ? (section as Tab)
      : "discover",
    matchId: null,
  };
}
function readProfileSection() {
  const section = window.location.hash.split("/")[1];
  return section === "photos" ? 1 : section === "story" ? 2 : 0;
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
  const [ambientPhoto, setAmbientPhoto] = useState<string | undefined>();
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
  const [register, setRegister] = useState(
      () => window.location.hash === "#register",
    ),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [onboardingDismissed, setOnboardingDismissed] = useState<number | null>(
    () => Number(sessionStorage.getItem("nexus-onboarding-dismissed")) || null,
  );
  const [authOpen, setAuthOpen] = useState(() =>
    ["#login", "#register"].includes(window.location.hash),
  );
  const [privacyOpen, setPrivacyOpen] = useState(false),
    [previewOpen, setPreviewOpen] = useState(false);
  function openAuth(signup: boolean) {
    setRegister(signup);
    setAuthOpen(true);
    setError("");
    window.history.pushState(null, "", signup ? "/#register" : "/#login");
  }
  function closeAuth() {
    setAuthOpen(false);
    setError("");
    setPassword("");
    window.history.pushState(null, "", "/");
  }
  const storyReminder = useStoryReminder(user);
  const currentMatch = useRef<number | null>(null);
  const messagesViewport = useRef<HTMLDivElement>(null);
  const followMessages = useRef(true);
  const [profileSection, setProfileSection] = useState(readProfileSection);
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
    if (next === "profile") setProfileSection(0);
    setRouteMatchId(match?.id ?? null);
    setSelected(match);
    setText("");
    setError("");
  }
  useEffect(() => {
    const sync = () => {
      setAuthOpen(["#login", "#register"].includes(window.location.hash));
      setRegister(window.location.hash === "#register");
      const route = readRoute();
      setTab(route.tab);
      setProfileSection(readProfileSection());
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
    setAuthOpen(false);
    setPrivacyOpen(false);
    setPreviewOpen(false);
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
      setAuthOpen(true);
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
              setToast("");
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
        const m = await api<{ items: Match[] }>("/matches");
        if (alive) setMatches(m.items);
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
    followMessages.current = true;
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
        if (
          after > 0 &&
          selected!.unreadCount !== undefined &&
          document.visibilityState === "visible"
        ) {
          const count = await api<{ unreadCount: number }>(
            `/matches/${selected!.id}/read`,
            "PATCH",
            { throughId: after },
          );
          if (alive)
            setMatches((old) =>
              old.map((m) =>
                m.id === selected!.id
                  ? { ...m, unreadCount: count.unreadCount }
                  : m,
              ),
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
  useEffect(() => {
    const pane = messagesViewport.current;
    if (pane && followMessages.current) pane.scrollTop = pane.scrollHeight;
  }, [messages]);
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
    let reacted = false;
    setBusy(true);
    setError("");
    try {
      const motion = new Promise((resolve) => setTimeout(resolve, 360));
      const r = await api<{ matched: boolean; matchId?: number }>(
        `/users/${p.userId}/${like ? "like" : "skip"}`,
        "POST",
      );
      reacted = true;
      await motion;
      if (people.length > 1)
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
            : "",
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
          setToast("");
        }
      }
      return true;
    } catch (e) {
      if (reacted || (e instanceof ApiError && e.status === 409))
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
        <AmbientBackdrop />
        <LoaderCircle className="spin" /> Загружаем Nexus…
      </div>
    );
  if (!user)
    return (
      <>
        <AmbientBackdrop />
        <div
          aria-hidden={authOpen || privacyOpen ? true : undefined}
          inert={authOpen || privacyOpen}
        >
          <PublicHome
            onAuth={openAuth}
            onPrivacy={() => setPrivacyOpen(true)}
          />
        </div>
        {authOpen && (
          <Dialog
            title={register ? "Начнём знакомство" : "С возвращением"}
            onClose={closeAuth}
            className="auth-dialog"
          >
            <p className="auth-dialog-intro">
              {register
                ? "Создай аккаунт — дальше познакомимся с твоими интересами."
                : "Твоя следующая история начинается здесь."}
            </p>
            {register && (
              <WaveGuide compact>
                <p>
                  Привет! Сначала выберем твои интересы, а потом немного
                  поболтаем. Без длинной анкеты.
                </p>
              </WaveGuide>
            )}
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
              {register && (
                <p className="prototype-note">
                  Локальный прототип · только для 18+. Используй тестовые
                  данные.{" "}
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => setPrivacyOpen(true)}
                  >
                    О данных и приватности
                  </button>
                </p>
              )}
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
            <button className="text-button" onClick={() => openAuth(!register)}>
              {register
                ? "Уже есть аккаунт? Войти"
                : "Первый раз здесь? Зарегистрироваться"}
            </button>
          </Dialog>
        )}
        {privacyOpen && (
          <Dialog
            title="О данных и приватности"
            className="privacy-info-dialog"
            onClose={() => setPrivacyOpen(false)}
          >
            <PrivacyNotice />
          </Dialog>
        )}
      </>
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
  return (
    <div className={`app is-${tab} ${selected ? "has-chat" : ""}`}>
      <AmbientBackdrop photoUrl={ambientPhoto} />
      <AppNavigation
        user={user}
        tab={tab}
        unread={storyReminder.pending || notices.some((n) => !n.seen)}
        unreadMessages={matches.reduce(
          (sum, m) => sum + (m.unreadCount ?? 0),
          0,
        )}
        storyActive={tab === "profile" && profileSection === 2}
        onStory={() => {
          navigate("profile");
          setProfileSection(2);
          window.history.replaceState(null, "", "/#profile/story");
        }}
        onNavigate={navigate}
        onPreview={() => setPreviewOpen(true)}
        onPrivacy={() => setPrivacyOpen(true)}
        onLogout={() => {
          void api("/auth/logout", "POST").then(reset).catch(report);
        }}
      />
      {previewOpen && (
        <ProfilePreview
          profile={user.profile}
          onClose={() => setPreviewOpen(false)}
          onEdit={() => {
            setPreviewOpen(false);
            navigate("profile");
          }}
        />
      )}
      {privacyOpen && (
        <Dialog title="Мои данные" onClose={() => setPrivacyOpen(false)}>
          <DataControls
            user={user}
            onChanged={async () => {
              await refresh();
            }}
          />
        </Dialog>
      )}
      <main className="workspace" key={tab}>
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
            {user.discoveryHidden && (
              <div className="hidden-profile-notice">
                <LockKeyhole size={18} />
                <span>Анкета скрыта от новых людей.</span>
                <button
                  className="text-button"
                  onClick={() => setPrivacyOpen(true)}
                >
                  Изменить
                </button>
              </div>
            )}
            <div className="page-heading">
              <div>
                <span className="eyebrow">БЛИЖЕ, ЧЕМ КАЖЕТСЯ</span>
                <h1>
                  На одной волне<span className="dot">.</span>
                </h1>
                <p>Знакомься с теми, кто тебя понимает.</p>
              </div>
              <button
                className="outline preferences-button"
                title="Предпочтения"
                aria-expanded={filters}
                aria-controls="preferences-panel"
                onClick={() => setFilters(!filters)}
              >
                <SlidersHorizontal size={17} />
                Предпочтения
              </button>
            </div>
            {filters && (
              <Dialog
                title="Предпочтения"
                onClose={() => setFilters(false)}
                className="preferences-dialog"
              >
                <form
                  className="filter-panel"
                  id="preferences-panel"
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
              </Dialog>
            )}
            <div className="discover-bar">
              <span>
                <span className="live-dot" />
                {people[0]?.compatibilityScore !== undefined
                  ? `Сходство от ${people[0].similarityFloor ?? Math.min(90, Math.floor(Math.max(0, people[0].compatibilityScore) * 10) * 10)}%`
                  : "Подбор по твоей истории"}
              </span>
              <small>
                Анкет впереди: {people[0]?.remainingCount ?? people.length}
              </small>
            </div>
            {!complete ? (
              <Empty
                title="Давайте сначала познакомимся"
                text="Заполните основные данные и добавьте личный рассказ — по нему мы найдём близких по духу людей. Рассказ виден только вам."
                action={() => navigate("profile")}
                label="Заполнить профиль"
              />
            ) : loading && !people.length ? (
              <div className="boot">
                <LoaderCircle className="spin" />
                Ищем общее…
              </div>
            ) : people.length === 0 ? (
              <div className="empty discovery-empty">
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
                    К чатам <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            ) : (
              <SwipeDeck
                people={people}
                busy={busy}
                onReact={react}
                onPhotoChange={setAmbientPhoto}
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
          </>
        )}
        {tab === "profile" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">БЫТЬ СОБОЙ — ЛУЧШЕЕ НАЧАЛО</span>
                <h1>{profileSection === 2 ? "Для подбора" : "Твой профиль"}</h1>
                <p>
                  {profileSection === 2
                    ? "Добавляй то, что важно тебе. Эти рассказы видишь только ты."
                    : "Фото, пара слов и то, что важно тебе."}
                </p>
              </div>
              <button
                className="outline own-preview-button"
                onClick={() => setPreviewOpen(true)}
              >
                <Avatar profile={user.profile} />
                Посмотреть анкету
              </button>
            </div>
            <ProfileTabs
              initialTab={profileSection}
              onChange={(i) => {
                setProfileSection(i);
                window.history.replaceState(
                  null,
                  "",
                  i === 0
                    ? "/#profile"
                    : `/#profile/${i === 1 ? "photos" : "story"}`,
                );
              }}
              about={
                <ProfileEditor
                  key={user.id}
                  user={user}
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
              }
              photos={
                <PhotoUpload
                  profile={user.profile}
                  onSaved={(profile) =>
                    setUser((old) => (old ? { ...old, profile } : old))
                  }
                />
              }
              story={
                <>
                  <PublicTopicsEditor
                    user={user}
                    interests={interests}
                    onSaved={refresh}
                  />
                  <ContextEditor
                    interests={user.profile.interests}
                    onChanged={refresh}
                  />
                </>
              }
            />
            <button
              className="text-button profile-logout"
              onClick={async () => {
                try {
                  await api("/auth/logout", "POST");
                  reset();
                } catch (e) {
                  report(e);
                }
              }}
            >
              <LogOut size={17} />
              Выйти из аккаунта
            </button>
          </>
        )}
        {tab === "matches" && (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">СИМПАТИЯ ВЗАИМНА</span>
                <h1>Чаты</h1>
                <p>Здесь начинается ваш разговор.</p>
              </div>
            </div>
            {loading && !matches.length && !selected ? (
              <div className="boot">Загружаем совпадения…</div>
            ) : matches.length === 0 ? (
              <Empty
                title="Ваша история ещё впереди"
                text="Поставьте симпатию в подборке. Если она взаимна, здесь появится чат."
                action={() => navigate("discover")}
                label="К знакомствам"
              />
            ) : (
              <div
                className={`chat-layout ${selected ? "conversation-open" : ""}`}
              >
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
                        <small>Открыть чат</small>
                      </div>
                      {(m.unreadCount ?? 0) > 0 && (
                        <span
                          className="unread-badge"
                          aria-label={`Непрочитанных в этом чате: ${m.unreadCount}`}
                        >
                          {m.unreadCount! > 99 ? "99+" : m.unreadCount}
                        </span>
                      )}
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
                <section className="chat">
                  {selected ? (
                    <>
                      <div className="chat-title">
                        <button
                          className="chat-back icon-button"
                          aria-label="Все чаты"
                          onClick={() => navigate("matches")}
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <Avatar profile={selected.user} />
                        <strong>{value(selected.user, "display_name")}</strong>
                        <small>Совпадение · {date(selected.createdAt)}</small>
                      </div>
                      <div
                        className="messages"
                        ref={messagesViewport}
                        aria-live="polite"
                        onScroll={(e) => {
                          const pane = e.currentTarget;
                          followMessages.current =
                            pane.scrollHeight -
                              pane.clientHeight -
                              pane.scrollTop <
                            100;
                        }}
                      >
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
                          placeholder="Сообщение…"
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
                <h1>Уведомления</h1>
              </div>
            </div>
            {storyReminder.pending && (
              <div className="story-reminder-notice">
                <button
                  className="reminder-open"
                  onClick={() => {
                    storyReminder.dismiss();
                    navigate("profile");
                    setProfileSection(2);
                    window.history.replaceState(null, "", "/#profile/story");
                  }}
                >
                  <Sparkles size={22} />
                  <span>
                    <strong>Добавь новую сторону себя</strong>
                    <small>
                      Пара деталей поможет найти больше общего. Когда захочется.
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Убрать напоминание"
                  onClick={storyReminder.dismiss}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {notices.length === 0 && !storyReminder.pending ? (
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
  busy,
  onSave,
}: {
  user: User;
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
  );
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
        onSave({ properties: props, interests: user.profile.interests });
      }}
    >
      <div className="form-intro">
        <Avatar profile={{ ...user.profile, properties: props }} large />
        <div>
          <h2>Твоя анкета</h2>
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
                  rows={2}
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
          </div>
        ))}
      </div>
      <details className="privacy-settings">
        <summary>
          <LockKeyhole size={17} />
          Что видно другим
        </summary>
        <p>
          Имя видно всегда. Остальные поля можно скрыть. Личный рассказ из
          раздела «Для подбора» не виден никому.
        </p>
        {props
          .filter((p) => p.name !== "display_name")
          .map((p) => (
            <label className="checkbox" key={p.name}>
              <input
                type="checkbox"
                checked={p.visible}
                onChange={(e) => update(p.name, { visible: e.target.checked })}
              />
              Показывать: {labels[p.name].toLowerCase()}
            </label>
          ))}
      </details>
      <button className="primary" disabled={busy}>
        {busy ? "Сохраняем…" : "Сохранить профиль"}
        <Check size={17} />
      </button>
    </form>
  );
}

function PublicTopicsEditor({
  user,
  interests,
  onSaved,
}: {
  user: User;
  interests: string[];
  onSaved: () => Promise<unknown>;
}) {
  const [chosen, setChosen] = useState(user.profile.interests);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="public-topics-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setSaved(false);
        try {
          await api("/profiles/me", "PUT", {
            properties: user.profile.properties,
            interests: chosen,
          });
          await onSaved();
          setSaved(true);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Не удалось сохранить темы",
          );
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2>
        Публичные темы <small>{chosen.length}/10</small>
      </h2>
      <p>
        Видны в анкете и помогают начать разговор. Личные рассказы ниже остаются
        скрытыми.
      </p>
      <div className="interest-picker">
        {interests.map((i) => (
          <button
            type="button"
            key={i}
            className={chosen.includes(i) ? "chosen" : ""}
            aria-pressed={chosen.includes(i)}
            disabled={saving || (!chosen.includes(i) && chosen.length >= 10)}
            onClick={() => {
              setSaved(false);
              setChosen((old) =>
                old.includes(i) ? old.filter((x) => x !== i) : [...old, i],
              );
            }}
          >
            {chosen.includes(i) && <Check size={14} />} {i}
          </button>
        ))}
      </div>
      <button className="outline" disabled={saving}>
        {saving ? "Сохраняем…" : "Сохранить темы"}
      </button>
      {saved && <small role="status">Темы сохранены</small>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
