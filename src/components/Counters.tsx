'use client';

import { type CounterItem } from '@/lib/types';

interface CountersProps {
  counterItems: CounterItem[];
}

export function Counters({ counterItems }: CountersProps) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex md:justify-between md:items-center">
          {counterItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <div className="w-1 h-6 bg-pink-500 mr-6"></div>

              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {item.number}
                </div>
                <div className="text-gray-500 text-sm">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:hidden space-y-6">
          {counterItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <div className="w-1 h-6 bg-pink-500 mr-4 flex-shrink-0"></div>

              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {item.number}
                </div>
                <div className="text-gray-500 text-sm">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
