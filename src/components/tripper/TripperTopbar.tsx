'use client';

export default function TripperTopbar() {
  return (
    <div
      className="sticky z-20 bg-white/80 backdrop-blur border-b"
      style={{ top: 'var(--rt-header-h, 64px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
        <input
          placeholder="Buscar..."
          className="flex-1 px-3 py-2 rounded-xl bg-neutral-100"
        />
        <a
          href="/dashboard/tripper/packages/new"
          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm"
        >
          Crear Ruta
        </a>
      </div>
    </div>
  );
}
