import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwipeDeck } from "./SwipeDeck";
import { installDialogMock } from "./testDialog";
installDialogMock();
const person = {
  userId: 2,
  properties: [{ name: "display_name", value: "Саша", visible: true }],
  interests: ["Музыка"],
  commonInterests: ["Музыка"],
};
class TestPointerEvent extends MouseEvent {
  pointerId: number;
  isPrimary: boolean;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.isPrimary = init.isPrimary ?? true;
  }
}
beforeEach(() => vi.stubGlobal("PointerEvent", TestPointerEvent));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function setup() {
  const react = vi.fn(async () => false);
  render(
    <SwipeDeck
      people={[person]}
      busy={false}
      onReact={react}
      onFocus={vi.fn()}
      cycle={1}
      reviewed={0}
      liked={0}
    />,
  );
  return { react, card: screen.getByRole("article") };
}
function drag(card: HTMLElement, x: number, y = 0) {
  fireEvent.pointerDown(card, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 300,
    clientY: 300,
  });
  fireEvent.pointerMove(card, {
    pointerId: 1,
    clientX: 300 + x,
    clientY: 300 + y,
  });
  fireEvent.pointerUp(card, {
    pointerId: 1,
    clientX: 300 + x,
    clientY: 300 + y,
  });
}
it.each([0, 0.684, 1])(
  "shows semantic similarity %s without expanding the profile",
  (score) => {
    render(
      <SwipeDeck
        people={[{ ...person, compatibilityScore: score }]}
        busy={false}
        onReact={vi.fn()}
        onFocus={vi.fn()}
        cycle={1}
        reviewed={0}
        liked={0}
      />,
    );
    expect(
      screen.getByText(`${Math.round(score * 100)}% совпадения`),
    ).toBeTruthy();
    expect(screen.getByText("С чего начать разговор")).toBeTruthy();
  },
);
it("ignores small drags and vertical scrolls, submits one horizontal swipe", async () => {
  const { react, card } = setup();
  drag(card, 30);
  drag(card, 20, 120);
  expect(react).not.toHaveBeenCalled();
  drag(card, -150);
  drag(card, 150);
  await waitFor(() => expect(react).toHaveBeenCalledTimes(1));
  expect(react).toHaveBeenCalledWith(person, false);
  expect(screen.getByRole("article")).toBe(card);
});
it("supports keyboard likes and restores controls after a rejected request", async () => {
  const { react, card } = setup();
  fireEvent.keyDown(card, { key: "ArrowRight" });
  await waitFor(() => expect(react).toHaveBeenCalledWith(person, true));
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Пропустить Саша" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("reveals interest-specific conversation ideas without recording a reaction", async () => {
  const { react } = setup();
  expect(screen.queryByRole("button", { name: "Узнать поближе" })).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Музыка" }));
  expect(screen.getByText("Какой трек у тебя сейчас на повторе?")).toBeTruthy();
  expect(react).not.toHaveBeenCalled();
});

it("swipes photos inside the viewer without moving or reacting to the dating card", async () => {
  const react = vi.fn(async () => true);
  render(
    <SwipeDeck
      people={[
        {
          ...person,
          photos: [
            { id: 1, position: 0, url: "/one" },
            { id: 2, position: 1, url: "/two" },
          ],
        },
      ]}
      busy={false}
      onReact={react}
      onFocus={vi.fn()}
      cycle={1}
      reviewed={0}
      liked={0}
    />,
  );
  const card = screen.getByRole("article");
  await userEvent.click(
    screen.getByRole("button", { name: "Открыть фотографии" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Фотографии" });
  const img = dialog.querySelector(".viewer-stage img") as HTMLElement;
  drag(img, -150);
  expect(dialog.querySelector(".viewer-stage img")?.getAttribute("src")).toBe(
    "/two",
  );
  expect(card.className).not.toContain("leaving-");
  expect(card.style.getPropertyValue("--swipe-x")).toBe("0px");
  expect(react).not.toHaveBeenCalled();
});
