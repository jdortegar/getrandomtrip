import type { DocumentMetadata } from "@/lib/types/DocumentMetadata";

export interface XsedRoadmapStop {
  id: string;
  title: string;
  directions: string;
  date?: string;
  time?: string;
}

export interface XsedRoadmapData {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  drivingDuration: string;
  stops: XsedRoadmapStop[];
  mapUrl?: string;
}

export interface XsedRoadmapDocument extends DocumentMetadata {
  template: "xsed-roadmap";
  templateVersion: 1;
  data: XsedRoadmapData;
}
