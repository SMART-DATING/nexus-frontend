import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceInput, type Recognition } from "./VoiceInput";
let instance: Recognition;
class SpeechMock implements Recognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: Recognition["onresult"] = null;
  onerror: Recognition["onerror"] = null;
  onend: Recognition["onend"] = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    instance = this;
  }
}
function Harness() {
  const [value, setValue] = useState("Люблю");
  return <VoiceInput value={value} onChange={setValue} />;
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("requires an explicit choice before starting the microphone", async () => {
  vi.stubGlobal("SpeechRecognition", SpeechMock);
  instance = undefined as unknown as Recognition;
  render(<Harness />);
  await userEvent.click(
    screen.getByRole("button", { name: "Ответить голосом" }),
  );
  expect(instance).toBeUndefined();
  expect(
    screen.getByRole("group", { name: "Перед включением микрофона" }),
  ).toBeTruthy();
  await userEvent.click(
    screen.getByRole("button", { name: "Останусь с текстом" }),
  );
  expect(instance).toBeUndefined();
  await userEvent.click(
    screen.getByRole("button", { name: "Ответить голосом" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Включить голосовой ввод" }),
  );
  expect(instance.start).toHaveBeenCalledOnce();
  expect(instance.lang).toBe("ru-RU");
});
it("replaces interim results without duplicating speech and keeps the final result after stop", async () => {
  vi.stubGlobal("SpeechRecognition", SpeechMock);
  render(<Harness />);
  await userEvent.click(
    screen.getByRole("button", { name: "Ответить голосом" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Включить голосовой ввод" }),
  );
  act(() =>
    instance.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: false, 0: { transcript: "читать" } }],
    }),
  );
  act(() =>
    instance.onresult?.({
      resultIndex: 0,
      results: [{ isFinal: true, 0: { transcript: "читать книги" } }],
    }),
  );
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
    "Люблю читать книги",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Остановить голосовой ввод" }),
  );
  expect(instance.stop).toHaveBeenCalledOnce();
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(
    true,
  );
  act(() => {
    instance.onresult?.({
      resultIndex: 1,
      results: [
        { isFinal: true, 0: { transcript: "читать книги" } },
        { isFinal: true, 0: { transcript: "и музыку" } },
      ],
    });
    instance.onend?.();
  });
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
    "Люблю читать книги и музыку",
  );
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(
    false,
  );
});
it("leaves text editable when permission is denied and cancels recognition on unmount", async () => {
  vi.stubGlobal("SpeechRecognition", SpeechMock);
  const mounted = render(<Harness />);
  await userEvent.click(
    screen.getByRole("button", { name: "Ответить голосом" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Включить голосовой ввод" }),
  );
  act(() => instance.onerror?.({ error: "not-allowed" }));
  expect(screen.getByRole("alert").textContent).toContain("Нет доступа");
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "Продолжу текстом" },
  });
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
    "Продолжу текстом",
  );
  mounted.unmount();
  expect(instance.abort).toHaveBeenCalledOnce();
  expect(instance.onresult).toBeNull();
});
it("explains the text fallback when speech recognition is unsupported", () => {
  vi.stubGlobal("SpeechRecognition", undefined);
  vi.stubGlobal("webkitSpeechRecognition", undefined);
  render(<Harness />);
  expect(
    (
      screen.getByRole("button", {
        name: "Ответить голосом",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).disabled).toBe(
    false,
  );
  expect(screen.getByText(/диктовку клавиатуры телефона/)).toBeTruthy();
});
