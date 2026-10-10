import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { PhotoGallery } from "./PhotoGallery";
import { ProfilePreview } from "./ProfilePreview";
import { ProfileAvatar } from "./ProfileAvatar";
import { installDialogMock } from "./testDialog";
import type { Profile } from "./api";
installDialogMock();
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
const profile: Profile = {
  userId: 3,
  properties: [{ name: "display_name", value: "Саша", visible: true }],
  interests: [],
  photos: [{ id: 10, position: 0, url: "/expired" }],
  avatarUrl: "/expired",
  photoCount: 6,
  photoAllowance: 1,
};
const response = (p: Profile) => ({
  ok: true,
  status: 200,
  json: async () => p,
});

it("renews an expired gallery URL without a page reload and keeps only permitted photos", async () => {
  sessionStorage.setItem("nexus-token", "session");
  const fetch = vi.fn(async (..._args: unknown[]) =>
    response({
      ...profile,
      photos: [{ id: 10, position: 0, url: "/renewed" }],
      avatarUrl: "/renewed",
    }),
  );
  vi.stubGlobal("fetch", fetch);
  render(<PhotoGallery profile={profile} />);
  fireEvent.error(screen.getByRole("img"));
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toBe("/renewed"),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe("/api/v1/profiles/3");
  expect(
    screen.queryAllByRole("button", { name: /Показать фото/ }),
  ).toHaveLength(0);
});

it("removes revoked photos when the renewed profile has zero allowance", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      response({
        ...profile,
        photos: [],
        avatarUrl: undefined,
        photoAllowance: 0,
      }),
    ),
  );
  render(<PhotoGallery profile={profile} />);
  fireEvent.error(screen.getByRole("img"));
  await waitFor(() => expect(screen.queryByRole("img")).toBeNull());
  expect(await screen.findByText(/Добавьте своё фото/)).toBeTruthy();
});

it("does not apply a late renewal to a different profile", async () => {
  let resolve!: (p: ReturnType<typeof response>) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    ),
  );
  const { rerender } = render(<PhotoGallery profile={profile} />);
  fireEvent.error(screen.getByRole("img"));
  rerender(
    <PhotoGallery
      profile={{
        ...profile,
        userId: 4,
        photos: [{ id: 20, position: 0, url: "/different" }],
      }}
    />,
  );
  resolve(
    response({
      ...profile,
      photos: [{ id: 10, position: 0, url: "/renewed" }],
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toBe("/different"),
  );
});

it("bounds automatic retries and lets the user retry a temporary server failure", async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(
      response({
        ...profile,
        photos: [{ id: 10, position: 0, url: "/renewed" }],
      }),
    );
  vi.stubGlobal("fetch", fetch);
  render(<PhotoGallery profile={profile} />);
  fireEvent.error(screen.getByRole("img"));
  await waitFor(() =>
    expect(screen.getByText("Не удалось загрузить фото.")).toBeTruthy(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Попробовать снова" }));
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toBe("/renewed"),
  );
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("uses a sized header avatar and renews its failed URL", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response({ ...profile, avatarUrl: "/fresh-avatar" })),
  );
  const { container } = render(<ProfileAvatar profile={profile} />);
  expect(container.querySelector("img")?.className).toBe("avatar-photo");
  fireEvent.error(container.querySelector("img")!);
  await waitFor(() =>
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/fresh-avatar",
    ),
  );
});

it("keeps hidden biography private even after the owner's media renewal", async () => {
  const hidden = {
    ...profile,
    properties: [
      ...profile.properties,
      { name: "bio", value: "Secret biography", visible: false },
    ],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      response({
        ...hidden,
        photos: [{ id: 10, position: 0, url: "/renewed" }],
      }),
    ),
  );
  render(
    <ProfilePreview profile={hidden} onClose={vi.fn()} onEdit={vi.fn()} />,
  );
  fireEvent.error(screen.getByRole("img"));
  await waitFor(() =>
    expect(screen.getByRole("img").getAttribute("src")).toBe("/renewed"),
  );
  expect(screen.queryByText("Secret biography")).toBeNull();
  expect(screen.getByRole("heading", { name: "Саша" })).toBeTruthy();
});
