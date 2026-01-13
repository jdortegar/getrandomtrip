'use client';

import { useState } from 'react';
import JourneyContentNavigation from '@/components/journey/JourneyContentNavigation';
import JourneyHero from '@/components/journey/JourneyHero';
import JourneyMainContent from '@/components/journey/JourneyMainContent';
import JourneyProgressSidebar from '@/components/journey/JourneyProgressSidebar';

const JOURNEY_STEPS = [
  {
    description:
      'Desde escapadas solo, en grupo o en familia hasta viajes con tu mascota o Honey moon.',
    isComplete: true,
    number: 1,
    title: 'Tipo de viaje',
  },
  {
    description:
      'Lo único que definís acá es el presupuesto por persona para pasaje y alojamiento. Ese será tu techo. Del resto... nos ocupamos nosotros.',
    isComplete: false,
    number: 2,
    title: 'Experiencias',
  },
  {
    description: 'Viajamos por muchas razones, ¿cuál te mueve hoy?',
    isComplete: false,
    number: 3,
    title: 'Excusa',
  },
];

const CONTENT_TABS = [
  { id: 'budget', label: 'Presupuesto' },
  { id: 'excuse', label: 'Excusa' },
  { id: 'details', label: 'Detalles y planificación' },
  { id: 'preferences', label: 'Preferencias y filtros' },
  { id: 'extras', label: 'Extras' },
];

export default function JourneyPage() {
  const [activeTab, setActiveTab] = useState('budget');
  const [currentStep] = useState(2);

  const progress = Math.round((currentStep / JOURNEY_STEPS.length) * 100);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
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
        tabs={CONTENT_TABS}
        user={{
          name: 'Nombre usuario',
        }}
      />

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Progress Sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <JourneyProgressSidebar
              currentStep={currentStep}
              progress={progress}
              steps={JOURNEY_STEPS}
            />
          </div>

          {/* Main Content Area */}
          <div>
            {/* Dynamic Content */}
            <JourneyMainContent activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}
