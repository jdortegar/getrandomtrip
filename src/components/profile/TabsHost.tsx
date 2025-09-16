'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import TabsNav from '@/components/profile/TabsNav';
import OverviewTab from './tabs/OverviewTab';
import { PublicProfile } from '@/lib/profile';

const LoadingState = () => <div className="p-6 text-sm text-neutral-500">Cargando…</div>;

const ReviewsTab = dynamic(() => import('./tabs/ReviewsTab'), { ssr: false, loading: LoadingState });
const FavoritesTab = dynamic(() => import('./tabs/FavoritesTab'), { ssr: false, loading: LoadingState });
const PostsTab = dynamic(() => import('./tabs/PostsTab'), { ssr: false, loading: LoadingState });

const TABS = {
  Overview: OverviewTab,
  Reseñas: ReviewsTab,
  Favoritos: FavoritesTab,
  Bitácoras: PostsTab,
};

export default function TabsHost({ data }: { data: PublicProfile }) {
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>('Overview');

  const ActiveComponent = TABS[activeTab];

  return (
    <>
      <TabsNav onChange={setActiveTab} />
      <div className="mt-6">
        <ActiveComponent data={data} />
      </div>
    </>
  );
}
