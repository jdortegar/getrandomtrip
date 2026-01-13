'use client';

import { Accordion } from '@/components/ui/accordion';
import { JourneyDropdown } from '@/components/journey/JourneyDropdown';
import { cn } from '@/lib/utils';

interface JourneyMainContentProps {
  activeTab: string;
  className?: string;
}

export default function JourneyMainContent({
  activeTab,
  className,
}: JourneyMainContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'budget':
        return (
          <div>
            <Accordion collapsible type="single">
              <JourneyDropdown
                className="mb-4"
                content="Elegí tu experiencia"
                label="Experiencia"
                linkHref="#"
                linkLabel="Ver planes"
                value="experiencia"
              >
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Selecciona el nivel de experiencia que más se adapte a tu
                    presupuesto y preferencias.
                  </p>
                  {/* Experience selection content */}
                </div>
              </JourneyDropdown>

              <JourneyDropdown
                content="Qué quiero de mi viaje"
                label="Excusa"
                value="excusa"
              >
                <div className="space-y-4">
                  <p className="text-gray-600">
                    ¿Cuál es la razón de tu viaje?
                  </p>
                  {/* Excuse selection content */}
                </div>
              </JourneyDropdown>
            </Accordion>
          </div>
        );
      case 'excuse':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Excusa</h2>
            <p className="text-gray-600">¿Cuál es la razón de tu viaje?</p>
            {/* Placeholder for excuse selection components */}
          </div>
        );
      case 'details':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Detalles y planificación
            </h2>
            <p className="text-gray-600">Configura los detalles de tu viaje.</p>
            {/* Placeholder for details components */}
          </div>
        );
      case 'preferences':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Preferencias y filtros
            </h2>
            <p className="text-gray-600">
              Personaliza tus preferencias de viaje.
            </p>
            {/* Placeholder for preferences components */}
          </div>
        );
      case 'extras':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Extras</h2>
            <p className="text-gray-600">Agrega extras a tu viaje.</p>
            {/* Placeholder for extras components */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex-1 min-h-0', className)}>
      <div className="">{renderContent()}</div>
    </div>
  );
}
