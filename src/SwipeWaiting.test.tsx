import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SwipeDeck } from "./SwipeDeck";

afterEach(() => { cleanup(); vi.useRealTimers(); });
it("shows waiting after two seconds, cancels fast requests and resets between swipes", () => {
  vi.useFakeTimers();
  const props = {people:[{userId:2, properties:[{name:"display_name",value:"Саша",visible:true}],interests:[]}],onReact:vi.fn(),onFocus:vi.fn(),cycle:1,reviewed:0,liked:0};
  const {rerender,unmount} = render(<SwipeDeck {...props} busy />);
  const waiting = () => screen.queryByText("Момент, ищем твою волну…");
  act(() => vi.advanceTimersByTime(1999));
  expect(waiting()).toBeNull();
  act(() => vi.advanceTimersByTime(1));
  expect(waiting()).toBeTruthy();
  rerender(<SwipeDeck {...props} busy={false} />);
  expect(waiting()).toBeNull();
  rerender(<SwipeDeck {...props} busy />);
  act(() => vi.advanceTimersByTime(500));
  rerender(<SwipeDeck {...props} busy={false} />);
  act(() => vi.advanceTimersByTime(2000));
  expect(waiting()).toBeNull();
  rerender(<SwipeDeck {...props} busy />);
  act(() => vi.advanceTimersByTime(1999));
  expect(waiting()).toBeNull();
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});
