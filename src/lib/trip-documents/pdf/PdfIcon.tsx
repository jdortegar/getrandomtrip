import { Path, Svg } from "@react-pdf/renderer";
import { colors } from "./pdfStyles";
const paths = {
  water:
    "M4 3v13m5-13v13M4 6h5M4 10h5M2 19q3-4 6 0t6 0t6 0M2 23q3-4 6 0t6 0t6 0",
  massage:
    "m3 15 4-6 3 1-2 5 4 5m9-5-4-6-3 1 2 5-4 5M7 9V2m10 7V2M3 15l-1 6m19-6 1 6",
  food: "M2 12h20a10 10 0 0 1-20 0M6 10V6m6 4V3m6 7V6M7 22h10",
  towel: "M4 3h13a3 3 0 0 1 3 3v13H4zM17 3v13H4M7 19v3m4-3v3m4-3v3m5-3v3",
  bed: "M3 18V6m0 10h18v-5a2 2 0 0 0-2-2H9v7M3 20v-4m18 4v-4M5 9h2v3H5z",
  dinner: "M3 17h18M4 15a8 8 0 0 1 16 0M10 5a2 2 0 0 1 4 0M2 20h20",
  puzzle:
    "M8 3h5v4a3 3 0 1 1 0 6v4H8a3 3 0 1 0-6 0V9h4a3 3 0 1 1 2-6M13 17h7v-6h-3",
  calendar:
    "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2M3 9h18M7 2v5m10-5v5m-9 7 3 3 5-5",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0M16 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  sparkle: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z",
  car: "m5 5-3 8v6h3v-3h14v3h3v-6l-3-8zM3 12h18M6 14h2m8 0h2",
  info: "M12 10v7m0-11v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  warning: "m12 2 10 19H2zM12 8v6m0 3v1",
  check: "m5 12 4 4L19 6",
  arrow: "M2 12h19m-7-7 7 7-7 7",
  coffee:
    "M4 8h12v7a5 5 0 0 1-10 0V8m10 1h3a3 3 0 0 1 0 6h-3M4 22h14M8 2v3m5-3v3",
  wifi: "M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8 16a6 6 0 0 1 8 0m-4 4h.01",
  parking: "M6 22V2h8a6 6 0 0 1 0 12h-4m0 8V6h4a2 2 0 0 1 0 4h-4",
};
export interface PdfIconProps {
  name: keyof typeof paths;
  color?: string;
  size?: number;
}
export function PdfIcon({
  name,
  color = colors.cyan,
  size = 16,
}: PdfIconProps) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d={paths[name]}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}
