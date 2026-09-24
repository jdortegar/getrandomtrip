import { join } from "node:path";
import { Font } from "@react-pdf/renderer";
let registered = false;
/** Node-only, licensed local assets; call only after generation validation. */
export function registerPdfFonts() {
  if (registered) return;
  const directory = join(process.cwd(), "public/assets/fonts/barlow");
  Font.register({
    family: "Barlow",
    fonts: [
      { src: join(directory, "Barlow-Regular.ttf"), fontWeight: 400 },
      { src: join(directory, "Barlow-Bold.ttf"), fontWeight: 700 },
    ],
  });
  registered = true;
}
