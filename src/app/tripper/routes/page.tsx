'use client';

import { useState, useMemo } from 'react';
import { useTripperStore } from '../../../store/tripperStore';
import Link from 'next/link';
import { RouteStatus, TripperLevel } from '../../../types/tripper';

export default function TripperRoutesPage() {
  const { routes } = useTripperStore();
  const [selectedStatus, setSelectedStatus] = useState<RouteStatus | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<TripperLevel | 'all'>('all');

  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const statusMatch = selectedStatus === 'all' || route.status === selectedStatus;
      const levelMatch = selectedLevel === 'all' || route.productLevel === selectedLevel;
      return statusMatch && levelMatch;
    });
  }, [routes, selectedStatus, selectedLevel]);

  const routeStatuses: RouteStatus[] = ['draft', 'in_review', 'needs_changes', 'approved', 'published', 'archived'];
  const tripperLevels: TripperLevel[] = ['rookie', 'pro', 'elite'];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">Mis Rutas</h1>

      <div className="flex gap-4 mb-6">
        <select
          className="p-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as RouteStatus | 'all')}
        >
          <option value="all">Todos los Estados</option>
          {routeStatuses.map(status => (
            <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          className="p-2 border border-gray-300 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value as TripperLevel | 'all')}
        >
          <option value="all">Todos los Niveles</option>
          {tripperLevels.map(level => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-neutral-600">Título</th>
              <th className="px-4 py-2 text-left text-neutral-600">Nivel</th>
              <th className="px-4 py-2 text-left text-neutral-600">Estado</th>
              <th className="px-4 py-2 text-left text-neutral-600">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoutes.map((route) => (
              <tr key={route.id} className="border-t border-neutral-100">
                <td className="px-4 py-2 text-neutral-800">
                  <Link href={`/tripper/routes/${route.id}`} className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    {route.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-800">{route.productLevel}</td>
                <td className="px-4 py-2 text-neutral-800">{route.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2 text-neutral-800">{new Date(route.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRoutes.length === 0 && (
          <p className="text-center text-neutral-500 mt-4">No hay rutas que coincidan con los filtros.</p>
        )}
      </div>
    </div>
  );
}
