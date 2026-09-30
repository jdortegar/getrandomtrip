import { Badge } from "@/components/ui/Badge";

export default function PreferencePills({
  lodging,
  style,
}: {
  lodging?: string;
  style?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2" data-component="PreferencePills">
      {lodging && <Badge kind="preference" label={lodging} />}
      {style?.map((s) => (
        <Badge
          key={s}
          kind="preference"
          label={s}
        />
      ))}
    </div>
  );
}
