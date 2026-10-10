import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WaveGuide } from "./WaveGuide";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("greets through a repeatable animation without inserting text or moving the conversation", () => {
  vi.useFakeTimers();
  render(
    <WaveGuide>
      <h2>Твой рассказ</h2>
    </WaveGuide>,
  );
  const button = screen.getByRole("button", { name: "Поздороваться с Нексом" });
  fireEvent.click(button);
  expect(button.className).toContain("is-waving");
  expect(screen.queryByRole("status")).toBeNull();
  act(() => vi.advanceTimersByTime(1550));
  expect(button.className).not.toContain("is-waving");
  fireEvent.click(button);
  expect(button.className).toContain("is-waving");
  expect(screen.getByRole("heading", { name: "Твой рассказ" })).toBeTruthy();
});
