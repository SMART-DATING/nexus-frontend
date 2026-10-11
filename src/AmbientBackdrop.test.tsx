import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { AmbientBackdrop } from "./AmbientBackdrop";
afterEach(() => {cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
it("samples the displayed photo without another private image request", () => {
  const drawImage=vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue({drawImage,getImageData:()=>({data:new Uint8ClampedArray([100,80,180,255])})} as unknown as CanvasRenderingContext2D);
  const photo=document.createElement("img");photo.src="/api/v1/photos/1?access=private";
  const imageRequest=vi.fn();vi.stubGlobal("Image",imageRequest);
  const {container}=render(<AmbientBackdrop photo={photo} />);
  expect(drawImage).toHaveBeenCalledWith(photo,0,0,16,16);
  expect(imageRequest).not.toHaveBeenCalled();
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--ambient-tone")).toBe("100, 80, 180");
});
it("pauses background animation only while the page is hidden", () => {
  const hidden=vi.spyOn(document,"hidden","get").mockReturnValue(false);
  const {container}=render(<AmbientBackdrop />);
  expect((container.firstElementChild as HTMLElement).dataset.paused).toBe("false");
  hidden.mockReturnValue(true);fireEvent(document,new Event("visibilitychange"));
  expect((container.firstElementChild as HTMLElement).dataset.paused).toBe("true");
  hidden.mockReturnValue(false);fireEvent(document,new Event("visibilitychange"));
  expect((container.firstElementChild as HTMLElement).dataset.paused).toBe("false");
});
