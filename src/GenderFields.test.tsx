import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GenderField, InterestedInField } from "./GenderFields";
afterEach(cleanup);
it("opens with the current choice, supports arrow keys and closes on Escape", async () => {
  const change = vi.fn();
  render(<GenderField value="female" onChange={change} />);
  const trigger = screen.getByRole("combobox", { name: "Твой пол" });
  await userEvent.click(trigger);
  expect(document.activeElement).toBe(
    screen.getByRole("option", { name: "Женщина" }),
  );
  await userEvent.keyboard("{ArrowUp}{Enter}");
  expect(change).toHaveBeenCalledWith("male");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
  await userEvent.keyboard("{ArrowDown}{Escape}");
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
it("keeps the preference in FormData and closes when clicking outside", async () => {
  const { container } = render(
    <form>
      <InterestedInField value="all" />
      <button type="button">Снаружи</button>
    </form>,
  );
  const trigger = screen.getByRole("combobox", {
    name: "Кого хочешь встретить",
  });
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("option", { name: "Женщин" }));
  expect(
    new FormData(container.querySelector("form")!).get("interestedIn"),
  ).toBe("female");
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Снаружи" }));
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});
