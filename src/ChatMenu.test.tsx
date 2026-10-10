import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatMenu, activityLabel } from "./ChatMenu";
import { installDialogMock } from "./testDialog";
installDialogMock();
const match = {
  id: 4,
  user: { userId: 2, properties: [], interests: [] },
  createdAt: "2026-10-10T10:00:00Z",
};
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("opens with right click and keyboard navigation and changes only the chosen chat", async () => {
  const action = vi.fn().mockResolvedValue(undefined),
    ui = userEvent.setup();
  render(
    <ChatMenu match={match} onAction={action}>
      <button>Саша</button>
    </ChatMenu>,
  );
  fireEvent.contextMenu(screen.getByText("Саша"), {
    clientX: 900,
    clientY: 700,
  });
  expect(document.activeElement).toBe(
    screen.getByRole("menuitem", { name: "Закрепить" }),
  );
  await ui.keyboard("{ArrowDown}{Enter}");
  await waitFor(() => expect(action).toHaveBeenCalledWith("unread"));
  expect(screen.queryByRole("menu")).toBeNull();
});
it("confirms destructive actions and retains the dialog when saving fails", async () => {
  const action = vi.fn().mockRejectedValue(new Error("Нет связи")),
    ui = userEvent.setup();
  render(<ChatMenu match={match} onAction={action} />);
  await ui.click(screen.getByRole("button", { name: "Действия с чатом" }));
  await ui.click(screen.getByRole("menuitem", { name: "Очистить переписку" }));
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog").textContent).toContain("только у тебя");
  await ui.click(screen.getByRole("button", { name: "Очистить" }));
  await screen.findByRole("alert");
  expect(screen.getByRole("alert").textContent).toBe("Нет связи");
  expect(screen.getByRole("dialog")).toBeTruthy();
});
it("uses recorded activity and never invents an online status", () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-10T13:00:00Z"));
  expect(activityLabel(null)).toBe("Нет данных об активности");
  expect(activityLabel("2026-10-10T12:59:40Z")).toBe("В сети");
  expect(activityLabel("2026-10-10T12:55:00Z")).toBe("Заходил(а) недавно");
  expect(activityLabel("2026-10-09T12:00:00Z")).toContain("Последний заход:");
});
