'use client'
import Link from 'next/link'

export default function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4">
        <nav className="mt-3 flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-neutral-200 backdrop-blur">
          <Link href="/" className="inline-flex items-center gap-2">
            <img src="/logo.svg" alt="Randomtrip" className="h-7 w-7" />
            <span className="font-semibold">Randomtrip</span>
          </Link>
          <div className="hidden gap-4 text-sm md:flex">
            <Link href="/packages/by-type/couple" className="hover:underline">Paquetes</Link>
            <Link href="/journey/basic-config" className="hover:underline">Planificación</Link>
            <Link href="/journey/add-ons" className="hover:underline">Add-ons</Link>
            <Link href="/journey/summary" className="hover:underline">Resumen</Link>
          &lt;/div&gt;
          <div className="flex gap-2">
            <Link href="/dashboard" className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50">
              Mi perfil
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
