import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileTabs } from "./ProfileTabs";
afterEach(cleanup);
it("shows one profile section and preserves an unsaved draft across switches", async () => {
  const user = userEvent.setup();
  render(
    <ProfileTabs
      about={<input aria-label="Черновик имени" defaultValue="" />}
      photos={<h2>Мои фото</h2>}
    />,
  );
  await user.type(screen.getByLabelText("Черновик имени"), "Лера");
  await user.click(screen.getByRole("tab", { name: "Фото" }));
  expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Мои фото" })).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Анкета" }));
  expect(
    (screen.getByLabelText("Черновик имени") as HTMLInputElement).value,
  ).toBe("Лера");
});
it("supports arrow navigation, Home and End and identifies the active panel", async () => {
  const user = userEvent.setup();
  render(<ProfileTabs about={<p>Анкета</p>} photos={<p>Фото</p>} />);
  await user.click(screen.getByRole("tab", { name: "Анкета" }));
  await user.keyboard("{ArrowRight}");
  expect(
    screen.getByRole("tab", { name: "Фото" }).getAttribute("aria-selected"),
  ).toBe("true");
  expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
    document.activeElement?.id,
  );
  await user.keyboard("{End}");
  expect(
    screen.getByRole("tab", { name: "Фото" }).getAttribute("aria-selected"),
  ).toBe("true");
  await user.keyboard("{Home}");
  expect(
    screen.getByRole("tab", { name: "Анкета" }).getAttribute("aria-selected"),
  ).toBe("true");
});
