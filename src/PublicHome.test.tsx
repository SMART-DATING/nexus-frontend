import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PublicHome } from "./PublicHome";
afterEach(cleanup);
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
