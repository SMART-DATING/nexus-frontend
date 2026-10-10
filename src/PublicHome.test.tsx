import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicHome } from "./PublicHome";
import { installDialogMock } from "./testDialog";
installDialogMock();
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("explains interests and reciprocal photos without starting signup or saving example answers", async () => {
  const auth = vi.fn();
  render(<PublicHome onAuth={auth} onPrivacy={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: "Музыка" }));
  expect(
    screen.getByRole("heading", { name: "Что у тебя сейчас на повторе?" }),
  ).toBeTruthy();
  await userEvent.click(
    screen.getByRole("button", { name: "Пример: 4 своих фото" }),
  );
  expect(screen.getByText(/В примере: 4 своих — до 4 чужих/)).toBeTruthy();
  expect(auth).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getAllByRole("button", { name: "Найти свою волну" })[0],
  );
  expect(auth).toHaveBeenCalledWith(true);
});

it("opens help only on request and jumps to the chosen example, not its section heading", async () => {
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  const privacy = vi.fn();
  render(<PublicHome onAuth={vi.fn()} onPrivacy={privacy} />);
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.click(
    screen.getByRole("link", { name: "Попробовать разговор о музыке" }),
  );
  expect(
    screen.getByRole("heading", { name: "Что у тебя сейчас на повторе?" }),
  ).toBeTruthy();
  await waitFor(() =>
    expect(scroll).toHaveBeenCalledWith(
      expect.objectContaining({ block: "center" }),
    ),
  );
  expect((scroll.mock.instances[0] as HTMLElement).id).toBe("explore-example");
  await userEvent.click(
    screen.getByRole("button", { name: "Открыть помощь Некса" }),
  );
  const help = within(
    screen.getByRole("dialog", { name: "Некс поможет разобраться" }),
  );
  await userEvent.click(
    help.getByRole("button", { name: /Как открываются фотографии/ }),
  );
  await waitFor(() =>
    expect((scroll.mock.instances.at(-1) as HTMLElement).id).toBe("photos"),
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Спросить Некса" }));
  await userEvent.click(
    screen.getByRole("button", { name: /Что увидят другие/ }),
  );
  expect(privacy).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("returns focus to the help trigger after closing and never reopens automatically", async () => {
  render(<PublicHome onAuth={vi.fn()} onPrivacy={vi.fn()} />);
  const trigger = screen.getByRole("button", { name: "Открыть помощь Некса" });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Закрыть окно" }));
  expect(document.activeElement).toBe(trigger);
  expect(screen.queryByRole("dialog")).toBeNull();
});
