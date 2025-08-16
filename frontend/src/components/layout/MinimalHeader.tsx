import Link from "next/link";
export default function MinimalHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/30 backdrop-blur border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold tracking-wide">
          <span className="sr-only">Randomtrip Home</span>
          <img src="/logo-white.svg" alt="Randomtrip" className="h-6" />
        </Link>
        <Link
          href="/login"
          className="text-white/90 text-sm hover:text-white underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </div>
    </header>
  );
}