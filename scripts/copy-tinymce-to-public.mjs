/**
 * Copy TinyMCE from node_modules into public/tinymce so the editor can load via
 * tinymceScriptSrc (see TinyMCE docs: Self-hosting TinyMCE in React).
 * https://www.tiny.cloud/docs/tinymce/8/react-pm/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const source = path.join(repoRoot, "node_modules", "tinymce");
const dest = path.join(repoRoot, "public", "tinymce");

if (!fs.existsSync(source)) {
  console.warn("[copy-tinymce] node_modules/tinymce missing; skip (run npm install).");
  process.exit(0);
}

fs.rmSync(dest, { force: true, recursive: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(source, dest, { recursive: true });
console.log("[copy-tinymce] Copied TinyMCE to public/tinymce");
