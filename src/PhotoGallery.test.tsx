import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoGallery } from "./PhotoGallery";
import { installDialogMock } from "./testDialog";
installDialogMock();
afterEach(cleanup);
it("cycles only the photos actually delivered to this viewer", async () => {
  render(
    <PhotoGallery
      profile={{
        userId: 3,
        properties: [],
        interests: [],
        photoCount: 6,
        photoAllowance: 2,
        photos: [
          { id: 1, position: 0, url: "/one" },
          { id: 2, position: 1, url: "/two" },
        ],
      }}
    />,
  );
  expect(screen.getByRole("img").getAttribute("src")).toBe("/one");
  await userEvent.click(screen.getByRole("button", { name: "Следующее фото" }));
  expect(screen.getByRole("img").getAttribute("src")).toBe("/two");
  await userEvent.click(screen.getByRole("button", { name: "Следующее фото" }));
  expect(screen.getByRole("img").getAttribute("src")).toBe("/one");
  expect(screen.getAllByRole("button", { name: /Показать фото/ })).toHaveLength(
    2,
  );
});
it("does not render an image or gallery controls when zero photos are permitted", () => {
  render(
    <PhotoGallery
      profile={{
        userId: 3,
        properties: [],
        interests: [],
        photoCount: 6,
        photoAllowance: 0,
        photos: [],
      }}
    />,
  );
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText(/Добавьте своё фото/)).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Добавить своё фото" })
      .getAttribute("href"),
  ).toBe("/#profile/photos");
});

it("opens only permitted photographs in the viewer and closes it without changing the card", async () => {
  render(
    <PhotoGallery
      profile={{
        userId: 3,
        properties: [],
        interests: [],
        photoCount: 6,
        photoAllowance: 2,
        photos: [
          { id: 1, position: 0, url: "/one" },
          { id: 2, position: 1, url: "/two" },
        ],
      }}
    />,
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Открыть фотографии" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Фотографии" });
  expect(dialog.querySelectorAll(".viewer-thumbnails button")).toHaveLength(2);
  await userEvent.click(
    screen.getByRole("button", { name: "Следующее фото в просмотре" }),
  );
  expect(dialog.querySelector(".viewer-stage img")?.getAttribute("src")).toBe(
    "/two",
  );
  await userEvent.click(screen.getByRole("button", { name: "Закрыть окно" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("img").getAttribute("src")).toBe("/one");
});
