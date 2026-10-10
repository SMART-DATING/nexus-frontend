import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiscoverySetup, InviteFriends } from "./WelcomeSetup";
import type { Profile } from "./api";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const profile: Profile = {
  userId: 1,
  interests: ["Музыка"],
  properties: ["display_name", "birth_date", "city", "bio"].map((name) => ({
    name,
    value: "x",
    visible: true,
  })),
  contextCount: 0,
  photoCount: 0,
};
it("takes a newcomer straight to the missing story, then to photos after saving it", async () => {
  const open = vi.fn();
  const view = render(<DiscoverySetup profile={profile} onOpen={open} />);
  expect(
    screen.getByText(/Добавь хотя бы одно фото и немного расскажи/),
  ).toBeTruthy();
  await userEvent.click(
    screen.getByRole("button", { name: "Рассказать о себе" }),
  );
  expect(open).toHaveBeenLastCalledWith(2);
  view.rerender(
    <DiscoverySetup profile={{ ...profile, contextCount: 1 }} onOpen={open} />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Добавить фото" }));
  expect(open).toHaveBeenLastCalledWith(1);
});
it("copies a registration link without sending anything", async () => {
  const user = userEvent.setup();
  const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
  render(<InviteFriends />);
  await user.click(screen.getByRole("button", { name: "Позвать друзей" }));
  expect(write).toHaveBeenCalledWith(`${window.location.origin}/#register`);
  expect(screen.getByRole("status").textContent).toBe(
    "Приглашение скопировано",
  );
});
