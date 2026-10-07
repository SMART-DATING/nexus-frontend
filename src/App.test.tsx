import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";
const profile = {
  userId: 1,
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
beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  requests = [];
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
      if (path === "/matches") data = { items: [match] };
      if (path === "/matches/7") data = match;
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
  it("logs in using the API and opens recommendations", async () => {
    const ui = userEvent.setup();
    render(<App />);
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
    await ui.click(await screen.findByRole("button", { name: "Мой профиль" }));
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
    await ui.click(await screen.findByRole("button", { name: "Совпадения" }));
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
});
