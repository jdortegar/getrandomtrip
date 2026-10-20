interface SegmentLabelProps {
  children: React.ReactNode;
}

/** Read-only category label (design-system manual chip style) for segment names and the system marker. */
export function SegmentLabel({ children }: SegmentLabelProps) {
  return (
    <span
      className="inline-block rounded-[6px] border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-sky-700"
      data-component="SegmentLabel"
    >
      {children}
    </span>
  );
}
