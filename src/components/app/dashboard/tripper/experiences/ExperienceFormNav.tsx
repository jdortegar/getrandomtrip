// src/components/app/dashboard/tripper/experiences/ExperienceFormNav.tsx
"use client";

import { Button } from "@/components/ui/Button";

interface NavSection {
  id: string;
  label: string;
}

interface PackageFormNavProps {
  sections: NavSection[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  mode: "create" | "edit";
  loading: boolean;
  onCancel: () => void;
  submitLabel: string;
  cancelLabel: string;
}

export default function PackageFormNav({
  sections,
  activeSection,
  onSectionClick,
  mode: _mode,
  loading,
  onCancel,
  submitLabel,
  cancelLabel,
}: PackageFormNavProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <a
            key={section.id}
            href={`#section-${section.id}`}
            onClick={() => onSectionClick(section.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-neutral-100 text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-gray-50"
            }`}
          >
            {section.label}
          </a>
        );
      })}

      <div className="pt-4 space-y-2 border-t border-gray-100 mt-2">
        <Button
          type="submit"
          className="w-full"
          disabled={loading}
          form="package-form"
        >
          {loading ? "..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
