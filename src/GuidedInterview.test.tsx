import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuidedInterview, interviewPrompts } from "./GuidedInterview";
afterEach(cleanup);
it("asks about selected interests and falls back to three general questions", () => {
  expect(interviewPrompts(["Книги", "Музыка"]).map((p) => p.topic)).toEqual([
    "Книги",
    "Музыка",
    "Твой ритм",
  ]);
  expect(interviewPrompts([])).toHaveLength(3);
  expect(interviewPrompts(["Кофе"])).toEqual(interviewPrompts([]));
  expect(interviewPrompts(["Психология"])[0].topic).toBe("Психология");
});
it("keeps answers local, preserves them on Back and saves only reviewed text", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(<GuidedInterview interests={["Книги", "Музыка"]} onSave={save} />);
  fireEvent.change(screen.getByLabelText("Твой ответ"), {
    target: { value: "Люблю читать фантастику и обсуждать героев." },
  });
  await userEvent.click(screen.getByRole("button", { name: "Дальше" }));
  await userEvent.click(screen.getByRole("button", { name: "Назад" }));
  expect(
    (screen.getByLabelText("Твой ответ") as HTMLTextAreaElement).value,
  ).toContain("фантастику");
  await userEvent.click(screen.getByRole("button", { name: "Дальше" }));
  await userEvent.click(
    screen.getByRole("button", { name: "Пропустить вопрос" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Пропустить вопрос" }),
  );
  expect(save).not.toHaveBeenCalled();
  expect(
    (screen.getByLabelText("Твой личный рассказ") as HTMLTextAreaElement).value,
  ).toBe("Книги: Люблю читать фантастику и обсуждать героев.");
  fireEvent.change(screen.getByLabelText("Твой личный рассказ"), {
    target: { value: "Мой отредактированный личный рассказ о книгах." },
  });
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить и знакомиться" }),
  );
  expect(save).toHaveBeenCalledWith(
    "Мой отредактированный личный рассказ о книгах.",
  );
});
it("allows skipping everything without creating an empty story", async () => {
  const save = vi.fn(),
    later = vi.fn();
  render(<GuidedInterview interests={[]} onSave={save} onLater={later} />);
  for (let i = 0; i < 3; i++)
    await userEvent.click(
      screen.getByRole("button", { name: "Пропустить вопрос" }),
    );
  expect(
    (
      screen.getByRole("button", {
        name: "Сохранить и знакомиться",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Расскажу позже" }));
  expect(later).toHaveBeenCalledOnce();
  expect(save).not.toHaveBeenCalled();
});
it("keeps the reviewed draft after a failed save and permits retry", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error("Сервер недоступен"))
    .mockResolvedValueOnce(undefined);
  render(<GuidedInterview interests={[]} onSave={save} />);
  fireEvent.change(screen.getByLabelText("Твой ответ"), {
    target: { value: "Прогулки по городу, книги и добрые разговоры." },
  });
  await userEvent.click(screen.getByRole("button", { name: "Дальше" }));
  for (let i = 0; i < 2; i++)
    await userEvent.click(
      screen.getByRole("button", { name: "Пропустить вопрос" }),
    );
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить и знакомиться" }),
  );
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(
    (screen.getByLabelText("Твой личный рассказ") as HTMLTextAreaElement).value,
  ).toContain("Прогулки");
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить и знакомиться" }),
  );
  expect(save).toHaveBeenCalledTimes(2);
});
