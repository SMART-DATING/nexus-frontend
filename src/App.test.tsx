import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
import { installDialogMock } from "./testDialog";
installDialogMock();
const profile = {
  userId: 1,
  contextCount: 1,
  properties: [
    { name: "display_name", value: "Алекс", visible: true },
    { name: "bio", value: "Музыка и кофе", visible: true },
    { name: "birth_date", value: "2001-04-12", visible: false },
    { name: "city", value: "Москва", visible: true },
  ],
  interests: ["Музыка", "Кофе"],
};
const user = {
  id: 1,
  email: "demo@nexus.local",
  profile,
  preferences: { minAge: 18, maxAge: 60 },
};
const match = {
  id: 7,
  user: {
    ...profile,
    userId: 2,
    properties: [{ name: "display_name", value: "Саша", visible: true }],
  },
  createdAt: "2026-10-07T10:00:00Z",
};
let requests: { path: string; method: string; body: unknown }[] = [];
let feedCalls = 0;
let liked = false;
let unreadCount: number | undefined;
beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  requests = [];
  feedCalls = 0;
  liked = false;
  unreadCount = undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init: RequestInit = {}) => {
      const path = input.replace("/api/v1", ""),
        method = init.method || "GET",
        body = init.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ path, method, body });
      let data: unknown = { items: [] };
      if (path === "/auth/login" || path === "/auth/register")
        data = { accessToken: "test-token", user };
      if (path === "/users/me") data = user;
      if (path === "/interests") data = { items: ["Музыка", "Кофе", "Кино"] };
      if (path === "/profiles/me") data = profile;
      if (path === "/contexts/me") data = { items: [], modelAvailable: true };
      if (path === "/users/2/like") liked = true;
      if (path === "/recommendations/next")
        data = {
          items: liked ? [] : [match.user],
          skippedCount: 0,
          cycleRestarted: ++feedCalls > 1 && !liked,
        };
      if (path === "/matches") data = { items: [{ ...match, unreadCount }] };
      if (path === "/matches/7") data = { ...match, unreadCount };
      if (
        path.startsWith("/matches/7/messages?after=") &&
        unreadCount !== undefined
      )
        data = {
          items: [
            {
              id: 20,
              senderId: 2,
              text: "Новое входящее",
              createdAt: "2026-10-09T10:00:00Z",
            },
          ],
        };
      if (path === "/matches/7/read") {
        unreadCount = 0;
        data = { unreadCount };
      }
      if (path === "/matches/7/messages" && method === "POST")
        data = {
          id: 1,
          senderId: 1,
          text: body.text,
          createdAt: "2026-10-07T10:00:00Z",
        };
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("Nexus user flows", () => {
  it("opens private stories from the main navigation and keeps the route after reload", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    const first = render(<App />);
    await ui.click(await screen.findByRole("button", { name: "Для подбора" }));
    await screen.findByRole("heading", { name: "Для подбора" });
    expect(window.location.hash).toBe("#profile/story");
    first.unmount();
    render(<App />);
    await screen.findByRole("heading", { name: "Для подбора" });
    expect(
      screen
        .getByRole("button", { name: "Для подбора" })
        .getAttribute("aria-current"),
    ).toBe("page");
  });
  it("shows incoming counts and acknowledges only the delivered message id", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    unreadCount = 1;
    const ui = userEvent.setup();
    render(<App />);
    await screen.findByLabelText("Непрочитанных сообщений: 1");
    await ui.click(screen.getByRole("button", { name: /Чаты/ }));
    await screen.findByLabelText("Непрочитанных в этом чате: 1");
    await ui.click(screen.getByRole("button", { name: /Саша/ }));
    await screen.findByText("Новое входящее");
    await waitFor(() =>
      expect(requests.find((r) => r.path === "/matches/7/read")?.body).toEqual({
        throughId: 20,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Непрочитанных сообщений: 1")).toBeNull(),
    );
  });
  it("starts with the product story, opens signup deliberately, and restores the home page", async () => {
    const ui = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: /Встреть того/ });
    expect(screen.queryByLabelText("Email")).toBeNull();
    await ui.click(screen.getByRole("button", { name: "Зарегистрироваться" }));
    expect(window.location.hash).toBe("#register");
    expect(
      screen.getByRole("dialog", { name: "Начнём знакомство" }),
    ).toBeTruthy();
    await ui.click(screen.getByRole("button", { name: "Закрыть окно" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(window.location.hash).toBe("");
    expect(requests.some((r) => r.path === "/auth/register")).toBe(false);
  });
  it("opens own profile preview from the avatar without exposing private fields", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(
      await screen.findByRole("button", { name: "Профиль и настройки: Алекс" }),
    );
    await ui.click(screen.getByRole("button", { name: "Посмотреть анкету" }));
    const dialog = screen.getByRole("dialog", { name: "Твоя анкета" });
    expect(dialog.textContent).toContain("Музыка и кофе");
    expect(dialog.textContent).not.toContain("2001-04-12");
    await ui.click(
      screen.getByRole("button", { name: "Редактировать профиль" }),
    );
    await screen.findByLabelText("Как вас зовут");
    expect(window.location.hash).toBe("#profile");
  });
  it("opens photo management directly and retains the profile section after reload", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    window.history.replaceState(null, "", "/#profile/photos");
    const ui = userEvent.setup();
    const first = render(<App />);
    await screen.findByRole("region", { name: "Фото профиля" });
    expect(
      screen.getByRole("tab", { name: "Фото" }).getAttribute("aria-selected"),
    ).toBe("true");
    await ui.click(screen.getByRole("tab", { name: "Для подбора" }));
    expect(window.location.hash).toBe("#profile/story");
    first.unmount();
    render(<App />);
    await screen.findByRole("region", { name: "Личные рассказы для подбора" });
    expect(
      screen
        .getByRole("tab", { name: "Для подбора" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("logs in using the API and opens recommendations", async () => {
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(await screen.findByRole("button", { name: "Войти" }));
    await ui.type(await screen.findByLabelText("Email"), "demo@nexus.local");
    await ui.type(screen.getByLabelText("Пароль"), "NexusDemo2026!");
    await ui.click(screen.getByRole("button", { name: "Войти" }));
    await screen.findByRole("heading", { name: /На одной волне/ });
    expect(sessionStorage.getItem("nexus-token")).toBe("test-token");
    expect(requests.find((r) => r.path === "/auth/login")?.body).toEqual({
      email: "demo@nexus.local",
      password: "NexusDemo2026!",
    });
  });
  it("saves edited profile properties and interests together", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(await screen.findByRole("button", { name: "Профиль" }));
    const name = await screen.findByLabelText("Как вас зовут");
    await ui.clear(name);
    await ui.type(name, "Новое имя");
    await ui.click(await screen.findByRole("button", { name: "Кино" }));
    await ui.click(screen.getByRole("button", { name: "Сохранить профиль" }));
    await screen.findByText("Профиль сохранён");
    const saved = requests.find(
      (r) => r.path === "/profiles/me" && r.method === "PUT",
    )!.body as typeof profile;
    expect(saved.properties.find((p) => p.name === "display_name")?.value).toBe(
      "Новое имя",
    );
    expect(saved.properties.find((p) => p.name === "birth_date")?.visible).toBe(
      false,
    );
    expect(saved.interests).toContain("Кино");
  });
  it("opens a match and sends plain text to its API", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(await screen.findByRole("button", { name: "Чаты" }));
    await ui.click(await screen.findByRole("button", { name: /Саша/ }));
    await ui.type(screen.getByLabelText("Сообщение"), "Привет, Саша!");
    await ui.click(screen.getByRole("button", { name: "Отправить сообщение" }));
    await screen.findByText("Привет, Саша!");
    expect(window.location.pathname).toBe("/match/7");
    expect(
      requests.find(
        (r) => r.path === "/matches/7/messages" && r.method === "POST",
      )?.body,
    ).toEqual({ text: "Привет, Саша!" });
  });
  it("returns to login when a session expires", async () => {
    sessionStorage.setItem("nexus-token", "expired");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ message: "Войдите в аккаунт" }), {
            status: 401,
          }),
      ),
    );
    render(<App />);
    await screen.findByRole("button", { name: "Войти" });
    await waitFor(() =>
      expect(sessionStorage.getItem("nexus-token")).toBeNull(),
    );
  });
  it("keeps the selected section after leaving a chat and reloading", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    window.history.replaceState(null, "", "/match/7");
    const ui = userEvent.setup();
    const first = render(<App />);
    await screen.findByLabelText("Сообщение");
    await ui.click(screen.getByRole("button", { name: "Профиль" }));
    await screen.findByLabelText("Как вас зовут");
    expect(window.location.pathname).toBe("/");
    expect(window.location.hash).toBe("#profile");
    first.unmount();
    requests = [];
    render(<App />);
    await screen.findByLabelText("Как вас зовут");
    expect(screen.queryByLabelText("Сообщение")).toBeNull();
    expect(requests.some((r) => r.path === "/matches/7")).toBe(false);
  });
  it("restores the chat for browser Back and clears it on Forward", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(await screen.findByRole("button", { name: "Чаты" }));
    await ui.click(await screen.findByRole("button", { name: /Саша/ }));
    await screen.findByLabelText("Сообщение");
    await ui.click(screen.getByRole("button", { name: "Открыть уведомления" }));
    expect(window.location.hash).toBe("#notifications");
    window.history.back();
    await screen.findByLabelText("Сообщение");
    window.history.forward();
    await screen.findByRole("heading", { name: "Уведомления" });
    expect(screen.queryByLabelText("Сообщение")).toBeNull();
  });
  it("automatically repeats skips but removes a liked final candidate", async () => {
    sessionStorage.setItem("nexus-token", "test-token");
    const ui = userEvent.setup();
    render(<App />);
    await ui.click(
      await screen.findByRole("button", { name: "Пропустить Саша" }),
    );
    await screen.findByText("Новый круг · 2");
    await ui.click(screen.getByRole("button", { name: "Нравится Саша" }));
    await waitFor(() => expect(screen.queryByRole("article")).toBeNull());
    expect(
      requests.filter((r) => r.path === "/recommendations/next"),
    ).toHaveLength(3);
    expect(requests.filter((r) => r.path === "/users/2/skip")).toHaveLength(1);
    expect(requests.filter((r) => r.path === "/users/2/like")).toHaveLength(1);
  });
});
