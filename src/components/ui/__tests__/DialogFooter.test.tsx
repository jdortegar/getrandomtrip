import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DialogFooter } from "../dialog";

it("lets footer buttons shrink so long labels wrap instead of overflowing the modal", () => {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <DialogFooter>
      <button type="button">Cancel</button>
    </DialogFooter>,
  );
  const footer = template.content.querySelector('[data-slot="dialog-footer"]') as HTMLElement;
  expect(footer.className).toContain("sm:[&>*]:min-w-0");
  expect(footer.className).toContain("sm:[&>*]:shrink");
});
