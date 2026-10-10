import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MatchingSetup } from "./MatchingSetup";
import { api, type User } from "./api";
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  api: vi.fn(),
}));
const user: User = {
  id: 1,
  email: "own@test.local",
  profile: {
    userId: 1,
    gender: "male",
    interests: ["Книги"],
    properties: [{ name: "display_name", value: "Имя", visible: true }],
  },
  preferences: { minAge: 18, maxAge: 60, interestedIn: "female" },
};
afterEach(() => {
  cleanup();
  vi.mocked(api).mockReset();
});
it("saves interests first, asks related questions, preserves answers while changing topics", async () => {
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/contexts/me" ? { items: [], modelAvailable: true } : {},
  );
  render(
    <MatchingSetup
      user={user}
      interests={["Книги", "Музыка"]}
      onSaved={vi.fn()}
    />,
  );
  expect(screen.queryByLabelText("Твой ответ")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Книги" }));
  await userEvent.click(screen.getByRole("button", { name: "Музыка" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Дальше — три вопроса" }),
  );
  await screen.findByRole("heading", { name: "Что у тебя сейчас на повторе?" });
  expect(api).toHaveBeenCalledWith("/profiles/me", "PUT", {
    properties: user.profile.properties,
    interests: ["Музыка"],
  });
  fireEvent.change(screen.getByLabelText("Твой ответ"), {
    target: { value: "Хожу на концерты и слушаю музыку вечером." },
  });
  await userEvent.click(screen.getByRole("button", { name: "Изменить" }));
  await userEvent.click(screen.getByRole("button", { name: "Книги" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить интересы" }),
  );
  expect(screen.getByLabelText("Твой ответ")).toHaveProperty(
    "value",
    "Хожу на концерты и слушаю музыку вечером.",
  );
  await userEvent.click(screen.getByRole("button", { name: "Дальше" }));
  await screen.findByRole("heading", {
    name: "Какая книга осталась с тобой надолго?",
  });
});
it("keeps the chosen interests and does not start questions after a failed save", async () => {
  vi.mocked(api).mockRejectedValue(new Error("Не удалось сохранить"));
  render(<MatchingSetup user={user} interests={["Книги"]} onSaved={vi.fn()} />);
  await userEvent.click(
    screen.getByRole("button", { name: "Дальше — три вопроса" }),
  );
  await screen.findByRole("alert");
  expect(screen.queryByLabelText("Твой ответ")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Книги" }).getAttribute("aria-pressed"),
  ).toBe("true");
});
