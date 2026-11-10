import type {
  DesignSystemColorDict,
  DesignSystemSwatchKey,
} from "@/lib/types/dictionary";

interface ColorMappingTableProps {
  copy: DesignSystemColorDict;
}

const mapping: [DesignSystemSwatchKey, string, string | null][] = [
  ["deepTeal", "deep-teal", "primary"],
  ["mineralSage", "mineral-sage", "secondary"],
  ["ochre", "ochre", "feature"],
  ["offWhite", "off-white", "ground"],
  ["canyonClay", "canyon-clay", "xsed"],
  ["deepTealDark", "deep-teal-dark", null],
  ["sageDark", "sage-dark", null],
  ["skyDrift", "sky-drift", null],
  ["ink", "ink", "ink"],
];

export function ColorMappingTable({ copy }: ColorMappingTableProps) {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-xl shadow-sm">
      <div className="p-6">
        <h3 className="font-semibold text-xl">{copy.mapping.title}</h3>
        <p className="max-w-2xl mt-1 text-neutral-600 text-sm">
          {copy.mapping.description}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="text-left w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {[
                copy.mapping.brand,
                copy.mapping.palette,
                copy.mapping.role,
              ].map((label) => (
                <th
                  className="font-semibold px-5 py-3 text-[11px] text-left text-neutral-500 tracking-wider uppercase"
                  key={label}
                  scope="col"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-gray-100 divide-y">
            {mapping.map(([key, palette, role]) => (
              <tr key={key}>
                <th
                  className="font-semibold px-5 py-4 text-ink text-sm"
                  scope="row"
                >
                  <span className="flex gap-2 items-center">
                    <span
                      aria-hidden
                      className="border border-gray-300 h-3 rounded-full shrink-0 w-3"
                      style={{ backgroundColor: `var(--color-${palette})` }}
                    />
                    {copy.swatches[key].name}
                  </span>
                </th>
                <td className="px-5 py-4 text-neutral-700 text-sm">
                  <code className="font-mono">{palette}</code>
                </td>
                <td className="px-5 py-4 text-neutral-700 text-sm">
                  {role ? (
                    <code className="font-mono">{role}</code>
                  ) : (
                    copy.mapping.none
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
