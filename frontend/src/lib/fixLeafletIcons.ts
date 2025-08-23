// frontend/src/lib/fixLeafletIcons.ts
import L from "leaflet";

export function fixLeafletIcons() {
  if (typeof window === "undefined") return; // evita SSR
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    // CDN rápido (cambiar a /leaflet/... si prefieres hostear local en /public/leaflet/)
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}