import { getAllTrippers } from '@/lib/db/tripper-queries';
import { TopTrippersGrid } from './TopTrippersGrid';

export async function TopTrippersGridWrapper() {
  const trippers = await getAllTrippers();

  return <TopTrippersGrid trippers={trippers} />;
}
