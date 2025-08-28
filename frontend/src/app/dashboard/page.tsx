'use client';

import Navbar from '@/components/Navbar';
import ChatFab from '@/components/chrome/ChatFab';
import BgCarousel from '@/components/ui/BgCarousel';
import DashboardTabs from '@/components/journey/dashboard/DashboardTabs';

export default function DashboardPage(){
  return (
    <>
      <Navbar />
      <div id="hero-sentinel" aria-hidden className="h-px w-px" />
      <BgCarousel scrim={0.75} />
      <main className="container mx-auto max-w-6xl px-4 pt-24 md:pt-28 pb-16">
        <h1 className="text-xl font-semibold text-white drop-shadow-sm">Mis Viajes</h1>
        <div className="mt-4">
          <DashboardTabs />
        </div>
      </main>
      <ChatFab />
    </>
  );
}