// frontend/src/app/journey/experience-level/page.tsx
import { redirect } from 'next/navigation';

export default function LegacyExperienceLevelRedirect({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const usp = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => usp.append(k, x)); else if (v != null) usp.set(k, v);
  });
  redirect(`/journey/basic-config?${usp.toString()}`);
}