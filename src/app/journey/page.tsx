'use client';

import { Suspense, useState } from 'react';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import JourneyHero from '@/components/journey/JourneyHero';
import JourneyMainContent from '@/components/journey/JourneyMainContent';
import JourneyProgressSidebar from '@/components/journey/JourneyProgressSidebar';
import JourneySummary from '@/components/journey/JourneySummary';

interface Substep {
  description: string;
  id: string;
  title: string;
}

interface ContentTab {
  id: string;
  label: string;
  substeps: Substep[];
}

const CONTENT_TABS: ContentTab[] = [
  {
    id: 'budget',
    label: 'Presupuesto',
    substeps: [
      {
        id: 'travel-type',
        title: 'TIPO DE VIAJE',
        description:
          'Desde escapadas solo, en grupo o en familia hasta viajes con tu mascota o Honey moon.',
      },
      {
        id: 'experience',
        title: 'EXPERIENCIA',
        description:
          'Lo único que definís acá es el presupuesto por persona para pasaje y alojamiento. Ese será tu techo. Del resto... nos ocupamos nosotros.',
      },
    ],
  },
  {
    id: 'excuse',
    label: 'Excusa',
    substeps: [
      {
        id: 'reason',
        title: 'CUÁL ES LA RAZÓN DE MI VIAJE',
        description: 'Viajamos por muchas razones, ¿cuál te mueve hoy?',
      },
      {
        id: 'refine-details',
        title: 'AFINAR DETALLES',
        description: 'Elegí una o más aventuras.',
      },
    ],
  },
  {
    id: 'details',
    label: 'Detalles y planificación',
    substeps: [],
  },
  {
    id: 'preferences',
    label: 'Preferencias y filtros',
    substeps: [],
  },
];

export default function JourneyPage() {
  const [activeTab, setActiveTab] = useState('budget');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 animate-pulse" aria-hidden>
          <div className="h-64 bg-gray-200" />
          <div className="container mx-auto px-4 py-8">
            <div className="h-96 bg-gray-100 rounded" />
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <JourneyHero
          description="¿Con quién vas a escribir tu próxima historia?"
          subtitle="PUNTO DE PARTIDA"
          title="Empezá la aventura"
        />

        {/* Full Width Navigation Bar */}
        <JourneyContentNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={CONTENT_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          user={{
            name: 'Nombre usuario',
          }}
        />

        {/* Main Content Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr_320px]">
            {/* Progress Sidebar */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <JourneyProgressSidebar
                activeTab={activeTab}
                tabs={CONTENT_TABS}
              />
            </div>

            {/* Main Content Area */}
            <div>
              {/* Dynamic Content */}
              <JourneyMainContent
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Summary Sidebar */}
            <JourneySummary />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
