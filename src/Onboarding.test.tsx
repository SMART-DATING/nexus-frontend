import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Onboarding } from "./Onboarding";
import { api, type User } from "./api";
vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  api: vi.fn(),
}));
const user: User = {
  id: 10,
  email: "new@example.com",
  profile: { userId: 10, properties: [], interests: [], contextCount: 0 },
  preferences: { minAge: 18, maxAge: 60 },
};
afterEach(() => {
  cleanup();
  vi.mocked(api).mockReset();
});
it("persists basic data before asking tailored questions and does not duplicate a story after a refresh failure", async () => {
  vi.mocked(api).mockResolvedValue({ id: 17 });
  const done = vi
    .fn()
    .mockRejectedValueOnce(new Error("Обнови страницу"))
    .mockResolvedValue(undefined);
  render(
    <Onboarding
      user={user}
      interests={["Книги", "Психология"]}
      onDone={done}
      onLater={vi.fn()}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Книги" }));
  await userEvent.click(screen.getByRole("button", { name: "Это моя волна" }));
  fireEvent.change(screen.getByLabelText("Твоё имя"), {
    target: { value: "Лера" },
  });
  fireEvent.change(screen.getByLabelText("Дата рождения"), {
    target: { value: "2002-03-12" },
  });
  fireEvent.change(screen.getByLabelText("Город"), {
    target: { value: "Москва" },
  });
  await userEvent.click(
    screen.getByRole("button", { name: "Давай познакомимся" }),
  );
  await screen.findByLabelText("Твой ответ");
  expect(api).toHaveBeenCalledWith(
    "/profiles/me",
    "PUT",
    expect.objectContaining({
      interests: ["Книги"],
      properties: expect.arrayContaining([
        { name: "birth_date", value: "2002-03-12", visible: false },
      ]),
    }),
  );
  fireEvent.change(screen.getByLabelText("Твой ответ"), {
    target: { value: "Люблю фантастику, добрых героев и открытый финал." },
  });
  await userEvent.click(screen.getByRole("button", { name: "Дальше" }));
  for (let i = 0; i < 2; i++)
    await userEvent.click(
      screen.getByRole("button", { name: "Пропустить вопрос" }),
    );
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить и знакомиться" }),
  );
  await screen.findByRole("alert");
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить и знакомиться" }),
  );
  expect(
    vi
      .mocked(api)
      .mock.calls.filter((c) => c[0] === "/contexts/me" && c[1] === "POST"),
  ).toHaveLength(1);
  expect(api).toHaveBeenCalledWith(
    "/contexts/me/17",
    "PUT",
    expect.objectContaining({ title: "Моя волна" }),
  );
  expect(done).toHaveBeenCalledTimes(2);
});
it("does not force interest selection", async () => {
  render(
    <Onboarding
      user={user}
      interests={["Книги"]}
      onDone={vi.fn()}
      onLater={vi.fn()}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Пока без списка" }),
  );
  expect(screen.getByLabelText("Твоё имя")).toBeTruthy();
  expect(api).not.toHaveBeenCalled();
});
