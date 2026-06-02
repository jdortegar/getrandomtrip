"use client";

import { X } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import type { ActivityEntry, XsedDropDraft } from "@/types/xsed";

interface Props {
  form: XsedDropDraft;
  onChange: (patch: Partial<XsedDropDraft>) => void;
}

const EMPTY_ENTRY: ActivityEntry = {
  name: "",
  durationRhythm: "",
  description: "",
  risks: "",
};

const textareaClass =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-base resize-none min-h-[100px]";

export function XsedActivitiesStep({ form, onChange }: Props) {
  function updateEntry(index: number, key: keyof ActivityEntry, value: string) {
    const updated = form.activities.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry,
    );
    onChange({ activities: updated });
  }

  function addEntry() {
    onChange({ activities: [...form.activities, { ...EMPTY_ENTRY }] });
  }

  function removeEntry(index: number) {
    onChange({ activities: form.activities.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-6">
        {form.activities.map((entry, index) => (
          <div key={index} className="space-y-4">
            {index > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm text-neutral-500">
                  Actividad {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                id={`xsed-act-name-${index}`}
                label={
                  <>
                    <span className="font-semibold text-gray-800">Actividad</span>{" "}
                    <span className="text-red-500">*</span>
                  </>
                }
                placeholder="Ej: City tour..."
                value={entry.name}
                onChange={(e) => updateEntry(index, "name", e.target.value)}
              />

              <FormField
                id={`xsed-act-duration-${index}`}
                label={
                  <span className="font-semibold text-gray-800">Duración</span>
                }
                placeholder="Ej: 3 hs. con ritmo tranquilo"
                value={entry.durationRhythm}
                onChange={(e) => updateEntry(index, "durationRhythm", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="block font-semibold text-gray-800 text-base"
                htmlFor={`xsed-act-desc-${index}`}
              >
                Descripción
              </label>
              <textarea
                id={`xsed-act-desc-${index}`}
                className={textareaClass}
                placeholder="Ej: en la actividad podrás montar a caballo..."
                value={entry.description}
                onChange={(e) => updateEntry(index, "description", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="block font-semibold text-gray-800 text-base"
                htmlFor={`xsed-act-risks-${index}`}
              >
                Cuidados
              </label>
              <textarea
                id={`xsed-act-risks-${index}`}
                className={textareaClass}
                placeholder="Ej: cuidados que deberían tener..."
                value={entry.risks}
                onChange={(e) => updateEntry(index, "risks", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="w-full rounded-xl border border-dashed border-gray-300 py-4 text-sm text-neutral-500 hover:border-gray-400 hover:text-neutral-700 transition-colors"
      >
        + Agregar actividad
      </button>
    </div>
  );
}
