/** Loads the browser translator. Typed through tsconfig paths so `tsc` does not check runonweb's source. */
export function loadRunonwebTranslate() {
  return import("runonweb/translate");
}
