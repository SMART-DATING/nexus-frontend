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
  history.replaceState(null, "", "/");
});
it("demonstrates visibility without changing an account or starting signup", async () => {
  const auth = vi.fn();
  render(<PublicHome onAuth={auth} onPrivacy={vi.fn()} />);
  const toggle = screen.getByRole("switch", { name: "Показывать город" });
  expect(toggle.getAttribute("aria-checked")).toBe("true");
  await userEvent.click(toggle);
  expect(screen.getByText("Город скрыт")).toBeTruthy();
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  await userEvent.click(toggle);
  expect(screen.getByText("Москва · видно в анкете")).toBeTruthy();
  expect(auth).not.toHaveBeenCalled();
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

it("opens help only on request and keeps the destination chapter heading in view", async () => {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const privacy = vi.fn();
  render(<PublicHome onAuth={vi.fn()} onPrivacy={privacy} />);
  expect(screen.queryByRole("dialog")).toBeNull();
  const chapter = document
    .getElementById("explore")!
    .closest(".landing-screen")!;
  vi.spyOn(chapter, "getBoundingClientRect").mockReturnValue({
    top: 500,
  } as DOMRect);
  await userEvent.click(
    screen.getByRole("link", { name: "Попробовать разговор о музыке" }),
  );
  expect(
    screen.getByRole("heading", { name: "Что у тебя сейчас на повторе?" }),
  ).toBeTruthy();
  await waitFor(() =>
    expect(scroll).toHaveBeenCalledWith(
      expect.objectContaining({ top: 500, behavior: "smooth" }),
    ),
  );
  expect(location.hash).toBe("#explore");
  await userEvent.click(
    screen.getByRole("button", { name: "Открыть помощь Некса" }),
  );
  const help = within(
    screen.getByRole("dialog", { name: "Некс поможет разобраться" }),
  );
  await userEvent.click(
    help.getByRole("button", { name: /Как открываются фотографии/ }),
  );
  await waitFor(() => expect(location.hash).toBe("#photos"));
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

it("animates FAQ state while keeping closed answers out of keyboard and accessible navigation", async () => {
  render(<PublicHome onAuth={vi.fn()} onPrivacy={vi.fn()} />);
  const button = screen.getByRole("button", {
    name: "Мой личный рассказ увидят другие?",
  });
  const answer = document.getElementById(
    button.getAttribute("aria-controls")!,
  )!;
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(answer.hasAttribute("inert")).toBe(true);
  expect(
    screen.queryByRole("region", { name: "Мой личный рассказ увидят другие?" }),
  ).toBeNull();
  button.focus();
  await userEvent.keyboard("{Enter}");
  expect(
    screen.getByRole("region", { name: "Мой личный рассказ увидят другие?" }),
  ).toBe(answer);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(answer.hasAttribute("inert")).toBe(false);
  await userEvent.keyboard(" ");
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(answer.hasAttribute("inert")).toBe(true);
});
