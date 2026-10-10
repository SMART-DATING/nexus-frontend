import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ChatPartner, BlockedUsers } from "./ChatControls";
import { installDialogMock } from "./testDialog";
installDialogMock();
const partner = {
  userId: 2,
  properties: [{ name: "display_name", value: "Саша", visible: true }],
  interests: [],
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("opens a fresh public profile and blocks only after a deliberate choice", async () => {
  const requests: { path: string; method: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string, init: RequestInit) => {
      requests.push({ path, method: init.method || "GET" });
      return new Response(
        JSON.stringify({
          ...partner,
          properties: [
            ...partner.properties,
            { name: "bio", value: "Свежая публичная подпись", visible: true },
          ],
        }),
      );
    }),
  );
  const blocked = vi.fn();
  const ui = userEvent.setup();
  render(
    <ChatPartner profile={partner} onBlocked={blocked} onError={vi.fn()} />,
  );
  await ui.click(
    screen.getByRole("button", { name: "Посмотреть анкету Саша" }),
  );
  await screen.findByText("Свежая публичная подпись");
  expect(requests[0].path).toBe("/api/v1/profiles/2");
  await ui.click(screen.getByRole("button", { name: "Закрыть окно" }));
  await ui.click(screen.getByRole("button", { name: "Заблокировать Саша" }));
  await ui.click(screen.getByRole("button", { name: "Отмена" }));
  expect(requests.some((r) => r.method === "POST")).toBe(false);
  await ui.click(screen.getByRole("button", { name: "Заблокировать Саша" }));
  await ui.click(screen.getByRole("button", { name: "Заблокировать" }));
  await waitFor(() => expect(blocked).toHaveBeenCalledOnce());
  expect(requests.at(-1)).toEqual({
    path: "/api/v1/users/2/block",
    method: "POST",
  });
});
it("keeps the chat on a failed block and allows retry", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "Нет связи" }), { status: 503 }),
    ),
  );
  const blocked = vi.fn(),
    error = vi.fn(),
    ui = userEvent.setup();
  render(<ChatPartner profile={partner} onBlocked={blocked} onError={error} />);
  await ui.click(screen.getByRole("button", { name: "Заблокировать Саша" }));
  await ui.click(screen.getByRole("button", { name: "Заблокировать" }));
  await waitFor(() => expect(error).toHaveBeenCalledOnce());
  expect(blocked).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeTruthy();
});
it("loads only own blocks and removes a block without discarding chat history", async () => {
  const requests: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string, init: RequestInit) => {
      requests.push(`${init.method || "GET"} ${path}`);
      return new Response(
        JSON.stringify({
          items: [
            {
              userId: 2,
              displayName: "Саша",
              createdAt: "2026-10-10T10:00:00Z",
            },
          ],
        }),
      );
    }),
  );
  const unblocked = vi.fn(),
    ui = userEvent.setup();
  render(<BlockedUsers onUnblocked={unblocked} onError={vi.fn()} />);
  await ui.click(screen.getByRole("button", { name: "Заблокированные" }));
  await ui.click(await screen.findByRole("button", { name: "Разблокировать" }));
  await screen.findByText("Ты пока никого не заблокировал.");
  expect(requests).toEqual([
    "GET /api/v1/users/me/blocks",
    "DELETE /api/v1/users/2/block",
  ]);
  expect(unblocked).toHaveBeenCalledOnce();
});
