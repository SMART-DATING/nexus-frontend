import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicHome } from "./PublicHome";
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

it("makes hero interest cards actionable and lets Nex guide and collapse", async () => {
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  render(<PublicHome onAuth={vi.fn()} onPrivacy={vi.fn()} />);
  await userEvent.click(
    screen.getByRole("link", { name: "Попробовать разговор о музыке" }),
  );
  expect(
    screen.getByRole("heading", { name: "Что у тебя сейчас на повторе?" }),
  ).toBeTruthy();
  const guide = within(
    screen.getByRole("complementary", { name: "Некс — проводник по странице" }),
  );
  await userEvent.click(
    guide.getByRole("button", { name: "Открыть подсказку Некса" }),
  );
  await userEvent.click(
    guide.getByRole("button", { name: "Как всё устроено" }),
  );
  expect(scroll).toHaveBeenCalled();
  expect(
    guide.getByRole("button", { name: "Попробовать разговор" }),
  ).toBeTruthy();
  await userEvent.click(
    guide.getByRole("button", { name: "Свернуть подсказку Некса" }),
  );
  expect(
    guide.getByRole("button", { name: "Открыть подсказку Некса" }),
  ).toBeTruthy();
});
