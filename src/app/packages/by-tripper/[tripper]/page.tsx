import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import {
  getTripperBySlug,
  getTripperPackagesByTypeAndLevel,
} from '@/lib/db/tripper-queries';
import { getTripperAvailableTypesAndLevels } from '@/lib/data/tripper-trips';
import TripperCard from '@/components/TripperCard';
import PackageCard from '@/components/PackageCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Star, Users, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getExcuseTitle, getExcuseImage } from '@/lib/helpers/excuse-helper';
import { getLevelById } from '@/lib/data/shared/levels';

// Helper function to get duration and activity ranges based on level
function getLevelInfo(level: string) {
  const levelData = getLevelById(level as any);
  if (!levelData) {
    return { duration: '2-3 días', activities: '1-2 actividades' };
  }

  // Duration based on maxNights
  let duration = '';
  if (levelData.maxNights <= 2) {
    duration = '1-2 días';
  } else if (levelData.maxNights <= 3) {
    duration = '2-3 días';
  } else if (levelData.maxNights <= 4) {
    duration = '3-4 días';
  } else if (levelData.maxNights <= 5) {
    duration = '4-5 días';
  } else {
    duration = '5+ días';
  }

  // Activities based on level complexity
  let activities = '';
  if (level === 'essenza') {
    activities = '1-2 actividades';
  } else if (level === 'modo-explora') {
    activities = '2-3 actividades';
  } else if (level === 'explora-plus') {
    activities = '3-4 actividades';
  } else if (level === 'bivouac') {
    activities = '4-5 actividades';
  } else if (level === 'atelier-getaway') {
    activities = '5+ actividades';
  } else {
    activities = '2-3 actividades';
  }

  return { duration, activities };
}

export async function generateMetadata({
  params,
}: {
  params: { tripper: string };
}): Promise<Metadata> {
  const dbTripper = await getTripperBySlug(params.tripper);

  if (!dbTripper) return { title: 'Randomtrip' };

  return {
    title: `Paquetes de ${dbTripper.name} | Randomtrip`,
    description: `Explora los paquetes de viaje únicos creados por ${dbTripper.name}. Descubre aventuras personalizadas y experiencias auténticas.`,
    openGraph: {
      title: `Paquetes de ${dbTripper.name} | Randomtrip`,
      description: `Explora los paquetes de viaje únicos creados por ${dbTripper.name}.`,
      images: [
        {
          url: dbTripper.avatarUrl || '/images/fallback-profile.jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: { tripper: string };
}) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === 'undefined') {
    redirect('/packages');
  }

  // Fetch from database
  const dbTripper = await getTripperBySlug(params.tripper);

  // Must have database tripper data
  if (!dbTripper) return notFound();

  // Fetch tripper packages organized by type and level
  const tripperPackagesByType = await getTripperPackagesByTypeAndLevel(
    dbTripper.id,
  );

  // Get all packages for display
  const allPackages = Object.values(tripperPackagesByType)
    .flatMap((levelPackages) => Object.values(levelPackages))
    .flat();

  // Group packages by type for better organization
  const packagesByType = Object.entries(tripperPackagesByType).map(
    ([type, levelPackages]) => ({
      type,
      packages: Object.values(levelPackages).flat(),
      totalPackages: Object.values(levelPackages).flat().length,
    }),
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trippers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Trippers
              </Link>
            </Button>
          </div>

          {/* Tripper Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative">
              <Image
                src={dbTripper.avatarUrl || '/images/fallback-profile.jpg'}
                alt={dbTripper.name}
                width={120}
                height={120}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Paquetes de {dbTripper.name}
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                {dbTripper.bio ||
                  'Experto en crear experiencias de viaje únicas y memorables.'}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {dbTripper.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {dbTripper.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {allPackages.length} paquetes disponibles
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  4.9/5 calificación
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/trippers/${dbTripper.tripperSlug}`}>
                  Ver Perfil
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {allPackages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay paquetes disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              {dbTripper.name} aún no ha creado paquetes de viaje.
            </p>
            <Button asChild>
              <Link href="/trippers">Explorar otros Trippers</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {packagesByType.map(({ type, packages, totalPackages }) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">
                    {type.replace(/-/g, ' ')} Packages
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {totalPackages} paquetes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((pkg) => {
                    const levelInfo = getLevelInfo(pkg.level);
                    return (
                      <div
                        key={pkg.id}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:border-primary group relative"
                      >
                        {/* Mystery overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40 z-10" />

                        <div className="relative h-56 w-full">
                          <Image
                            src={
                              pkg.excuseKey
                                ? getExcuseImage(pkg.excuseKey)
                                : pkg.heroImage ||
                                  '/images/fallback-package.jpg'
                            }
                            alt="Paquete sorpresa"
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="p-6 relative z-20">
                          {/* Destination hint */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {pkg.destinationCountry}
                              </span>
                            </div>
                          </div>

                          {/* Excuse as title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {pkg.excuseKey
                              ? getExcuseTitle(pkg.excuseKey)
                              : 'Paquete Sorpresa'}
                          </h3>

                          {/* Mystery description */}
                          <p className="text-gray-600 text-sm mb-4">
                            Una experiencia única te espera. El destino y las
                            actividades se revelarán cuando estés listo para la
                            aventura.
                          </p>

                          {/* Level-based info */}
                          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary/60 rounded-full" />
                              <span>Duración: {levelInfo.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary/60 rounded-full" />
                              <span>Actividades: {levelInfo.activities}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
