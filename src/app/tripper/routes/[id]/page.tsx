'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/store';

export default function RouteDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id?.toString() ?? '';
  const route = useStore(s => s.routes.find(r => r.id === id));

  if (!route) {
    return (
      <div className="p-6">
        <p className="mb-4">La ruta <strong>{id}</strong> no existe.</p>
        <Link href="/dashboard/tripper/routes" className="underline">← Volver a Mis Rutas</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{route.title}</h1>
      <div className="text-sm text-neutral-600">
        Nivel: {route.productLevel} · Estado: {route.status} · Actualizado: {route.updatedAt}
      </div>
      <div className="p-4 bg-white rounded-2xl shadow">
        <h2 className="font-medium mb-2">Hints de destino</h2>
        <ul className="list-disc pl-5">
          {route.destinationHints.map((h: string, i: number) => <li key={i}>{h}</li>)}
        </ul>
      </div>
      <Link href="/dashboard/tripper/routes" className="underline">← Volver</Link>
    </div>
  );
}