import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContextEditor } from "./ContextEditor";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.mocked(api).mockReset();
});
it("keeps drafts local until explicit save and refreshes the semantic profile", async () => {
  const changed = vi.fn();
  vi.mocked(api).mockResolvedValue({ items: [], modelAvailable: true });
  render(<ContextEditor onChanged={changed} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Написать о себе" }),
  );
  fireEvent.change(screen.getByLabelText("Личный рассказ"), {
    target: { value: "Люблю горы, палатки и долгие прогулки по лесу." },
  });
  expect(vi.mocked(api).mock.calls.every((c) => c.length === 1)).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "Сохранить личный рассказ" }),
  );
  await vi.waitFor(() => expect(changed).toHaveBeenCalledOnce());
  expect(api).toHaveBeenCalledWith("/contexts/me", "POST", {
    title: "Что для меня важно",
    content: "Люблю горы, палатки и долгие прогулки по лесу.",
  });
});
it("requires confirmation before deleting an existing personal story", async () => {
  vi.mocked(api).mockResolvedValue({
    items: [
      {
        id: 7,
        title: "Мои ценности",
        content: "Доверие, честность и открытые разговоры.",
        updatedAt: "2026-10-08T00:00:00Z",
      },
    ],
    modelAvailable: true,
  });
  render(<ContextEditor onChanged={vi.fn()} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Удалить рассказ Мои ценности" }),
  );
  expect(vi.mocked(api).mock.calls.some((c) => c[1] === "DELETE")).toBe(false);
  await userEvent.click(screen.getByRole("button", { name: "Да, удалить" }));
  await vi.waitFor(() =>
    expect(api).toHaveBeenCalledWith("/contexts/me/7", "DELETE"),
  );
});
