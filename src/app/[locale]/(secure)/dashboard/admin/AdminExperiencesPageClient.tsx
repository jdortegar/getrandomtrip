"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import type { AdminExperience } from "@/lib/admin/types";
import enCopy from "@/dictionaries/en.json";
import esCopy from "@/dictionaries/es.json";

function getCopy(locale: string) {
  return locale.startsWith("en") ? enCopy.adminPages.experiences : esCopy.adminPages.experiences;
}

export function AdminExperiencesPageClient() {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const copy = getCopy(locale);

  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function fetchExperiences() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experiences");
      const data = (await res.json()) as { error?: string; experiences?: AdminExperience[] };
      if (!res.ok || !data.experiences) {
        setError(data.error ?? copy.errorLoad);
        return;
      }
      setExperiences(data.experiences);
    } catch {
      setError(copy.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  async function updateExperience(
    id: string,
    payload: { isActive?: boolean; isFeatured?: boolean },
  ) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!res.ok) return;
      await fetchExperiences();
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    void fetchExperiences();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-center text-sm text-red-600">{error}</div>;

  const cols = copy.columns;
  const st = copy.status;
  const act = copy.actions;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 px-5 py-4">
        <p className="text-xs text-neutral-500">
          {copy.count.replace("{n}", String(experiences.length))}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-5 my-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                {[cols.experience, cols.tripper, cols.status, cols.updated, cols.actions].map((h) => (
                  <th
                    className="px-4 py-3 text-left text-sm font-medium text-neutral-600"
                    key={h}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {experiences.map((item) => (
                <tr className="border-b border-gray-100 last:border-0" key={item.id}>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                    <p className="text-xs text-neutral-500">{item.displayPrice || "—"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    <p>{item.owner.name}</p>
                    <p className="text-xs text-neutral-500">{item.owner.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-neutral-700">
                    <p>{item.status}</p>
                    <p className="text-xs text-neutral-500">
                      {item.isActive ? st.active : st.inactive} ·{" "}
                      {item.isFeatured ? st.featured : st.normal}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void updateExperience(item.id, { isActive: !item.isActive })
                        }
                        type="button"
                      >
                        {item.isActive ? act.disable : act.enable}
                      </button>
                      <button
                        className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void updateExperience(item.id, { isFeatured: !item.isFeatured })
                        }
                        type="button"
                      >
                        {item.isFeatured ? act.unfeature : act.feature}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {experiences.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">{copy.empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
