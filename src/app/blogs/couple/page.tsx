import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historias de parejas | Randomtrip",
  description: "Pronto: notas y guías creadas por nuestros Trippers.",
};

export default function CoupleBlogsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1>Historias de parejas</h1>
      <p>Pronto: notas y guías creadas por nuestros Trippers.</p>
    </main>
  );
}