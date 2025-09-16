export default function PreferencePills({ lodging, style }: { lodging?: string; style?: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {lodging && <span className="rt-badge">{lodging}</span>}
      {style?.map(s => <span key={s} className="rt-badge">{s}</span>)}
    </div>
  );
}
