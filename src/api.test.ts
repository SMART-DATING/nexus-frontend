import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";
beforeEach(() => sessionStorage.clear());
it("uploads FormData with authentication and lets the browser set its boundary", async () => {
  sessionStorage.setItem("nexus-token", "token");
  const mock = vi.fn(async () => new Response("{}"));
  vi.stubGlobal("fetch", mock);
  const body = new FormData();
  body.append("file", new File(["photo"], "photo.png", { type: "image/png" }));
  await api("/profiles/me/avatar", "POST", body);
  const init = (mock.mock.calls as unknown as [string, RequestInit][])[0][1];
  expect(init.body).toBe(body);
  expect(init.headers).toEqual({ Authorization: "Bearer token" });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("sends POST, PUT and PATCH with JSON and Bearer headers", async () => {
  sessionStorage.setItem("nexus-token", "token");
  const mock = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
  vi.stubGlobal("fetch", mock);
  for (const method of ["POST", "PUT", "PATCH"])
    await api("/profiles/me", method, { value: "текст" });
  expect(mock).toHaveBeenCalledTimes(3);
  for (const call of mock.mock.calls as unknown as [string, RequestInit][]) {
    expect(call[0]).toBe("/api/v1/profiles/me");
    expect(call[1].headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
    expect(call[1].body).toBe('{"value":"текст"}');
  }
});
it("accepts empty 204 responses", async () => {
  vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));
  expect(await api("/auth/logout", "POST")).toBeUndefined();
});
it("explains proxy errors that return HTML instead of JSON", async () => {
  vi.stubGlobal(
    "fetch",
    async () => new Response("<html>Bad Gateway</html>", { status: 502 }),
  );
  await expect(api("/users/me")).rejects.toMatchObject({
    message: "Сервер недоступен",
    status: 502,
  });
});
it("explains an unavailable backend", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await expect(api("/users/me")).rejects.toBeInstanceOf(ApiError);
});
it("does not clear a newer login when an older request returns 401", async () => {
  sessionStorage.setItem("nexus-token", "old");
  vi.stubGlobal("fetch", async () => {
    sessionStorage.setItem("nexus-token", "new");
    return new Response('{"message":"expired"}', { status: 401 });
  });
  await expect(api("/users/me")).rejects.toMatchObject({ status: 401 });
  expect(sessionStorage.getItem("nexus-token")).toBe("new");
});
