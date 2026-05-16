import { getAllTrippers } from '@/lib/db/tripper-queries';
import { HomePageClient } from './HomePageClient';

export default async function HomePage() {
  const trippers = await getAllTrippers();
  return <HomePageClient trippers={trippers} />;
}
