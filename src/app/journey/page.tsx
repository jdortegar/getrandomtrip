'use client';

import { Suspense, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useSearchParams } from 'next/navigation';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import HeaderHero from '@/components/journey/HeaderHero';
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
    substeps: [
      {
        id: 'origin',
        title: 'ORIGEN',
        description: 'Elegí país y ciudad de salida.',
      },
      {
        id: 'dates',
        title: 'FECHAS',
        description:
          'Elegí cantidad de días y la fecha de inicio. Fin de semana o flexible.',
      },
      {
        id: 'transport',
        title: 'TRANSPORTE',
        description:
          'Definí el orden de preferencia de medios de transporte arrastrando.',
      },
    ],
  },
  {
    id: 'preferences',
    label: 'Preferencias y filtros',
    substeps: [
      {
        id: 'filters',
        title: 'FILTROS',
        description:
          'Horarios preferidos, clima, destinos a evitar, Tiempo máximo de viaje, Tipo de transporte.',
      },
      {
        id: 'addons',
        title: 'Extras',
        description: 'Elegí tus add-ons.',
      },
    ],
  },
];

function getAccordionForStep(tabId: string, substepId?: string): string {
  switch (tabId) {
    case 'budget':
      return substepId === 'experience' ? 'experience' : 'travel-type';
    case 'excuse':
      return substepId === 'refine-details' ? 'refine-details' : 'excuse';
    case 'details':
      if (substepId === 'dates') return 'dates';
      if (substepId === 'transport') return 'transport';
      return 'origin';
    case 'preferences':
      return substepId === 'addons' ? 'addons' : 'filters';
    default:
      return '';
  }
}

function getTabForSection(sectionId: string): string {
  switch (sectionId) {
    case 'travel-type':
    case 'experience':
      return 'budget';
    case 'excuse':
    case 'refine-details':
      return 'excuse';
    case 'origin':
    case 'dates':
    case 'transport':
      return 'details';
    case 'filters':
    case 'addons':
      return 'preferences';
    default:
      return 'budget';
  }
}

function getInitialStepFromParams(params: URLSearchParams): {
  sectionId: string;
  tabId: string;
} {
  const travelType = params.get('travelType');
  const experience = params.get('experience');
  const excuse = params.get('excuse');
  const originCountry = params.get('originCountry');
  const originCity = params.get('originCity');
  const startDate = params.get('startDate');
  const nights = params.get('nights');
  const transport = params.get('transport');

  if (!travelType) return { tabId: 'budget', sectionId: 'travel-type' };
  if (!experience) return { tabId: 'budget', sectionId: 'experience' };
  if (!excuse) return { tabId: 'excuse', sectionId: 'excuse' };
  if (!originCountry || !originCity)
    return { tabId: 'details', sectionId: 'origin' };
  if (!startDate || !nights) return { tabId: 'details', sectionId: 'dates' };
  if (!transport) return { tabId: 'details', sectionId: 'transport' };
  return { tabId: 'preferences', sectionId: 'filters' };
}

function JourneyPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('budget');
  const [openSectionId, setOpenSectionId] = useState('travel-type');

  useEffect(() => {
    const { tabId, sectionId } = getInitialStepFromParams(searchParams);
    setActiveTab(tabId);
    setOpenSectionId(sectionId);
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleStepClick = (tabId: string, substepId?: string) => {
    setActiveTab(tabId);
    setOpenSectionId(getAccordionForStep(tabId, substepId));
  };

  const handleSummaryEdit = (sectionId: string) => {
    setActiveTab(getTabForSection(sectionId));
    setOpenSectionId(sectionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderHero
        description="¿Con quién vas a escribir tu próxima historia?"
        title="Empezá la aventura"
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={CONTENT_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
        user={{
          name: 'Nombre usuario',
        }}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr_320px]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              activeTab={activeTab}
              onStepClick={handleStepClick}
              tabs={CONTENT_TABS}
            />
          </div>

          <div className="min-w-0">
            <JourneyMainContent
              activeTab={activeTab}
              onOpenSection={setOpenSectionId}
              onTabChange={handleTabChange}
              openSectionId={openSectionId}
            />
          </div>

          <JourneySummary onEdit={handleSummaryEdit} />
        </div>
      </div>
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <JourneyPageContent />
    </Suspense>
  );
}
