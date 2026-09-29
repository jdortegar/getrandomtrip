export default function PreferencePills({
  lodging,
  style,
}: {
  lodging?: string;
  style?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2" data-component="PreferencePills">
      {lodging && <span className="rt-badge uppercase">{lodging}</span>}
      {style?.map((s) => (
        <span key={s} className="rt-badge uppercase">
          {s}
        </span>
      ))}
    </div>
  );
}
