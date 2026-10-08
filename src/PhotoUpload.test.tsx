import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoUpload } from "./PhotoUpload";
import { api, type Profile } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
const profile: Profile = { userId: 1, properties: [], interests: [] };
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  vi.mocked(api).mockReset();
});
afterEach(cleanup);
it("previews locally, saves only on confirmation, then releases the preview", async () => {
  const saved = vi.fn();
  const result = { ...profile, avatarUrl: "/api/v1/avatars/1?v=new" };
  vi.mocked(api).mockResolvedValue(result);
  render(<PhotoUpload profile={profile} onSaved={saved} />);
  const file = new File(["png"], "me.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Выбрать фото профиля"), {
    target: { files: [file] },
  });
  expect(
    screen.getByAltText("Предпросмотр фото профиля").getAttribute("src"),
  ).toBe("blob:preview");
  expect(api).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Сохранить фото" }));
  await screen.findByText("Фото обновлено");
  expect(saved).toHaveBeenCalledWith(result);
  const body = vi.mocked(api).mock.calls[0][2] as FormData;
  expect(body.get("file")).toBe(file);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
});
it("rejects unsupported formats and oversized photos without uploading", () => {
  render(<PhotoUpload profile={profile} onSaved={vi.fn()} />);
  const input = screen.getByLabelText("Выбрать фото профиля");
  fireEvent.change(input, {
    target: {
      files: [new File(["svg"], "fake.svg", { type: "image/svg+xml" })],
    },
  });
  expect(screen.getByRole("alert").textContent).toContain("JPEG или PNG");
  const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
    type: "image/png",
  });
  fireEvent.change(input, { target: { files: [large] } });
  expect(screen.getByRole("alert").textContent).toContain("5 МБ");
  expect(api).not.toHaveBeenCalled();
});
it("deletes the uploaded photo through the authenticated profile endpoint", async () => {
  vi.mocked(api).mockResolvedValue(profile);
  const saved = vi.fn();
  render(
    <PhotoUpload
      profile={{ ...profile, avatarUrl: "/api/v1/avatars/1?v=old" }}
      onSaved={saved}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Удалить фото" }));
  await screen.findByText("Фото обновлено");
  expect(api).toHaveBeenCalledWith("/profiles/me/avatar", "DELETE", undefined);
  expect(saved).toHaveBeenCalledWith(profile);
});
